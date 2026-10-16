import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET = "social-employer-avatars";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type ProfileUpdate = {
  name?: unknown;
  description?: unknown;
  website_url?: unknown;
  location?: unknown;
};

type EmployerAccess = {
  admin: SupabaseClient;
  employerId: string;
  organizationId: string;
};

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value !== null && typeof value !== "string") throw new Error(`${field} must be text or null.`);
  const clean = typeof value === "string" ? value.trim() : "";
  if (clean.length > maxLength) throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  return clean || null;
}

// Resolve the employer from the authenticated user's selected organization.
// Never accept an employer ID from the browser for a write operation.
async function resolveEmployerAccess(): Promise<EmployerAccess | NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Not authenticated", 401);

  const cookieStore = await cookies();
  const employerOrgId = cookieStore.get("social_employer_organization_id")?.value;
  const activeOrgId = cookieStore.get("active_organization_id")?.value;
  if (!employerOrgId || employerOrgId !== activeOrgId) {
    return fail("No active employer organization selected", 403);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Employer access service is not configured", 503);

  const admin = createSupabaseAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: appUser, error: userError } = await admin
    .from("users").select("id, is_active").eq("auth_id", user.id).maybeSingle();
  if (userError) return fail("Unable to verify user", 500);
  if (!appUser || appUser.is_active === false) return fail("Employer access denied", 403);

  const { data: membership, error: membershipError } = await admin
    .from("organization_members").select("role")
    .eq("user_id", appUser.id).eq("organization_id", employerOrgId).maybeSingle();
  if (membershipError) return fail("Unable to verify membership", 500);
  if (!membership || !["admin", "director"].includes(String(membership.role ?? "").toLowerCase())) {
    return fail("Employer access requires an administrator or director", 403);
  }

  const { data: entitlement, error: entitlementError } = await admin
    .from("social_organization_entitlements").select("plan")
    .eq("organization_id", employerOrgId).maybeSingle();
  if (entitlementError) return fail("Unable to verify Social entitlement", 500);
  if (!entitlement || !["needle", "haystack"].includes(entitlement.plan)) {
    return fail("Social employer access is not provisioned", 403);
  }

  const { data: employer, error: employerError } = await admin
    .from("social_job_employers")
    .select("id, organization_id, status")
    .eq("organization_id", employerOrgId).maybeSingle();
  if (employerError) return fail("Unable to load employer", 500);
  if (!employer) return fail("No linked employer record found", 404);
  if (employer.status !== "active") return fail("Employer is not active", 403);

  return { admin, employerId: employer.id, organizationId: employerOrgId };
}

function isOwnedPhotoPath(path: string | null, employerId: string): path is string {
  return Boolean(path && path.startsWith(`employers/${employerId}/`) && !path.includes(".."));
}

async function getExistingLogo(admin: SupabaseClient, employerId: string) {
  return admin.from("social_job_employers")
    .select("logo_path")
    .eq("id", employerId).single();
}

