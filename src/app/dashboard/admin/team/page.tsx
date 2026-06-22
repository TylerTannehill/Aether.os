"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Shield, UserPlus, Users } from "lucide-react";

type OperatingDepartment =
  | "admin"
  | "campaign"
  | "outreach"
  | "finance"
  | "field"
  | "digital"
  | "print";

type OperatingRoleLevel = "admin" | "campaign_manager" | "director" | "user";
type AetherTier = "t1" | "t2" | "t3";

type OrgMemberRecord = {
  id: string;
  user_id?: string | null;
  auth_id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  title?: string | null;
  organization_id?: string | null;
  created_at?: string | null;
};

type OrgMemberRole = {
  id?: string;
  organization_member_id: string;
  organization_id?: string | null;
  department: OperatingDepartment | string;
  role_level: OperatingRoleLevel | string;
  is_primary: boolean;
};

type RoleDraft = {
  department: OperatingDepartment;
  role_level: OperatingRoleLevel;
  is_primary: boolean;
};

const DEPARTMENT_OPTIONS: { value: OperatingDepartment; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "campaign", label: "Campaign" },
  { value: "finance", label: "Finance" },
  { value: "field", label: "Field" },
  { value: "outreach", label: "Outreach" },
  { value: "digital", label: "Digital" },
  { value: "print", label: "Print" },
];

const ROLE_LEVEL_OPTIONS: { value: OperatingRoleLevel; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "campaign_manager", label: "Campaign Manager" },
  { value: "director", label: "Director" },
  { value: "user", label: "User" },
];

function normalizeAetherTier(value?: string | null): AetherTier {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "t1") return "t1";
  if (normalized === "t2") return "t2";

  return "t3";
}

function canSelectDepartmentForNewUser(
  tier: AetherTier,
  department: OperatingDepartment
) {
  if (tier !== "t1") return true;

  return department !== "finance" && department !== "digital";
}

