import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type JobStatus = "draft" | "published" | "paused" | "closed";
type JobInput = Record<string, unknown>;

const listingColumns = "id,employer_id,title,description,category,location,work_arrangement,employment_type,experience_level,salary_min,salary_max,salary_currency,salary_period,application_url,application_email,status,published_at,updated_at";
const optionalStrings = ["category", "location", "work_arrangement", "employment_type", "experience_level", "salary_period", "application_url", "application_email"] as const;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function resolveEmployer() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: fail("Not authenticated", 401) };

  const cookieStore = await cookies();
  const orgId = cookieStore.get("social_employer_organization_id")?.value;
  const activeOrgId = cookieStore.get("active_organization_id")?.value;
  if (!orgId || orgId !== activeOrgId || !validId(orgId)) {
    return { error: fail("No active employer organization selected", 403) };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: fail("Employer access service is not configured", 503) };

  const admin = createSupabaseAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: appUser, error: userError } = await admin
    .from("users").select("id, is_active").eq("auth_id", user.id).maybeSingle();
  if (userError) return { error: fail("Unable to verify user", 500) };
  if (!appUser || appUser.is_active === false) return { error: fail("Employer access denied", 403) };

  const { data: membership, error: membershipError } = await admin
    .from("organization_members").select("role")
    .eq("user_id", appUser.id).eq("organization_id", orgId).maybeSingle();
  if (membershipError) return { error: fail("Unable to verify membership", 500) };
  if (!membership || !["admin", "director"].includes(String(membership.role ?? "").toLowerCase())) {
    return { error: fail("Employer access requires an administrator or director", 403) };
  }

  const { data: entitlement, error: entitlementError } = await admin
    .from("social_organization_entitlements").select("plan")
    .eq("organization_id", orgId).maybeSingle();
  if (entitlementError) return { error: fail("Unable to verify Social entitlement", 500) };
  if (!entitlement || !["needle", "haystack"].includes(entitlement.plan)) {
    return { error: fail("Social employer access is not provisioned", 403) };
  }

  const { data: employer, error: employerError } = await admin
    .from("social_job_employers").select("id,status")
    .eq("organization_id", orgId).maybeSingle();
  if (employerError) return { error: fail("Unable to load employer", 500) };
  if (!employer) return { error: fail("No linked employer record found", 404) };
  if (employer.status !== "active") return { error: fail("Employer is not active", 403) };

  return { admin, employerId: employer.id as string, authUserId: user.id, plan: entitlement.plan as string };
}

