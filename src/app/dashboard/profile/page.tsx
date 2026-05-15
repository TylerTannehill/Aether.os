"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  Bell,
  Bot,
  Briefcase,
  ChevronDown,
  Clock3,
  Flame,
  ListChecks,
  Shield,
  Trophy,
  UserCircle2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

type PreferenceOption = "overview" | "focus" | "outreach" | "admin";

type LiveProfile = {
  email: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  title: string;
  organizationName: string;
  contextMode: string;
  status: string;
  tagline: string;
};

type OrgRole = {
  id: string;
  organization_member_id: string;
  organization_id: string;
  department: string;
  role_level: string;
  is_primary?: boolean | null;
};

type AbeProfileLane = {
  key: string;
  label: string;
  detail: string;
  href: string;
  tone: string;
};

type AbeProfileRead = {
  primary: AbeProfileLane;
  pressure: AbeProfileLane;
  opportunity: AbeProfileLane;
  whyNow: string;
};

function formatRoleLabel(role?: string | null) {
  if (!role) return "Member";

  if (role === "general_user") return "General User";

  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDepartmentLabel(department?: string | null) {
  const value = String(department || "").trim();
  if (!value) return "General";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildRoleBadgeLabel(role: OrgRole) {
  const department = formatDepartmentLabel(role.department);
  const level = formatRoleLabel(role.role_level);

  if (department.toLowerCase() === "admin") {
    return level === "Admin" ? "Admin" : level;
  }

  return `${department} ${level}`;
}

function roleTone(role: OrgRole) {
  const department = String(role.department || "").toLowerCase();

  if (department === "finance") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (department === "field") return "border-sky-200 bg-sky-50 text-sky-900";
  if (department === "digital") return "border-purple-200 bg-purple-50 text-purple-900";
  if (department === "print") return "border-amber-200 bg-amber-50 text-amber-900";
  if (department === "admin") return "border-slate-300 bg-slate-900 text-white";

  return "border-slate-200 bg-slate-50 text-slate-800";
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

function buildLaneMeta(department: string): AbeProfileLane {
  const key = String(department || "outreach").toLowerCase();

  if (key.includes("finance")) {
    return {
      key: "finance",
      label: "Finance",
      detail: "Donor follow-through",
      href: "/dashboard/finance/focus",
      tone: "border-slate-200 bg-white text-slate-900",
    };
  }

  if (key.includes("field")) {
    return {
      key: "field",
      label: "Field",
      detail: "Coverage and follow-up",
      href: "/dashboard/field/focus",
      tone: "border-slate-200 bg-white text-slate-900",
    };
  }

  if (key.includes("digital")) {
    return {
      key: "digital",
      label: "Digital",
      detail: "Content and conversation shaping",
      href: "/dashboard/digital/focus",
      tone: "border-slate-200 bg-white text-slate-900",
    };
  }

  if (key.includes("print")) {
    return {
      key: "print",
      label: "Print",
      detail: "Approvals and delivery",
      href: "/dashboard/print/focus",
      tone: "border-slate-200 bg-white text-slate-900",
    };
  }

  return {
    key: "outreach",
    label: "Outreach",
    detail: "Contact and list movement",
    href: "/dashboard/outreach/focus",
    tone: "border-slate-200 bg-white text-slate-900",
  };
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
  const [orgRoles, setOrgRoles] = useState<OrgRole[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
        });

        const contextData = await contextResponse.json();

        if (!contextResponse.ok) {
          throw new Error(
            contextData?.error || "Failed to load active campaign context."
          );
        }

        const user = contextData?.user;
        const membership = contextData?.membership;
        const organization = contextData?.organization;

        if (!user) {
          throw new Error("No authenticated user found.");
        }

        let currentUserRoles: OrgRole[] = [];

        try {
          const roleResponse = await fetch("/api/admin/org-members");
          const roleData = await roleResponse.json();

          if (roleResponse.ok) {
            const currentMemberId = roleData?.currentMember?.id;
            const roles = Array.isArray(roleData?.roles) ? roleData.roles : [];

            currentUserRoles = roles.filter(
              (role: OrgRole) => role.organization_member_id === currentMemberId
            );
          }
        } catch (roleError) {
          console.error("Failed to load profile role badges:", roleError);
        }

        const displayName = getDisplayNameFromUser(user);

        const organizationName =
          organization?.name ||
          "No organization assigned yet";

        const roleLabel = formatRoleLabel(membership?.role);
        const departmentLabel =
          membership?.department || "No department assigned";
        const titleLabel = membership?.title || "No title assigned";

        if (!isMounted) return;

        setOrgRoles(currentUserRoles);

        setLiveProfile({
          email: String(user.email || ""),
          name: displayName,
          initials: buildInitials(displayName),
          role: roleLabel,
          department: departmentLabel,
          title: titleLabel,
          organizationName,
          contextMode: organization?.context_mode || "default",
          status: "Micro-reset in progress",
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
        contextMode: "default",
        status: "Loading...",
        tagline: "Building the operating system for execution.",
      }
    );
  }, [liveProfile]);

  const primaryRole = useMemo(() => {
    return orgRoles.find((role) => role.is_primary) ?? orgRoles[0] ?? null;
  }, [orgRoles]);

  const roleBadges = useMemo(() => {
    if (orgRoles.length === 0) {
      return [
        {
          label: `${identity.department} ${identity.role}`.trim(),
          tone: "border-slate-200 bg-slate-50 text-slate-800",
          isPrimary: true,
        },
      ];
    }

    return orgRoles.map((role) => ({
      label: buildRoleBadgeLabel(role),
      tone: roleTone(role),
      isPrimary: Boolean(role.is_primary),
    }));
  }, [identity.department, identity.role, orgRoles]);

  const activeDepartments = useMemo(() => {
    const departments = orgRoles
      .map((role) => String(role.department || "").toLowerCase())
      .filter((department) => department && department !== "admin");

    if (departments.length === 0 && identity.department) {
      return [identity.department.toLowerCase()];
    }

    return Array.from(new Set(departments));
  }, [identity.department, orgRoles]);

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

  const currentFocus = useMemo(() => {
    const department = String(primaryRole?.department || identity.department).toLowerCase();

    if (department.includes("finance")) {
      return {
        lane: "Finance",
        detail: "Donor Calls",
        priorityCount: 3,
        note: "High-value follow-ups are ready for execution in Focus Mode.",
        href: "/dashboard/finance/focus",
      };
    }

    if (department.includes("field")) {
      return {
        lane: "Field",
        detail: "Coverage Push",
        priorityCount: 2,
        note: "Active turf and follow-up work are queued for execution.",
        href: "/dashboard/field/focus",
      };
    }

    if (department.includes("print")) {
      return {
        lane: "Print",
        detail: "Asset Support",
        priorityCount: 2,
        note: "Approval, inventory, and delivery work are queued for execution.",
        href: "/dashboard/print/focus",
      };
    }

    return {
      lane: "Operations",
      detail: "Focus Queue",
      priorityCount: operatorStats.openItems,
      note: "Open work is ready in Focus Mode based on your role and department context.",
      href: "/dashboard/focus",
    };
  }, [identity.department, operatorStats.openItems, primaryRole]);

  const activeWorkContext = useMemo(() => {
    const contexts = [
      {
        key: "finance",
        name: "Donor Calls",
        count: 12,
        lane: "Finance",
        summary: "Primary donor call and pledge conversion lane tied to Finance Focus.",
        href: "/dashboard/finance/focus",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        key: "field",
        name: "Turf Completion",
        count: 48,
        lane: "Field",
        summary: "Coverage and follow-up work currently shaping Field Focus.",
        href: "/dashboard/field/focus",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        key: "digital",
        name: "Content + Replies",
        count: 6,
        lane: "Digital",
        summary: "Content creation and conversation-shaping work available in Digital Focus.",
        href: "/dashboard/digital/focus",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        key: "print",
        name: "Approvals + Delivery",
        count: 4,
        lane: "Print",
        summary: "Print approvals and delivery checks supporting downstream execution.",
        href: "/dashboard/print/focus",
        tone: "border-slate-200 bg-white text-slate-900",
      },
    ];

    const visibleContexts = contexts.filter((context) =>
      activeDepartments.some((department) => department.includes(context.key))
    );

    if (visibleContexts.length > 0) {
      return visibleContexts.slice(0, 3);
    }

    return [
      {
        key: "outreach",
        name: "Priority Outreach Targets",
        count: 18,
        lane: "Outreach",
        summary: "Shared contact and list execution layer available across roles.",
        href: "/dashboard/outreach/focus",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        key: "lists",
        name: "Live Lists",
        count: 64,
        lane: "Routing",
        summary: "Lists and segments currently feeding contact, field, and finance execution.",
        href: "/dashboard/lists",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        key: "cleanup",
        name: "Data Cleanup",
        count: 7,
        lane: "Cleanup",
        summary: "Data quality segment that keeps execution lanes clean.",
        href: "/dashboard/lists?name=Missing%20Phone%20Numbers",
        tone: "border-slate-200 bg-white text-slate-900",
      },
    ];
  }, [activeDepartments]);

  const abeProfileRead = useMemo<AbeProfileRead>(() => {
    const departments = activeDepartments.length > 0 ? activeDepartments : ["outreach"];
    const primaryDepartment = String(primaryRole?.department || departments[0] || "outreach").toLowerCase();
    const pressureDepartment = departments.find((department) => department !== primaryDepartment) || primaryDepartment;
    const opportunityDepartment = departments.find((department) => department === "finance") || departments.find((department) => department === "digital") || primaryDepartment;

    const primary = buildLaneMeta(primaryDepartment);
    const pressure = buildLaneMeta(pressureDepartment);
    const opportunity = buildLaneMeta(opportunityDepartment);

    return {
      primary,
      pressure,
      opportunity,
      whyNow:
        primary.key === pressure.key
          ? `${primary.label} is carrying the main operating read right now. ABE and Brain alignment should keep this lane prioritized without adding extra noise.`
          : `${primary.label} is the operator's primary lane, while ${pressure.label} is the lane to watch for pressure. ${opportunity.label} is the cleanest place to look for near-term lift.`,
    };
  }, [activeDepartments, primaryRole]);

  const badges = useMemo(() => {
    return [
      {
        label: "First 50 Actions",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        label: "Consistent Operator",
        tone: "border-slate-200 bg-white text-slate-900",
      },
      {
        label: "Outreach Driver",
        tone: "border-slate-200 bg-white text-slate-900",
      },
    ];
  }, []);

  const accessSummary = useMemo(() => {
    const roleLines = roleBadges.map((badge) =>
      badge.isPrimary ? `${badge.label} · primary operating lane` : badge.label
    );

    const base = [
      `Organization context: ${identity.organizationName}`,
      `Title in current org: ${identity.title}`,
      roleLines.length > 0
        ? `Assigned roles: ${roleLines.join(", ")}`
        : `Legacy role context: ${identity.role} · ${identity.department}`,
    ];

    const hasAdmin = roleBadges.some((badge) =>
      badge.label.toLowerCase().includes("admin")
    );

    if (hasAdmin || identity.role.toLowerCase() === "admin") {
      return [
        ...base,
        "Admin-level visibility across dashboard, departments, and governance surfaces",
        "Cross-domain operating access for outreach, finance, field, digital, and print",
      ];
    }

    return [
      ...base,
      "Department access and Focus surfaces are shaped by assigned roles",
    ];
  }, [identity, roleBadges]);

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
          "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      },
      {
        label: "Go to Outreach",
        href: "/dashboard/outreach",
        tone: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      },
      {
        label: "Open Admin Control",
        href: "/dashboard/admin",
        tone: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
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

      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-700 bg-slate-800 text-2xl font-semibold text-white">
              {identity.initials}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <UserCircle2 className="h-4 w-4" />
                Operator profile
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  {identity.name}
                </h1>
                <p className="text-sm text-slate-300 lg:text-base">
                  {identity.role} • {identity.department}
                </p>
                <p className="text-sm text-slate-400">{identity.tagline}</p>
                {identity.email ? (
                  <p className="text-xs text-slate-400">{identity.email}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
                  <Sparkles className="h-3.5 w-3.5" />
                  🥔 {profileLoading ? "Loading..." : identity.status}
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

              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Assigned roles
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roleBadges.map((badge) => (
                    <div
                      key={`${badge.label}-${badge.isPrimary ? "primary" : "secondary"}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${badge.tone}`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {badge.label}
                      {badge.isPrimary ? (
                        <span className="rounded-full border border-current/20 bg-white/40 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          primary
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span className="font-semibold">Potato status:</span> {identity.status}.
                <span className="ml-2 text-amber-800/80">Brief reset to restore focus and preserve signal quality before returning to execution.</span>
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
            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current mode
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {operatorStats.currentMode}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Last active
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Outreach touches
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {operatorStats.outreachTouches}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Contact activity across live lanes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
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

        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
                <Zap className="h-3.5 w-3.5" />
                Current Focus
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">
                {currentFocus.lane} → {currentFocus.detail}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                {currentFocus.priorityCount} priority item
                {currentFocus.priorityCount === 1 ? "" : "s"} queued. {currentFocus.note}
              </p>
            </div>

            <Link
              href={currentFocus.href}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              Open Focus Mode
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>


          <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  ABE-Aligned Read
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                  Strategy and execution are reading the same profile context
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">
                  This profile now reflects the same lane structure ABE uses to shape attention and the Brain uses to prioritize work.
                </p>
              </div>

              <Link
                href={abeProfileRead.primary.href}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Primary Lane
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <Link
                href={abeProfileRead.primary.href}
                className={`rounded-2xl border p-4 transition hover:shadow-sm ${abeProfileRead.primary.tone}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                  <Zap className="h-3.5 w-3.5" />
                  Primary Lane
                </div>
                <p className="mt-3 text-lg font-semibold">{abeProfileRead.primary.label}</p>
                <p className="mt-1 text-sm opacity-90">{abeProfileRead.primary.detail}</p>
              </Link>

              <Link
                href={abeProfileRead.pressure.href}
                className={`rounded-2xl border p-4 transition hover:shadow-sm ${abeProfileRead.pressure.tone}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Pressure Lane
                </div>
                <p className="mt-3 text-lg font-semibold">{abeProfileRead.pressure.label}</p>
                <p className="mt-1 text-sm opacity-90">{abeProfileRead.pressure.detail}</p>
              </Link>

              <Link
                href={abeProfileRead.opportunity.href}
                className={`rounded-2xl border p-4 transition hover:shadow-sm ${abeProfileRead.opportunity.tone}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Opportunity Lane
                </div>
                <p className="mt-3 text-lg font-semibold">{abeProfileRead.opportunity.label}</p>
                <p className="mt-1 text-sm opacity-90">{abeProfileRead.opportunity.detail}</p>
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">Why now:</span> {abeProfileRead.whyNow}
            </div>
          </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                <ListChecks className="h-3.5 w-3.5" />
                Active Work Context
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">
                Active work context from assigned roles
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                These are the lanes currently shaping what this operator sees, clicks into, and executes inside Aether.
              </p>
            </div>

            <Link
              href="/dashboard/lists"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Review Lists
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {activeWorkContext.map((context) => (
              <Link
                key={context.name}
                href={context.href}
                className={`rounded-2xl border p-4 transition hover:shadow-sm ${context.tone}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{context.name}</p>
                    <p className="mt-1 text-xs opacity-80">{context.lane}</p>
                  </div>
                  <span className="rounded-full border border-current/20 bg-white/60 px-2.5 py-1 text-xs font-semibold">
                    {context.count}
                  </span>
                </div>
                <p className="mt-3 text-sm opacity-90">{context.summary}</p>
              </Link>
            ))}
          </div>
        </div>        </div>
      </section>

      <section className="space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Briefcase className="h-4 w-4" />
            Quick links
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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

        <details className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="h-4 w-4" />
                Organization Context
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Role, access, reporting, and visibility details.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
          </summary>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Organization
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.organizationName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Context: {identity.contextMode}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Role
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.role}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Department
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.department}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Title
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {identity.title}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Manages
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {orgContext.manages.map((person) => (
                      <div
                        key={person}
                        className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {person}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Visibility model
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {orgContext.visibilityNote}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Future communication layer
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {orgContext.chatNote}
                </p>
              </div>
            </div>
          </div>
        </details>

        <details className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Bell className="h-4 w-4" />
                Operator Preferences
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Notifications, default landing behavior, and briefing settings.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
          </summary>

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
                Aether — not just an account page, but a reflection of your
                momentum, role context, and active execution lane.
              </p>
            </div>
          </div>
        </details>

        <details className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Activity className="h-4 w-4" />
                Execution Metrics
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Open work, blocked items, recent execution history, and cadence.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
          </summary>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Open items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.openItems}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Blocked items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorStats.blockedItems}
              </p>
            </div>

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
        </details>

      <section className="hidden" aria-hidden="true">
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
      </section>
    </div>
  );
}