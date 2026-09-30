"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Shield,
  Sparkles,
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
        });
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
      },
    [profile]
  );

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

            <div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div className="max-w-md">
                <Sparkles className="mx-auto h-7 w-7 text-slate-400" />
                <h3 className="mt-3 font-semibold text-slate-900">
                  More profile controls will live here
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Preferences, notifications, execution context, and other
                  personal controls will be connected as the Business
                  experience develops.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