function parseListing(value: unknown): { data?: JobInput; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Invalid job data" };
  const body = value as JobInput;
  if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 250) return { error: "A valid job title is required" };
  if (typeof body.description !== "string" || !body.description.trim() || body.description.length > 50000) return { error: "A valid job description is required" };

  const data: JobInput = { title: body.title.trim(), description: body.description.trim(), salary_currency: "USD" };
  for (const key of optionalStrings) {
    const value = body[key];
    if (value !== undefined && value !== null && typeof value !== "string") return { error: `Invalid ${key}` };
    if (typeof value === "string" && value.length > (key === "application_url" ? 2000 : 500)) return { error: `${key} is too long` };
    data[key] = typeof value === "string" ? (value.trim() || null) : null;
  }
  for (const key of ["salary_min", "salary_max"] as const) {
    const value = body[key];
    if (value === "" || value === null || value === undefined) { data[key] = null; continue; }
    if (typeof value !== "number" && typeof value !== "string") return { error: `Invalid ${key}` };
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 1000000000) return { error: `Invalid ${key}` };
    data[key] = n;
  }
  if (typeof data.salary_min === "number" && typeof data.salary_max === "number" && data.salary_max < data.salary_min) {
    return { error: "Maximum salary cannot be below minimum salary" };
  }
  if (data.application_url) {
    try {
      const u = new URL(String(data.application_url));
      if (!["http:", "https:"].includes(u.protocol)) return { error: "Application URL must use HTTP or HTTPS" };
    } catch { return { error: "Invalid application URL" }; }
  }
  if (data.application_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.application_email))) {
    return { error: "Invalid application email" };
  }
  return { data };
}

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("promotions") === "1") {
    return getPromotions();
  }
  try {
    const access = await resolveEmployer();
    if (access.error) return access.error;
    const { data, error } = await access.admin!.from("social_job_listings")
      .select(listingColumns).eq("employer_id", access.employerId!)
      .order("updated_at", { ascending: false });
    if (error) return fail("Unable to load job listings", 500);
    return NextResponse.json({ listings: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch { return fail("Unable to load job listings", 500); }
}

export async function POST(request: Request) {
  try {
    const access = await resolveEmployer();
    if (access.error) return access.error;
    const body = await request.json() as JobInput;
    if (body.action === "promote_job") return publishPromotion(access, body);
    const parsed = parseListing(body);
    if (!parsed.data) return fail(parsed.error ?? "Invalid listing", 400);
    const status: JobStatus = body.status === "published" ? "published" : "draft";
    if (body.status !== undefined && !["draft", "published"].includes(String(body.status))) return fail("Invalid initial status", 400);
    if (status === "published" && !parsed.data.application_url && !parsed.data.application_email) {
      return fail("An application URL or email is required to publish", 400);
    }
    const now = new Date().toISOString();
    const { data, error } = await access.admin!.from("social_job_listings")
      .insert({ ...parsed.data, employer_id: access.employerId, created_by: access.authUserId,
        status, published_at: status === "published" ? now : null, updated_at: now })
      .select(listingColumns).single();
    if (error) return fail(`Unable to create listing: ${error.message}`, 500);
    return NextResponse.json({ listing: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return fail("Unable to create listing", 500); }
}

export async function PATCH(request: Request) {
  try {
    const access = await resolveEmployer();
    if (access.error) return access.error;
    const body = await request.json() as JobInput;
    if (!validId(body.id)) return fail("A valid listing ID is required", 400);

    const { data: existing, error: findError } = await access.admin!.from("social_job_listings")
      .select(listingColumns).eq("id", body.id).eq("employer_id", access.employerId!).maybeSingle();
    if (findError) return fail("Unable to verify listing", 500);
    if (!existing) return fail("Listing not found for this employer", 404);

    const allowed: JobStatus[] = ["draft", "published", "paused", "closed"];
    if (body.status !== undefined && !allowed.includes(body.status as JobStatus)) return fail("Invalid listing status", 400);
    if (existing.status === "closed" && body.status !== undefined && body.status !== "closed") {
      return fail("Closed listings cannot be reopened", 400);
    }
    const status = (body.status ?? existing.status) as JobStatus;
    let changes: JobInput = {};
    const isContentUpdate = body.title !== undefined || body.description !== undefined || optionalStrings.some(k => body[k] !== undefined) || body.salary_min !== undefined || body.salary_max !== undefined;
    if (isContentUpdate) {
      const parsed = parseListing({ ...existing, ...body });
      if (!parsed.data) return fail(parsed.error ?? "Invalid listing", 400);
      changes = parsed.data;
    }
    const applicationUrl = changes.application_url ?? existing.application_url;
    const applicationEmail = changes.application_email ?? existing.application_email;
    if (status === "published" && !applicationUrl && !applicationEmail) {
      return fail("An application URL or email is required to publish", 400);
    }
    const now = new Date().toISOString();
    const { data, error } = await access.admin!.from("social_job_listings")
      .update({ ...changes, status, updated_at: now,
        ...(status === "published" && !existing.published_at ? { published_at: now } : {}) })
      .eq("id", body.id).eq("employer_id", access.employerId!).select(listingColumns).single();
    if (error) return fail(`Unable to update listing: ${error.message}`, 500);
    return NextResponse.json({ listing: data }, { headers: { "Cache-Control": "no-store" } });
  } catch { return fail("Unable to update listing", 500); }
}


// Haystack feed promotions are handled by the existing employer-jobs API.
// GET /api/social/employer-jobs?promotions=1
// POST /api/social/employer-jobs { action: "promote_job", job_id: "..." }
async function getPromotions() {
  try {
    const access = await resolveEmployer();
    if (access.error) return access.error;
    if (access.plan !== "haystack") return fail("Feed promotions require a Haystack plan", 403);

    const { data, error } = await access.admin!.from("social_posts")
      .select("job_id")
      .eq("employer_id", access.employerId!)
      .not("job_id", "is", null);
    if (error) return fail("Unable to load feed promotion status", 500);
    return NextResponse.json(
      { promoted_job_ids: (data ?? []).map((row) => row.job_id) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return fail("Unable to load feed promotion status", 500);
  }
}

async function publishPromotion(
  access: Awaited<ReturnType<typeof resolveEmployer>>,
  body: JobInput
) {
  if (access.plan !== "haystack") return fail("Feed promotions require a Haystack plan", 403);
  if (!validId(body.job_id)) return fail("A valid job ID is required", 400);

  const { data: job, error: jobError } = await access.admin!.from("social_job_listings")
    .select("id,employer_id,title,description,location,status")
    .eq("id", body.job_id)
    .eq("employer_id", access.employerId!)
    .maybeSingle();
  if (jobError) return fail("Unable to verify job listing", 500);
  if (!job) return fail("Job listing not found for this employer", 404);
  if (job.status !== "published") return fail("Only published jobs can be promoted", 400);

  const title = String(job.title ?? "").trim();
  const description = String(job.description ?? "").replace(/\s+/g, " ").trim();
  if (!title || !description) return fail("Job listing is missing required content", 400);
  const summary = description.length > 900 ? `${description.slice(0, 897)}...` : description;
  const location = job.location ? `Location: ${String(job.location).trim()}\n` : "";
  const content = `We're hiring: ${title}\n\n${summary}\n\n${location}Find this opportunity on Aether Social Jobs: https://aetheros.pro/social/jobs`;

  const { data: post, error: insertError } = await access.admin!.from("social_posts")
    .insert({
      author_id: null,
      employer_id: access.employerId,
      job_id: job.id,
      context: "professional",
      content,
    })
    .select("id,job_id")
    .single();
  if (insertError) {
    if (insertError.code === "23505") return fail("This job has already been promoted to the feed", 409);
    return fail("Unable to publish job promotion", 500);
  }
  return NextResponse.json(
    { post, promoted_job_id: job.id },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
