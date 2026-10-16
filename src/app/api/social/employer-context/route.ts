import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
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

    // Privileged reads are constrained by the authenticated user and selected org.
    // Never accept an employer or organization ID from a query parameter.
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
      .select("id, organization_id, name, employer_type, status")
      .eq("organization_id", employerOrgId).maybeSingle();
    if (employerError) return fail("Unable to load employer", 500);
    if (!employer) return fail("No linked employer record found", 404);
    if (employer.status !== "active") return fail("Employer is not active", 403);

    return NextResponse.json({
      employer: {
        id: employer.id,
        name: employer.name,
        employer_type: employer.employer_type,
        status: employer.status,
      },
      plan: entitlement.plan,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Unable to resolve employer context", 500);
  }
}
