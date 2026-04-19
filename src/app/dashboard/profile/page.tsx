"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Briefcase,
  CheckCircle2,
  Clock3,
  Shield,
  Sparkles,
  UserCircle2,
  Zap,
} from "lucide-react";

type PreferenceOption = "overview" | "focus" | "outreach" | "admin";
type WorkingStyle = "execution" | "strategy" | "governance";

export default function DashboardProfilePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [abeBriefingEnabled, setAbeBriefingEnabled] = useState(true);
  const [defaultLanding, setDefaultLanding] =
    useState<PreferenceOption>("overview");
  const [workingStyle, setWorkingStyle] =
    useState<WorkingStyle>("execution");

  const identity = useMemo(() => {
    return {
      name: "Tyler Tannehill",
      initials: "TT",
      role: "Admin",
      department: "Campaign Operations",
      status: "Active today",
      tagline: "Building the operating system for execution.",
    };
  }, []);

  const operatorStats = useMemo(() => {
    return {
      completedActions: 42,
      openItems: 11,
      blockedItems: 3,
      outreachTouches: 128,
      lastActive: "Today",
      currentMode: "Execution-forward",
    };
  }, []);

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

  const accessSummary = useMemo(() => {
    return [
      "Admin-level visibility across dashboard, departments, and governance surfaces",
      "Cross-domain operating access for outreach, finance, field, digital, and print",
      "Execution review privileges with control-layer visibility",
      "Policy and system-state oversight access",
    ];
  }, []);

  const orgContext = useMemo(() => {
    return {
      reportsTo: "Campaign Manager",
      manages: ["Field Director", "Digital Director", "Finance Director"],
      visibilityNote:
        "This is the first layer of org-aware visibility. Aether can use role, department, and reporting structure to shape what you see and what you can act on.",
      chatNote:
        "This same org context can later power lightweight internal chat, routing, and team-specific communication without turning Aether into a generic messaging app.",
    };
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
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-700">
              {identity.initials}
            </div>

            <div className="space-y-3">
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
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {identity.status}
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
      </section>

      <section className="grid gap-4 xl:grid-cols-6">
        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2 text-sm text-sky-800">
            <Zap className="h-4 w-4" />
            Operator snapshot
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Actions completed
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.completedActions}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Open items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.openItems}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Blocked items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.blockedItems}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Outreach touches
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.outreachTouches}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2 text-sm text-indigo-800">
            <Shield className="h-4 w-4" />
            Role + access
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Role
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {identity.role}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Department
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {identity.department}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
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
          </div>
        </div>

        <div className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2 text-sm text-fuchsia-800">
            <Sparkles className="h-4 w-4" />
            Working style
          </div>

          <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Default operating posture
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["execution", "strategy", "governance"] as WorkingStyle[]).map(
                (option) => (
                  <button
                    key={option}
                    onClick={() => setWorkingStyle(option)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      workingStyle === option
                        ? "bg-fuchsia-900 text-white"
                        : "border border-fuchsia-200 bg-white text-fuchsia-800"
                    }`}
                  >
                    {option}
                  </button>
                )
              )}
            </div>

            <p className="mt-4 text-sm text-slate-600">
              This is the operator mode Aether should optimize around first as
              the system grows more personalized.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Future AI profile note
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Aether will eventually use this page to understand how you prefer
              to work, what surfaces you rely on most, and how to brief you
              more effectively.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-violet-800">
          <Shield className="h-4 w-4" />
          Org context
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Reports to
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {orgContext.reportsTo}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Primary leadership context for escalation, review, and cross-org
                alignment.
              </p>
            </div>

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

              <p className="mt-3 text-sm text-slate-600">
                Early org-tree context for role-based visibility, team routing,
                and future assignment logic.
              </p>
            </div>
          </div>
                    <div className="space-y-4">
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

      <section className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4" />
            Execution history
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                <p className="mt-1 text-sm text-slate-600">
                  {item.subtext}
                </p>
              </div>
            ))}
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
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
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

        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-sky-800">
            <Briefcase className="h-4 w-4" />
            Quick links
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

          <div className="mt-4 rounded-2xl border border-sky-200 bg-white p-4">
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
        </section>
      </section>
    </div>
  );
}