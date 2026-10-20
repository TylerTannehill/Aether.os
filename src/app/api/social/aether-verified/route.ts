import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

type Claim = { membership_id: string };
type Membership = { id: string; organization_id: string; role: string | null; created_at: string | null };
type Organization = { id: string; product_context: string | null };

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

async function context() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Verification service is not configured");

  const admin = createSupabaseAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("social_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  return { admin, profileId: (profile?.id as string | undefined) ?? null };
}

async function experience(admin: NonNullable<Awaited<ReturnType<typeof context>>>["admin"], profileId: string) {
  const { data: claims, error: claimError } = await admin
    .from("social_aether_claims")
    .select("membership_id")
    .eq("profile_id", profileId);
  if (claimError) throw claimError;

  const ids = [...new Set(((claims ?? []) as Claim[]).map(claim => claim.membership_id))];
  if (!ids.length) return [];

  const { data: memberships, error: membershipError } = await admin
    .from("organization_members")
    .select("id, organization_id, role, created_at")
    .in("id", ids);
  if (membershipError) throw membershipError;

  const rows = (memberships ?? []) as Membership[];
  const orgIds = [...new Set(rows.map(row => row.organization_id))];
  const { data: organizations, error: orgError } = await admin
    .from("organizations")
    .select("id, product_context")
    .in("id", orgIds);
  if (orgError) throw orgError;
  const orgById = new Map(((organizations ?? []) as Organization[]).map(org => [org.id, org]));

  // Existing data provides membership start and current role, not historical role transitions.
  // Return one row per membership; the UI can group roles without disclosing organizations.
  return rows.flatMap(row => {
    const org = orgById.get(row.organization_id);
    if (!org) return [];
    const start = row.created_at ? new Date(row.created_at) : null;
    const months = start && !Number.isNaN(start.getTime())
      ? Math.max(0, Math.round((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
      : null;
    return [{
      membership_id: row.id,
      product: org.product_context === "business" ? "Business" : "Political",
      role: row.role ?? "general_user",
      months,
    }];
  });
}

export async function GET(request: Request) {
  try {
    const ctx = await context();
    if (!ctx) return failure("Not authenticated", 401);

    const requestedProfileId = new URL(request.url).searchParams.get("profile_id");
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (requestedProfileId && !uuidPattern.test(requestedProfileId)) {
      return failure("Invalid Social profile ID", 400);
    }

    // No parameter: retain the existing signed-in user's experience behavior.
    // A profile_id parameter: return only the public-facing summary for that profile.
    const targetProfileId = requestedProfileId ?? ctx.profileId;
    if (!targetProfileId) return failure("Social profile not found", 404);

    if (requestedProfileId) {
      const { data: publicProfile, error: publicProfileError } = await ctx.admin
        .from("social_profiles")
        .select("id")
        .eq("id", targetProfileId)
        .maybeSingle();
      if (publicProfileError) throw publicProfileError;
      if (!publicProfile) return failure("Social profile not found", 404);
    }

    const rows = await experience(ctx.admin, targetProfileId);
    // Public reads never expose internal membership IDs or organization details.
    const publicExperience = rows.map(({ product, role, months }) => ({ product, role, months }));
    return NextResponse.json({ experience: requestedProfileId ? publicExperience : rows }, { headers: noStore });
  } catch {
    return failure("Unable to load Aether experience", 500);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await context();
    if (!ctx) return failure("Not authenticated", 401);
    if (!ctx.profileId) return failure("Social profile not found", 404);

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return failure("Invalid request", 400);
    const input = body as Record<string, unknown>;
    const organizationSlug = typeof input.organization_slug === "string" ? input.organization_slug.trim().toLowerCase() : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(organizationSlug) || organizationSlug.length > 120 || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return failure("Enter a valid organization slug and membership email", 400);
    }

    const { data: organization, error: organizationError } = await ctx.admin
      .from("organizations")
      .select("id")
      .ilike("slug", organizationSlug)
      .maybeSingle();
    if (organizationError) throw organizationError;
    if (!organization) return failure("No matching Aether membership found", 404);

    // Exact organization + normalized email match. Never send the stored email or org details back.
    const { data: members, error: lookupError } = await ctx.admin
      .from("organization_members")
      .select("id, membership_email")
      .eq("organization_id", organization.id)
      .ilike("membership_email", email)
      .limit(10);
    if (lookupError) throw lookupError;
    const matched = (members ?? []).find(member =>
      typeof member.membership_email === "string" && member.membership_email.trim().toLowerCase() === email
    );
    if (!matched) return failure("No matching Aether membership found", 404);

    const { error: saveError } = await ctx.admin
      .from("social_aether_claims")
      .upsert({ profile_id: ctx.profileId, membership_id: matched.id }, { onConflict: "profile_id,membership_id", ignoreDuplicates: true });
    if (saveError) throw saveError;

    return NextResponse.json({ success: true, experience: await experience(ctx.admin, ctx.profileId) }, { headers: noStore });
  } catch {
    return failure("Unable to verify Aether membership", 500);
  }
}