function formatRoleText(value?: string | null) {
  if (!value) return "Unassigned";

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMemberDisplayName(member: OrgMemberRecord) {
  return (
    member.name ||
    member.email ||
    member.title ||
    "Unknown User"
  );
}

function buildDefaultRoleFromMember(member?: OrgMemberRecord | null): RoleDraft {
  const department = String(member?.department || "campaign").toLowerCase();
  const role = String(member?.role || "user").toLowerCase();

  return {
    department: DEPARTMENT_OPTIONS.some((item) => item.value === department)
      ? (department as OperatingDepartment)
      : "campaign",
    role_level:
      role === "admin"
        ? "admin"
        : role === "director"
          ? "director"
          : role === "campaign_manager"
            ? "campaign_manager"
            : "user",
    is_primary: false,
  };
}

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [message, setMessage] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [aetherTier, setAetherTier] = useState<AetherTier>("t3");
  const [members, setMembers] = useState<OrgMemberRecord[]>([]);
  const [roles, setRoles] = useState<OrgMemberRole[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, RoleDraft>>({});
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteDepartment, setInviteDepartment] =
    useState<OperatingDepartment>("campaign");
  const [inviteRole, setInviteRole] = useState<OperatingRoleLevel>("user");

  async function loadAetherTierContext() {
    try {
      const response = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) return;

      const nextTier = normalizeAetherTier(data?.organization?.aether_tier);

      setAetherTier(nextTier);

      if (
        nextTier === "t1" &&
        (inviteDepartment === "finance" || inviteDepartment === "digital")
      ) {
        setInviteDepartment("campaign");
      }
    } catch (error) {
      console.error("Failed to load Aether tier context", error);
    }
  }

  async function loadTeam() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/org-members", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Failed to load team members.");
        return;
      }

      const nextMembers = Array.isArray(data.members) ? data.members : [];

      setOrganizationId(data.organizationId || null);
      setMembers(nextMembers);
      setRoles(Array.isArray(data.roles) ? data.roles : []);

      setRoleDrafts((current) => {
        const next = { ...current };

        nextMembers.forEach((member: OrgMemberRecord) => {
          if (!next[member.id]) {
            next[member.id] = buildDefaultRoleFromMember(member);
          }
        });

        return next;
      });
    } catch (err: any) {
      setMessage(err?.message || "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAetherTierContext();
    loadTeam();
  }, []);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return members;

    return members.filter((member) => {
      const haystack = [
        member.name,
        member.email,
        member.title,
        member.user_id,
        member.role,
        member.department,
        member.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [members, search]);

  const inviteDepartmentOptions = useMemo(() => {
    return DEPARTMENT_OPTIONS.filter((option) =>
      canSelectDepartmentForNewUser(aetherTier, option.value)
    );
  }, [aetherTier]);

  function getRolesForMember(memberId: string) {
    return roles.filter((role) => role.organization_member_id === memberId);
  }

  function updateRoleDraft(memberId: string, updates: Partial<RoleDraft>) {
    setRoleDrafts((current) => ({
      ...current,
      [memberId]: {
        ...(current[memberId] || buildDefaultRoleFromMember()),
        ...updates,
      },
    }));
  }

  async function saveRolesForMember(
    member: OrgMemberRecord,
    nextRoles: OrgMemberRole[]
  ) {
    if (!organizationId && !member.organization_id) {
      setMessage("No organization id found for this member.");
      return false;
    }

    try {
      setSavingMemberId(member.id);
      setMessage("");

      const response = await fetch("/api/admin/member-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_member_id: member.id,
          organization_id: organizationId || member.organization_id,
          roles: nextRoles.map((role) => ({
            department: role.department,
            role_level: role.role_level,
            is_primary: Boolean(role.is_primary),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Failed to save member roles.");
        return false;
      }

      await loadTeam();
      setMessage(`Roles updated for ${getMemberDisplayName(member)}.`);
      return true;
    } catch (err: any) {
      setMessage(err?.message || "Failed to save member roles.");
      return false;
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleCreateMember() {
    if (!inviteEmail.trim()) {
      setMessage("Enter an email address.");
      return;
    }

    if (!invitePassword || invitePassword.length < 6) {
      setMessage("Enter a password with at least 6 characters.");
      return;
    }

    try {
      setCreatingMember(true);
      setMessage("");

      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          password: invitePassword,
          department: inviteDepartment,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Failed to create member.");
        return;
      }

      setInviteEmail("");
      setInvitePassword("");
      setInviteDepartment("campaign");
      setInviteRole("user");

      await loadTeam();

      setMessage("Team member added successfully.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to create member.");
    } finally {
      setCreatingMember(false);
    }
  }

  async function handleRemoveMember(member: OrgMemberRecord) {
    const confirmed = window.confirm(
      `Remove ${getMemberDisplayName(member)} from this organization?`
    );

    if (!confirmed) return;

    try {
      setSavingMemberId(member.id);
      setMessage("");

      const response = await fetch(
        `/api/admin/team-members?member_id=${encodeURIComponent(member.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Failed to remove member.");
        return;
      }

      await loadTeam();

      setMessage("Member removed successfully.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to remove member.");
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleAddRole(member: OrgMemberRecord) {
    const draft = roleDrafts[member.id] || buildDefaultRoleFromMember(member);
    const existingRoles = getRolesForMember(member.id);

    const roleExists = existingRoles.some(
      (role) =>
        role.department === draft.department &&
        role.role_level === draft.role_level
    );

    if (roleExists) {
      setMessage("That role already exists for this team member.");
      return;
    }

    const nextRoles = [
      ...existingRoles.map((role) => ({
        ...role,
        is_primary: draft.is_primary ? false : role.is_primary,
      })),
      {
        organization_member_id: member.id,
        organization_id: organizationId || member.organization_id,
        department: draft.department,
        role_level: draft.role_level,
        is_primary: draft.is_primary || existingRoles.length === 0,
      },
    ];

    await saveRolesForMember(member, nextRoles);
  }

  async function handleRemoveRole(member: OrgMemberRecord, roleId?: string) {
    if (!roleId) return;

    try {
      setSavingMemberId(member.id);
      setMessage("");

      const response = await fetch(
        `/api/admin/member-roles?role_id=${encodeURIComponent(roleId)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Failed to remove member role.");
        return;
      }

      await loadTeam();
      setMessage(`Role removed for ${getMemberDisplayName(member)}.`);
    } catch (err: any) {
      setMessage(err?.message || "Failed to remove member role.");
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleSetPrimaryRole(
    member: OrgMemberRecord,
    primaryRole: OrgMemberRole
  ) {
    const existingRoles = getRolesForMember(member.id);

    const nextRoles = existingRoles.map((role) => ({
      ...role,
      is_primary: role.id === primaryRole.id,
    }));

    await saveRolesForMember(member, nextRoles);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to System Console
            </Link>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Shield className="h-4 w-4" />
                Organization admin
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Manage Team
              </h1>

              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Add, review, and adjust the operating roles that control what each
                team member can see, route, and execute across the campaign.
              </p>
            </div>
          </div>

          <button
            onClick={loadTeam}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {loading ? "Refreshing..." : "Refresh Team"}
          </button>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <UserPlus className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Access</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Add team member
              </h2>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Add a user to this organization, set a temporary password, and assign
            their starting operating lane. New users can log in immediately with
            the password you create here.
          </div>

          <div className="mt-5 space-y-3">
            <input
              type="email"
              placeholder="team.member@example.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />

            <input
              type="text"
              placeholder="Temporary password"
              value={invitePassword}
              onChange={(event) => setInvitePassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={inviteDepartment}
                onChange={(event) =>
                  setInviteDepartment(event.target.value as OperatingDepartment)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {inviteDepartmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as OperatingRoleLevel)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                {ROLE_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateMember}
              disabled={creatingMember}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingMember ? "Adding Member..." : "Add Team Member"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active operators
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Current team
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Search members, assign department roles, set primary lanes, and
                remove outdated access.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Users className="mr-2 inline h-4 w-4" />
              {members.length} member{members.length === 1 ? "" : "s"}
            </div>
          </div>

          <input
            type="search"
            placeholder="Search by email, title, role, department, or member id..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />

          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading team members...
              </div>
            ) : null}

            {!loading && filteredMembers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No team members found.
              </div>
            ) : null}

            {filteredMembers.map((member) => {
              const memberRoles = getRolesForMember(member.id);
              const primaryRole =
                memberRoles.find((role) => role.is_primary) || memberRoles[0];
              const draft =
                roleDrafts[member.id] || buildDefaultRoleFromMember(member);
              const isSaving = savingMemberId === member.id;

              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {getMemberDisplayName(member)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Member ID: {member.id}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Base membership: {formatRoleText(member.role)} •{" "}
                        {member.department || "No department"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        Primary:{" "}
                        {primaryRole
                          ? `${formatRoleText(
                              primaryRole.department
                            )} / ${formatRoleText(primaryRole.role_level)}`
                          : "Not set"}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        disabled={isSaving}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? "Removing..." : "Remove Member"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {memberRoles.length === 0 ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        No operating roles assigned
                      </span>
                    ) : null}

                    {memberRoles.map((role) => (
                      <span
                        key={
                          role.id ||
                          `${role.organization_member_id}-${role.department}-${role.role_level}`
                        }
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                          role.is_primary
                            ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {formatRoleText(role.department)} /{" "}
                        {formatRoleText(role.role_level)}
                        {role.is_primary ? " • primary" : ""}

                        {!role.is_primary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryRole(member, role)}
                            disabled={isSaving}
                            className="text-indigo-700 underline-offset-2 hover:underline disabled:opacity-50"
                          >
                            make primary
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleRemoveRole(member, role.id)}
                          disabled={isSaving}
                          className="text-rose-700 underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          remove
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                    <select
                      value={draft.department}
                      onChange={(event) =>
                        updateRoleDraft(member.id, {
                          department: event.target.value as OperatingDepartment,
                        })
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    >
                      {DEPARTMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={draft.role_level}
                      onChange={(event) =>
                        updateRoleDraft(member.id, {
                          role_level: event.target.value as OperatingRoleLevel,
                        })
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    >
                      {ROLE_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        updateRoleDraft(member.id, {
                          is_primary: !draft.is_primary,
                        })
                      }
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        draft.is_primary
                          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {draft.is_primary ? "Primary" : "Set Primary"}
                    </button>

                    <button
                      onClick={() => handleAddRole(member)}
                      disabled={isSaving}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Add Role"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Quick view</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Active members list
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Simple snapshot of everyone currently attached to this organization.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {members.length} active member{members.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Member</div>
            <div>Base role</div>
            <div>Department</div>
            <div>Primary lane</div>
            <div>Access</div>
          </div>

          {members.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-600">
              No active members found.
            </div>
          ) : null}

          {members.map((member) => {
            const memberRoles = getRolesForMember(member.id);
            const primaryRole =
              memberRoles.find((role) => role.is_primary) || memberRoles[0];
            const isSaving = savingMemberId === member.id;

            return (
              <div
                key={`quick-${member.id}`}
                className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr] items-center border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <div className="font-medium text-slate-900">
                  {getMemberDisplayName(member)}
                </div>

                <div>{formatRoleText(member.role)}</div>

                <div>{member.department || "Unassigned"}</div>

                <div>
                  {primaryRole
                    ? `${formatRoleText(primaryRole.department)} / ${formatRoleText(
                        primaryRole.role_level
                      )}`
                    : "Not set"}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={isSaving}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}