"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Search, Shield, UserPlus, Users } from "lucide-react";

type TeamMember = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  is_active?: boolean | null;
};

type MemberRole = {
  organization_member_id?: string | null;
  department?: string | null;
  role_level?: string | null;
  is_primary?: boolean | null;
};

type TeamResponse = {
  organizationId?: string;
  members?: TeamMember[];
  roles?: MemberRole[];
  error?: string;
};

function displayDepartment(value?: string | null) {
  return (value || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BusinessTeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<MemberRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [provisionedModules, setProvisionedModules] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "general_user">("general_user");
  const [newDepartments, setNewDepartments] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadTeam() {
      try {
        const response = await fetch("/api/admin/org-members", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as TeamResponse;
        if (!response.ok) throw new Error(data.error || "Unable to load team members.");
        setOrganizationId(data.organizationId || "");
        setMembers(Array.isArray(data.members) ? data.members : []);
        setRoles(Array.isArray(data.roles) ? data.roles : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load team members.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadTeam();
    async function loadModules() {
      try {
        const response = await fetch("/api/auth/current-context", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) setProvisionedModules(
          Array.isArray(data.business_modules) ? data.business_modules.map((value: string) => String(value).toLowerCase()) : []
        );
      } catch { /* Roster remains usable even if provisioning cannot load. */ }
    }
    void loadModules();
    return () => controller.abort();
  }, []);

  const businessDepartments = ["crm", "marketing", "inventory", "dispatch", "finance"];

  async function addTeamMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    const email = newEmail.trim().toLowerCase();
    if (!email || !newEmail.includes("@")) { setCreateError("Enter a valid email address."); return; }
    if (newPassword.length < 6) { setCreateError("The initial password must be at least 6 characters."); return; }
    if (!newDepartments.length) { setCreateError("Select at least one department."); return; }
    if (!organizationId || !provisionedModules.length) { setCreateError("Organization provisioning is unavailable."); return; }
    if (newDepartments.some((department) => !provisionedModules.includes(department))) {
      setCreateError("A selected department is not provisioned for this organization."); return;
    }
    setCreating(true);
    let created = false;
    try {
      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: newPassword,
          role: newRole,
          department: newDepartments[0],
          title: "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to add team member.");
      created = true;
      // The creation endpoint assigns a primary department. Apply any additional
      // departments through the existing role-assignment endpoint.
      const rosterResponse = await fetch("/api/admin/org-members", { cache: "no-store" });
      const roster = (await rosterResponse.json()) as TeamResponse;
      if (!rosterResponse.ok) throw new Error(roster.error || "Member created, but roster refresh failed.");
      const createdMember = (roster.members || []).find((member) => member.email?.trim().toLowerCase() === email);
      if (newDepartments.length > 1) {
        if (!createdMember) throw new Error("Member created, but their record could not be found to assign additional departments.");
        const assignResponse = await fetch("/api/admin/member-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization_member_id: createdMember.id,
            organization_id: roster.organizationId || organizationId,
            roles: newDepartments.map((department, index) => ({
              department,
              role_level: newRole === "admin" ? "admin" : "user",
              is_primary: index === 0,
            })),
          }),
        });
        const assignment = await assignResponse.json();
        if (!assignResponse.ok) throw new Error(assignment.error || "Member created, but additional department assignment failed.");
      }
      const updatedResponse = await fetch("/api/admin/org-members", { cache: "no-store" });
      const updated = (await updatedResponse.json()) as TeamResponse;
      if (!updatedResponse.ok) throw new Error(updated.error || "Member created, but roster refresh failed.");
      setMembers(Array.isArray(updated.members) ? updated.members : []);
      setRoles(Array.isArray(updated.roles) ? updated.roles : []);
      setNewEmail("");
      setNewPassword("");
      setNewRole("general_user");
      setNewDepartments([]);
      setCreateSuccess(`Team member ${email} created. Share the initial password securely.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to add team member.";
      setCreateError(created ? `Account created, but setup is incomplete: ${message} Check the roster before retrying.` : message);
    } finally {
      setCreating(false);
    }
  }


  function openEditor(member: TeamMember) {
    const departments = Array.from(new Set([
      ...roles.filter((role) => role.organization_member_id === member.id)
        .map((role) => (role.department || "").trim().toLowerCase()).filter(Boolean),
      ...(member.department ? [member.department.trim().toLowerCase()] : []),
    ]));
    setSelectedDepartments(departments.filter((department) => businessDepartments.includes(department)));
    setEditingId(member.id);
    setEditError("");
    setEditSuccess("");
  }

  function toggleDepartment(department: string) {
    setSelectedDepartments((current) => current.includes(department)
      ? current.filter((value) => value !== department)
      : [...current, department]);
  }

  async function saveDepartments(member: TeamMember) {
    if (!organizationId) { setEditError("Organization context is unavailable."); return; }
    if (!selectedDepartments.length) { setEditError("Select at least one department."); return; }
    if (selectedDepartments.some((department) => !provisionedModules.includes(department))) {
      setEditError("One or more departments are not provisioned for this organization."); return;
    }
    setSaving(true);
    setEditError("");
    try {
      const nextRoles = selectedDepartments.map((department, index) => ({
        department,
        role_level: member.role?.toLowerCase() === "admin" ? "admin" : "user",
        is_primary: index === 0,
      }));
      const response = await fetch("/api/admin/member-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_member_id: member.id, organization_id: organizationId, roles: nextRoles }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save departments.");
      const refreshed = await fetch("/api/admin/org-members", { cache: "no-store" });
      const updated = (await refreshed.json()) as TeamResponse;
      if (!refreshed.ok) throw new Error(updated.error || "Saved, but unable to refresh roster.");
      setMembers(Array.isArray(updated.members) ? updated.members : []);
      setRoles(Array.isArray(updated.roles) ? updated.roles : []);
      setEditingId(null);
      setEditSuccess(`Departments updated for ${member.name || member.email || "team member"}.`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Unable to save departments.");
    } finally {
      setSaving(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => {
      const departments = roles
        .filter((role) => role.organization_member_id === member.id)
        .map((role) => role.department || "")
        .join(" ");
      return [member.name, member.email, member.role, member.department, departments]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [members, roles, search]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
          <div className="space-y-4">
            <Link href="/business/dashboard/admin" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Admin Control
            </Link>
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-300"><Shield className="h-4 w-4" /> Organization administration</div>
              <h1 className="text-3xl font-semibold tracking-tight">Manage Team</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">View the people who have access to this organization.</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><UserPlus className="h-5 w-5 text-slate-700" /></div>
              <div><p className="text-sm font-medium text-slate-500">Organization access</p><h2 className="text-2xl font-semibold text-slate-900">Add team member</h2></div>
            </div>
            <p className="mt-4 text-sm text-slate-600">Create an organization account with an initial password and access to provisioned departments.</p>
            <form onSubmit={(event) => void addTeamMember(event)} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">Email address
                  <input type="email" required value={newEmail} onChange={(event) => setNewEmail(event.target.value)} disabled={creating} placeholder="team.member@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
                </label>
                <label className="block text-sm font-medium text-slate-700">Initial password
                  <input type="text" required minLength={6} autoComplete="off" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={creating} placeholder="Set an initial password" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">Organization role
                <select value={newRole} onChange={(event) => setNewRole(event.target.value as "admin" | "general_user")} disabled={creating} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  <option value="general_user">General User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div>
                <p className="text-sm font-medium text-slate-700">Department access</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {businessDepartments.filter((department) => provisionedModules.includes(department)).map((department) => (
                    <label key={department} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                      <input type="checkbox" checked={newDepartments.includes(department)} disabled={creating} onChange={() => setNewDepartments((current) => current.includes(department) ? current.filter((item) => item !== department) : [...current, department])} className="h-4 w-4" />
                      {displayDepartment(department)}
                    </label>
                  ))}
                </div>
                {!provisionedModules.length && <p className="mt-2 text-sm text-amber-700">Provisioned modules unavailable. Creation is disabled.</p>}
              </div>
              {createError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</p>}
              {createSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{createSuccess}</p>}
              <button type="submit" disabled={creating || loading || !organizationId || !provisionedModules.length} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{creating ? "Adding team member…" : "Add Team Member"}</button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Organization members</p>
                <h2 className="text-2xl font-semibold text-slate-900">Current team</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Live members of the active organization, with their roles and departments.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Users className="h-4 w-4" /> {loading ? "Loading…" : `${members.length} member${members.length === 1 ? "" : "s"}`}
              </div>
            </div>
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search team members..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-slate-500" />
            </div>
            {editSuccess && <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{editSuccess}</div>}
            {error ? (
              <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : loading ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">Loading organization members…</div>
            ) : filteredMembers.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">{members.length ? "No team members match your search." : "No organization members found."}</div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredMembers.map((member) => {
                  const assignedDepartments = Array.from(new Set([
                    ...roles.filter((role) => role.organization_member_id === member.id).map((role) => role.department?.trim().toLowerCase()).filter((value): value is string => Boolean(value)),
                    ...(member.department ? [member.department.trim().toLowerCase()] : []),
                  ]));
                  return (
                    <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{member.name || member.email || "Unnamed member"}</p>
                          {member.email && <p className="break-all text-sm text-slate-600">{member.email}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{member.role?.toLowerCase() === "admin" ? "Admin" : "General User"}</span>
                          <button type="button" onClick={() => editingId === member.id ? setEditingId(null) : openEditor(member)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400" ><Pencil className="h-4 w-4" /> {editingId === member.id ? "Close" : "Edit"}</button>
                        </div>
                      </div>
                      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">Departments</p>
                      <p className="mt-1 text-sm text-slate-700">{assignedDepartments.length ? assignedDepartments.map(displayDepartment).join(", ") : "None assigned"}</p>
                      {editingId === member.id && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                          <h3 className="text-base font-semibold text-slate-900">Edit department access</h3>
                          <p className="mt-1 text-sm text-slate-600">Role: {member.role?.toLowerCase() === "admin" ? "Admin" : "General User"}. Role changes will be connected separately.</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            {businessDepartments.filter((department) => provisionedModules.includes(department)).map((department) => (
                              <label key={department} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                                <input type="checkbox" checked={selectedDepartments.includes(department)} onChange={() => toggleDepartment(department)} disabled={saving} className="h-4 w-4" />
                                {displayDepartment(department)}
                              </label>
                            ))}
                          </div>
                          {provisionedModules.length === 0 && <p className="mt-3 text-sm text-amber-700">Provisioned modules could not be loaded. Saving is unavailable.</p>}
                          {editError && <p role="alert" className="mt-3 text-sm text-red-700">{editError}</p>}
                          <div className="mt-5 flex flex-wrap gap-3">
                            <button type="button" onClick={() => void saveDepartments(member)} disabled={saving || !provisionedModules.length} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save departments"}</button>
                            <button type="button" onClick={() => setEditingId(null)} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                          </div>
                        </div>
                      )}
                      {member.is_active === false && <p className="mt-2 text-xs font-medium text-amber-700">Inactive profile</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><Shield className="h-5 w-5 text-slate-700" /></div>
            <div><p className="text-sm font-medium text-slate-500">Business access model</p><h2 className="text-xl font-semibold text-slate-900">Roles, permissions &amp; provisioning</h2></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">Admins can access all provisioned Business departments. General users see only provisioned departments assigned to them. Department assignments can be edited above. Admin/General User role changes will be connected separately.</p>
        </section>
      </div>
    </main>
  );
}
