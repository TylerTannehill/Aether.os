import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type OrganizationRecord = {
  id: string;
  name: string;
  slug: string | null;
};

type MembershipRecord = {
  id: string;
  role: string | null;
  department: string | null;
  title: string | null;
  organization_id: string;
  organizations: OrganizationRecord | OrganizationRecord[] | null;
};

export async function getCurrentUserContext() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const activeOrganizationId = cookieStore.get("active_organization_id")?.value;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  if (!activeOrganizationId) {
    return {
      user,
      organization: null,
      membership: null,
      role: null,
      department: null,
      title: null,
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      role,
      department,
      title,
      organization_id,
      organizations (
        id,
        name,
        slug
      )
    `
    )
    .eq("user_id", user.id)
    .eq("organization_id", activeOrganizationId)
    .maybeSingle<MembershipRecord>();

  if (membershipError) {
    console.error("Failed to load active organization membership:", membershipError);
    return {
      user,
      organization: null,
      membership: null,
      role: null,
      department: null,
      title: null,
    };
  }

  const organization = Array.isArray(membership?.organizations)
    ? membership?.organizations?.[0] ?? null
    : membership?.organizations ?? null;

  return {
    user,
    organization,
    membership: membership ?? null,
    role: membership?.role ?? null,
    department: membership?.department ?? null,
    title: membership?.title ?? null,
  };
}