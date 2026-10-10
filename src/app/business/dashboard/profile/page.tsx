"use client";

import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Shield,
  Sparkles,
  CheckCircle2,
  UserCircle2,
} from "lucide-react";

type ProfileStatus =
  | "active"
  | "busy"
  | "inactive"
  | "break"
  | "lunch"
  | "potato";

type LiveProfile = {
  email: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  title: string;
  organizationName: string;
  status: ProfileStatus;
  accessDepartments: string[];
};

const PROFILE_STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "busy", label: "Busy" },
  { value: "inactive", label: "Inactive" },
  { value: "break", label: "Break" },
  { value: "lunch", label: "Lunch" },
  { value: "potato", label: "Potato" },
];

function normalizeProfileStatus(value?: string | null): ProfileStatus {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "active" ||
    normalized === "busy" ||
    normalized === "inactive" ||
    normalized === "break" ||
    normalized === "lunch" ||
    normalized === "potato"
  ) {
    return normalized;
  }

  return "active";
}

function formatRoleLabel(role?: string | null) {
  const value = String(role || "").trim();

  if (!value) return "Member";
  if (value === "general_user") return "General User";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getDisplayNameFromUser(user: any) {
  const metadataName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name;

  if (metadataName && String(metadataName).trim()) {
    return String(metadataName).trim();
  }

  const email = String(user?.email || "").trim();
  if (!email) return "Unknown User";

  const emailPrefix = email.split("@")[0] || "user";

  return emailPrefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BusinessProfilePage() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState<LiveProfile | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const [taskCounts, setTaskCounts] = useState<{ incomplete: number; completed: number } | null>(null);
  const [taskCountsError, setTaskCountsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const response = await fetch("/api/auth/current-context", {
          method: "GET",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load organization context.");
        }

        const user = data?.user;
        const membership = data?.membership;
        const organization = data?.organization;

        if (!user) {
          throw new Error("No authenticated user found.");
        }

        const displayName =
          String(user?.name || "").trim() || getDisplayNameFromUser(user);

        if (!isMounted) return;

        const provisioned: string[] = Array.isArray(data?.business_modules)
          ? data.business_modules.map((value: unknown) => String(value).trim().toLowerCase())
          : [];
        const assigned: string[] = Array.isArray(data?.roles)
          ? data.roles.map((entry: any) => String(entry?.department || "").trim().toLowerCase()).filter(Boolean)
          : [];
        const fallbackDepartment = String(membership?.department || "").trim().toLowerCase();
        if (fallbackDepartment) assigned.push(fallbackDepartment);
        const isAdmin = String(membership?.role || "").trim().toLowerCase() === "admin";
        const accessDepartments = Array.from(new Set(isAdmin
          ? provisioned
          : assigned.filter((department) => provisioned.includes(department))));

        setProfile({
          email: String(user?.email || ""),
          name: displayName,
          initials: buildInitials(displayName),
          role: formatRoleLabel(membership?.role),
          department: String(membership?.department || ""),
          title: String(membership?.title || ""),
          organizationName: String(
            organization?.name || "No organization assigned yet"
          ),
          status: normalizeProfileStatus(membership?.profile_status),
          accessDepartments,
        });

        // Reuse Projects & Tasks membership matching; task metrics are personal.
        // Keep a metrics failure separate from the existing profile experience.
        if (organization?.id) {
          try {
            const teamResponse = await fetch("/api/tools/team-status", { credentials: "include" });
            if (!teamResponse.ok) throw new Error("Unable to load team membership.");
            const teamData = await teamResponse.json();
            if (String(teamData?.organization_id || "") !== String(organization.id)) {
              throw new Error("Team organization does not match your current organization.");
            }
            const members = Array.isArray(teamData?.members) ? teamData.members : [];
            const membershipId = String(membership?.id ?? "").trim();
            const userId = String(user?.id ?? "").trim();
            const authId = String(user?.auth_id ?? "").trim();
            const self = members.find((member: any) =>
              (membershipId && member.id === membershipId) ||
              (userId && member.user_id === userId) ||
              (authId && member.user_id === authId)
            );
            if (!self) throw new Error("Unable to identify your team membership.");

            const [assignmentResult, workResult] = await Promise.all([
              supabase.from("business_work_assignments")
                .select("work_item_id")
                .eq("organization_id", organization.id)
                .eq("organization_member_id", self.id),
              supabase.from("business_work_items")
                .select("id,status")
                .eq("organization_id", organization.id),
            ]);
            if (assignmentResult.error) throw assignmentResult.error;
            if (workResult.error) throw workResult.error;
            const assignedIds = new Set(
              (assignmentResult.data ?? []).map((row: any) => String(row.work_item_id))
            );
            const assignedWork = (workResult.data ?? []).filter((row: any) => assignedIds.has(String(row.id)));
            if (isMounted) {
              setTaskCounts({
                incomplete: assignedWork.filter((row: any) => row.status !== "done").length,
                completed: assignedWork.filter((row: any) => row.status === "done").length,
              });
            }
          } catch (taskError: any) {
            if (isMounted) setTaskCountsError(taskError?.message || "Unable to load task counts.");
          }
        }
      } catch (error: any) {
        if (!isMounted) return;
        setProfileError(error?.message || "Failed to load profile.");
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const identity = useMemo(
    () =>
      profile ?? {
        email: "",
        name: "Loading profile...",
        initials: "--",
        role: "Member",
        department: "",
        title: "",
        organizationName: "Loading organization...",
        status: "active" as ProfileStatus,
        accessDepartments: [],
      },
    [profile]
  );

  async function changeStatus(nextStatus: ProfileStatus) {
    if (!profile || statusSaving || nextStatus === profile.status) return;
    setStatusSaving(true);
    setStatusError("");
    setStatusSuccess("");
    try {
      const response = await fetch("/api/profile/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to update status.");
      const savedStatus = normalizeProfileStatus(result?.membership?.profile_status);
      setProfile((current) => current ? { ...current, status: savedStatus } : current);
      setStatusSuccess(`Status updated to ${PROFILE_STATUS_OPTIONS.find((option) => option.value === savedStatus)?.label || savedStatus}.`);
    } catch (error: any) {
      setStatusError(error?.message || "Unable to update status.");
    } finally {
      setStatusSaving(false);
    }
  }

  const statusLabel =
    PROFILE_STATUS_OPTIONS.find((option) => option.value === identity.status)
      ?.label || "Active";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {profileError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {profileError}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-slate-700 bg-slate-800 text-2xl font-semibold">
                {identity.initials}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <UserCircle2 className="h-4 w-4" />
                  My Profile
                </div>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  {identity.name}
                </h1>

                {identity.email ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="h-4 w-4" />
                    {identity.email}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Status: {profileLoading ? "Loading..." : statusLabel}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200">
                    <Shield className="h-3.5 w-3.5" />
                    {identity.role}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>
          </div>
        </section>

        <section aria-label="My task progress" className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">My Incomplete Tasks</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{taskCounts ? taskCounts.incomplete : "—"}</p>
            <p className="mt-2 text-xs text-slate-500">Assigned work that is not completed</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">My Completed Tasks</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{taskCounts ? taskCounts.completed : "—"}</p>
            <p className="mt-2 text-xs text-slate-500">Assigned work marked completed</p>
          </div>
          {taskCountsError ? <p className="text-sm text-rose-700 sm:col-span-2" role="alert">Task counts unavailable: {taskCountsError}</p> : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3">
                <Building2 className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current organization
                </p>
                <h2 className="text-xl font-semibold text-slate-950">
                  Organization Context
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Organization
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {identity.organizationName}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {identity.title || "No title assigned"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {identity.department || "No department assigned"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Access role
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {identity.role}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3">
                <UserCircle2 className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Personal operating layer
                </p>
                <h2 className="text-xl font-semibold text-slate-950">
                  Profile Controls
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900">My status</h3>
                <p className="mt-1 text-sm text-slate-600">Choose how your team sees your availability.</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PROFILE_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => void changeStatus(option.value)}
                      disabled={profileLoading || statusSaving || !profile}
                      aria-pressed={identity.status === option.value}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${identity.status === option.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"}`}
                    >
                      {identity.status === option.value && <CheckCircle2 className="h-4 w-4" />}
                      {option.label}
                    </button>
                  ))}
                </div>
                {statusSaving && <p role="status" className="mt-3 text-sm text-slate-500">Saving status…</p>}
                {statusError && <p role="alert" className="mt-3 text-sm text-rose-700">{statusError}</p>}
                {statusSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">{statusSuccess}</p>}
              </div>
              <div className="border-t border-slate-200 pt-5">
                <h3 className="font-semibold text-slate-900">My department access</h3>
                <p className="mt-1 text-sm text-slate-600">Departments available to you in this organization.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileLoading ? (
                    <span className="text-sm text-slate-500">Loading access…</span>
                  ) : identity.accessDepartments.length ? (
                    identity.accessDepartments.map((department) => (
                      <span key={department} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium capitalize text-slate-800">
                        {department.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No provisioned department access found.</span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-500">{identity.role === "Admin" ? "Admins can access every provisioned Business department." : "General users can access only their assigned, provisioned Business departments."}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
