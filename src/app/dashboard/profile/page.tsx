"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Briefcase,
  CheckCircle2,
  Clock3,
  Flame,
  Shield,
  Trophy,
  UserCircle2,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PreferenceOption = "overview" | "focus" | "outreach" | "admin";

type LiveProfile = {
  email: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  title: string;
  organizationName: string;
  status: string;
  tagline: string;
};

function formatRoleLabel(role?: string | null) {
  if (!role) return "Member";

  if (role === "general_user") return "General User";

  return role
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

export default function DashboardProfilePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [abeBriefingEnabled, setAbeBriefingEnabled] = useState(true);
  const [defaultLanding, setDefaultLanding] =
    useState<PreferenceOption>("overview");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [liveProfile, setLiveProfile] = useState<LiveProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("No authenticated user found.");
        }

        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select(
            `
              role,
              department,
              title,
              organizations (
                name
              )
            `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) {
          throw membershipError;
        }

        const displayName = getDisplayNameFromUser(user);
        const orgRecord = Array.isArray(membership?.organizations)
          ? membership?.organizations?.[0]
          : membership?.organizations;

        const organizationName =
          orgRecord?.name ||
          "No organization assigned yet";

        const roleLabel = formatRoleLabel(membership?.role);
        const departmentLabel =
          membership?.department || "No department assigned";
        const titleLabel = membership?.title || "No title assigned";

        if (!isMounted) return;

        setLiveProfile({
          email: String(user.email || ""),
          name: displayName,
          initials: buildInitials(displayName),
          role: roleLabel,
          department: departmentLabel,
          title: titleLabel,
          organizationName,
          status: "Active today",
          tagline: "Building the operating system for execution.",
        });
      } catch (err: any) {
        if (!isMounted) return;
        setProfileError(err?.message || "Failed to load profile.");
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

  const identity = useMemo(() => {
    return (
      liveProfile ?? {
        email: "",
        name: "Loading profile...",
        initials: "TT",
        role: "Member",
        department: "Loading department...",
        title: "Loading title...",
        organizationName: "Loading organization...",
        status: "Loading...",
        tagline: "Building the operating system for execution.",
      }
    );
  }, [liveProfile]);

  const operatorStats = useMemo(() => {
    return {
      completedActions: 42,
      outreachTouches: 128,
      tasksClosed: 18,
      openItems: 11,
      blockedItems: 3,
      lastActive: "Today",
      currentMode: "Execution-forward",
    };
  }, []);

  const streaks = useMemo(() => {
    return {
      executionDays: 3,
      outreachDays: 5,
    };
  }, []);

  const badges = useMemo(() => {
    return [
      {
        label: "First 50 Actions",
        tone: "border-amber-200 bg-amber-50 text-amber-900",
      },
      {
        label: "Consistent Operator",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      },
      {
        label: "Outreach Driver",
        tone: "border-sky-200 bg-sky-50 text-sky-900",
      },
    ];
  }, []);

  const accessSummary = useMemo(() => {
    const base = [
      `${identity.role}-level visibility inside the current organization`,
      `Primary operating department: ${identity.department}`,
      `Title in current org: ${identity.title}`,
      `Organization context: ${identity.organizationName}`,
    ];

    if (identity.role.toLowerCase() === "admin") {
      return [
        ...base,
        "Admin-level visibility across dashboard, departments, and governance surfaces",
        "Cross-domain operating access for outreach, finance, field, digital, and print",
      ];
    }

    return base;
  }, [identity]);

  const orgContext = useMemo(() => {
    return {
      reportsTo: identity.role === "Admin" ? "Top-level org owner" : "Campaign Manager",
      manages:
        identity.role === "Admin"
          ? ["Field Director", "Digital Director", "Finance Director"]
          : [],
      visibilityNote:
        "Aether can use role, department, and reporting structure to shape what you see and what you can act on.",
      chatNote:
        "This same org context can later power lightweight internal chat, routing, and team-specific communication.",
    };
  }, [identity]);

  const executionHistory = useMemo(() => {
    return [
      {
        label: "Actions completed this week",
        value: "42",
        subtext: "Across outreach, routing, and review flows",
      },
      {
        label: "Most active domain",
        value: "Outreach",
        subtext: "Primary operating surface this week",
      },
      {
        label: "Blocked reviews handled",
        value: "7",
        subtext: "Governance friction surfaced and reviewed",
      },
      {
        label: "Average response cadence",
        value: "< 24h",
        subtext: "Follow-up rhythm staying healthy",
      },
    ];
  }, []);

  const recentActivity = useMemo(() => {
    return [
      "Reviewed admin control updates and stabilized execution surfaces.",
      "Opened finance and outreach priority flows from dashboard command center.",
      "Closed profile routing so My Profile now lives inside dashboard context.",
      "Refined system-risk visibility for cleaner governance review.",
    ];
  }, []);

  const quickLinks = useMemo(() => {
    return [
      {
        label: "Open Focus Mode",
        href: "/dashboard/focus",
        tone:
          "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
      },
      {
        label: "Go to Outreach",
        href: "/dashboard/outreach",
        tone:
          "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
      },
      {
        label: "Open Admin Control",
        href: "/dashboard/admin",
        tone:
          "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
      },
      {
        label: "Back to Dashboard",
        href: "/dashboard",
        tone: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      },
    ];
  }, []);

  return (
    <div className="space-y-8">
      {profileError ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-sm">
          {profileError}
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-700">
              {identity.initials}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <UserCircle2 className="h-4 w-4" />
                Operator profile
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                  {identity.name}
                </h1>
                <p className="text-sm text-slate-600 lg:text-base">
                  {identity.role} • {identity.department}
                </p>
                <p className="text-sm text-slate-500">{identity.tagline}</p>
                {identity.email ? (
                  <p className="text-xs text-slate-400">{identity.email}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {profileLoading ? "Loading..." : identity.status}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
                  <Flame className="h-3.5 w-3.5" />
                  {streaks.executionDays} Day Execution Streak
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900">
                  <Zap className="h-3.5 w-3.5" />
                  {streaks.outreachDays} Day Outreach Streak
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.label}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${badge.tone}`}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current mode
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {operatorStats.currentMode}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Last active
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {operatorStats.lastActive}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-800">
              Actions completed
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {operatorStats.completedActions}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Execution movement this week
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs uppercase tracking-wide text-sky-800">
              Outreach touches
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {operatorStats.outreachTouches}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Contact activity across live lanes
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-800">
              Tasks closed
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {operatorStats.tasksClosed}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Work completed and cleared
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-violet-800">
            <Shield className="h-4 w-4" />
            Org + role
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Organization
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.organizationName}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Role
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.role}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Department
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.department}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Title
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.title}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Reports to
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {orgContext.reportsTo}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Primary leadership context for escalation and alignment.
                </p>
              </div>

              {orgContext.manages.length > 0 ? (
                <div className="rounded-2xl border border-violet-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Manages
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {orgContext.manages.map((person) => (
                      <div
                        key={person}
                        className="rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800"
                      >
                        {person}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Access summary
                </p>
                <div className="mt-3 space-y-2">
                  {accessSummary.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Visibility model
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {orgContext.visibilityNote}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Future communication layer
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {orgContext.chatNote}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Bell className="h-4 w-4" />
            Preferences
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Enable system alerts and operator updates
                </p>
              </div>

              <button
                onClick={() => setNotificationsEnabled((prev) => !prev)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  notificationsEnabled
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {notificationsEnabled ? "On" : "Off"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">
                Default landing view
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  ["overview", "focus", "outreach", "admin"] as PreferenceOption[]
                ).map((option) => (
                  <button
                    key={option}
                    onClick={() => setDefaultLanding(option)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      defaultLanding === option
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Honest Abe daily briefing
                </p>
                <p className="text-xs text-slate-500">
                  Future AI-generated operator brief at start of day
                </p>
              </div>

              <button
                onClick={() => setAbeBriefingEnabled((prev) => !prev)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  abeBriefingEnabled
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {abeBriefingEnabled ? "On" : "Off"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Bot className="h-4 w-4 text-sky-700" />
                Operator note
              </div>
              <p className="mt-2 text-sm text-slate-600">
                This page is meant to become your personal operating layer inside
                Aether — not just an account page, but a reflection of how the
                system sees you as an active operator.
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4" />
            Operator snapshot
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Open items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.openItems}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Blocked items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.blockedItems}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4" />
            Execution history
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {executionHistory.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.subtext}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-sm text-sky-800">
            <Briefcase className="h-4 w-4" />
            Quick links
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${item.tone}`}
              >
                {item.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-emerald-800">
          <Clock3 className="h-4 w-4" />
          Recent activity
        </div>

        <div className="mt-5 space-y-3">
          {recentActivity.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}