function detectedImageType(bytes: Uint8Array): { extension: string; contentType: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)) {
    return { extension: "png", contentType: "image/png" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}

export async function PATCH(request: Request) {
  try {
    const access = await resolveEmployerAccess();
    if (access instanceof NextResponse) return access;
    const { admin, employerId, organizationId } = access;

    let body: ProfileUpdate;
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("Invalid profile data", 400);
      body = parsed as ProfileUpdate;
    } catch {
      return fail("Invalid JSON body", 400);
    }

    const allowed = ["name", "description", "location", "website_url"];
    if (Object.keys(body).some((field) => !allowed.includes(field))) return fail("Unsupported profile field", 400);
    if (!allowed.every((field) => Object.prototype.hasOwnProperty.call(body, field))) return fail("Missing profile fields", 400);

    let name: string;
    let description: string | null;
    let location: string | null;
    let website_url: string | null;
    try {
      if (typeof body.name !== "string" || !body.name.trim()) return fail("Organization name is required", 400);
      name = body.name.trim();
      if (name.length > 160) return fail("Organization name must be 160 characters or fewer", 400);
      description = optionalText(body.description, "Description", 4000);
      location = optionalText(body.location, "Location", 160);
      website_url = optionalText(body.website_url, "Website", 2000);
      if (website_url) {
        const parsed = new URL(website_url);
        if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
          return fail("Website must be a valid http:// or https:// URL", 400);
        }
      }
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Invalid profile fields", 400);
    }

    const { data: updated, error: updateError } = await admin
      .from("social_job_employers")
      .update({ name, description, location, website_url, updated_at: new Date().toISOString() })
      .eq("id", employerId).eq("organization_id", organizationId).eq("status", "active")
      .select("id, name, description, location, website_url, logo_path")
      .single();

    if (updateError) return fail("Unable to save employer profile", 500);
    return NextResponse.json({ employer: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Unable to save employer profile", 500);
  }
}

// Upload or replace the company photo. Send multipart/form-data with a "photo" File.
export async function POST(request: Request) {
  try {
    const access = await resolveEmployerAccess();
    if (access instanceof NextResponse) return access;
    const { admin, employerId, organizationId } = access;

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_PHOTO_BYTES + 1024 * 1024) return fail("Photo must be 5 MB or smaller", 413);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
      return fail("Upload must use multipart/form-data", 400);
    }

    let photo: FormDataEntryValue | null;
    try {
      const form = await request.formData();
      photo = form.get("photo");
    } catch {
      return fail("Unable to read photo upload", 400);
    }
    if (!(photo instanceof File)) return fail("Choose a photo to upload", 400);
    if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) return fail("Photo must be between 1 byte and 5 MB", 400);
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      return fail("Photo must be JPEG, PNG, or WebP", 400);
    }

    const bytes = new Uint8Array(await photo.arrayBuffer());
    const detected = detectedImageType(bytes);
    if (!detected || detected.contentType !== photo.type) return fail("Photo file format is invalid", 400);

    const { data: existing, error: existingError } = await getExistingLogo(admin, employerId);
    if (existingError) return fail("Unable to load current employer photo", 500);

    const newPath = `employers/${employerId}/${crypto.randomUUID()}.${detected.extension}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(newPath, bytes, {
      contentType: detected.contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) return fail(`Unable to upload employer photo: ${uploadError.message}`, 500);

    // A null logo_path must use IS NULL, not equality with NULL.
    // Keep the compare-and-swap guard to avoid overwriting a concurrent photo change.
    let updateQuery = admin
      .from("social_job_employers")
      .update({ logo_path: newPath, updated_at: new Date().toISOString() })
      .eq("id", employerId).eq("organization_id", organizationId).eq("status", "active");
    updateQuery = existing?.logo_path
      ? updateQuery.eq("logo_path", existing.logo_path)
      : updateQuery.is("logo_path", null);
    const { data: updated, error: updateError } = await updateQuery
      .select("id, logo_path").maybeSingle();

    if (updateError || !updated) {
      await admin.storage.from(BUCKET).remove([newPath]);
      return fail("Unable to save employer photo; please try again", updateError ? 500 : 409);
    }

    // Only remove files in this employer's own folder, after the new path is saved.
    if (isOwnedPhotoPath(existing?.logo_path ?? null, employerId)) {
      await admin.storage.from(BUCKET).remove([existing!.logo_path]);
    }

    return NextResponse.json({ logo_path: newPath, employer: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Unable to upload employer photo", 500);
  }
}

// Remove the company's current photo and restore the fallback icon on both profile views.
export async function DELETE() {
  try {
    const access = await resolveEmployerAccess();
    if (access instanceof NextResponse) return access;
    const { admin, employerId, organizationId } = access;

    const { data: existing, error: existingError } = await getExistingLogo(admin, employerId);
    if (existingError) return fail("Unable to load current employer photo", 500);
    if (!existing?.logo_path) {
      return NextResponse.json({ logo_path: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data: updated, error: updateError } = await admin
      .from("social_job_employers")
      .update({ logo_path: null, updated_at: new Date().toISOString() })
      .eq("id", employerId).eq("organization_id", organizationId).eq("status", "active")
      .eq("logo_path", existing.logo_path)
      .select("id, logo_path").maybeSingle();

    if (updateError || !updated) return fail("Unable to remove employer photo; please try again", updateError ? 500 : 409);

    if (isOwnedPhotoPath(existing.logo_path, employerId)) {
      await admin.storage.from(BUCKET).remove([existing.logo_path]);
    }

    return NextResponse.json({ logo_path: null, employer: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Unable to remove employer photo", 500);
  }
}
