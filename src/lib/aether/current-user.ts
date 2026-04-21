import { createClient } from "@/lib/supabase/server";

type OrganizationRecord = {
  id: string;
  name: string;
};

type MembershipRecord = {
  role: string | null;
  department: string | null;
  title: string | null;
  organizations: OrganizationRecord | OrganizationRecord[] | null;
};

export async function getCurrentUserContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      department,
      title,
      organizations (
        id,
        name
      )
    `
    )
    .eq("user_id", user.id)
    .maybeSingle<MembershipRecord>();

  if (membershipError) {
    console.error("Failed to load organization membership:", membershipError);
    return {
      user,
      organization: null,
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
    role: membership?.role ?? null,
    department: membership?.department ?? null,
    title: membership?.title ?? null,
  };
}