"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  DollarSign,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Megaphone,
  Printer,
  Wrench,
  PlugZap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type DepartmentKey = "field" | "outreach" | "digital" | "finance" | "print";

type AetherTier = "t1" | "t2" | "t3";

type NavItem = {
  title: string;
  href: string;
  icon: any;
  department?: DepartmentKey;
  alwaysVisible?: boolean;
};

type OrgMemberRole = {
  department: string;
  role_level: string;
  is_primary?: boolean;
};

type CurrentContextResponse = {
  organization?: {
    id: string;
    name?: string | null;
    slug?: string | null;
    context_mode?: string | null;
    aether_tier?: AetherTier | null;
  } | null;
  membership?: {
    id: string;
    user_id?: string | null;
    organization_id: string;
    role?: string | null;
    department?: string | null;
    title?: string | null;
  } | null;
  roles?: OrgMemberRole[];
  recovered_context?: boolean;
  error?: string;
};

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    alwaysVisible: true,
  },
  {
    title: "Field",
    href: "/dashboard/field",
    icon: MapPinned,
    department: "field",
  },
  {
    title: "Outreach",
    href: "/dashboard/outreach",
    icon: Megaphone,
    alwaysVisible: true,
  },
  {
    title: "Digital",
    href: "/dashboard/digital",
    icon: BarChart3,
    department: "digital",
  },
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: DollarSign,
    department: "finance",
  },
  {
    title: "Print",
    href: "/dashboard/print",
    icon: Printer,
    department: "print",
  },
  {
    title: "FAQ",
    href: "/dashboard/faq",
    icon: BookOpen,
    alwaysVisible: true,
  },
  {
    title: "Integrations",
    href: "/dashboard/integrations",
    icon: PlugZap,
    alwaysVisible: true,
  },
  {
    title: "Tools",
    href: "/dashboard/tools",
    icon: Wrench,
    alwaysVisible: true,
  },
];

function normalizeDepartment(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRoleLevel(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeAetherTier(value?: string | null): AetherTier {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "t1") return "t1";
  if (normalized === "t2") return "t2";

  return "t3";
}

function roleImpliesAdminAccess(role?: string | null, title?: string | null) {
  const combined = `${role || ""} ${title || ""}`.toLowerCase();

  return (
    combined.includes("admin") ||
    combined.includes("campaign manager") ||
    combined.includes("campaign_manager") ||
    combined.includes("cm")
  );
}

function canAccessTools(tier: AetherTier) {
  return tier === "t3";
}

function canAccessIntegrations(tier: AetherTier) {
  return tier === "t2";
}

function canAccessFinance(tier: AetherTier) {
  return tier !== "t1";
}

function canAccessDigital(tier: AetherTier) {
  return tier !== "t1";
}

function getTierBadgeClasses(tier: AetherTier) {
  if (tier === "t1") {
    return {
      shell:
        "border border-slate-400/55 bg-slate-900/35 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
      wings: "hidden",
      label: "text-slate-300",
    };
  }

  if (tier === "t2") {
    return {
      shell:
        "border border-slate-300/65 bg-gradient-to-b from-slate-500/25 via-slate-900/55 to-slate-950/70 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_18px_rgba(2,6,23,0.25)]",
      wings: "hidden",
      label: "text-slate-200",
    };
  }

  return {
    shell:
      "border border-slate-200/70 bg-gradient-to-b from-slate-400/30 via-slate-900/70 to-slate-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_10px_24px_rgba(2,6,23,0.32)]",
    wings: "hidden",
    label: "text-white",
  };
}

function TierBadge({ tier }: { tier: AetherTier }) {
  const badge = getTierBadgeClasses(tier);

  return (
    <div className="mt-3 flex flex-col items-center">
      <div className="mt-2 flex items-center justify-center">
        <div
          className={cn(
            "relative rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.08em] min-w-[40px] text-center",
            badge.shell
          )}
        >
          <div className="pointer-events-none absolute inset-x-3 top-1 h-px bg-white/25" />
          {tier.toUpperCase()}
        </div>
              </div>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");

  const [allowedDepartments, setAllowedDepartments] = useState<Set<string>>(
    new Set()
  );

  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [contextMode, setContextMode] = useState("default");
  const [aetherTier, setAetherTier] = useState<AetherTier>("t3");

  useEffect(() => {
    let mounted = true;

    async function loadRoleContext() {
      try {
        setRoleLoading(true);
        setRoleError("");

        const response = await fetch("/api/auth/current-context", {
          method: "GET",
        });

        const data = (await response.json()) as CurrentContextResponse;

        if (!response.ok) {
          throw new Error(data.error || "Failed to load workspace context.");
        }

        if (!mounted) return;

        const currentMember = data.membership;

        const organizationContextMode =
          data.organization?.context_mode || "default";

        const organizationTier = normalizeAetherTier(
          data.organization?.aether_tier
        );

        const myRoles = data.roles || [];

        setContextMode(organizationContextMode);
        setAetherTier(organizationTier);

        const nextDepartments = new Set<string>();

        myRoles.forEach((role) => {
          const department = normalizeDepartment(role.department);

          if (department) {
            nextDepartments.add(department);
          }
        });

        const fallbackDepartment = normalizeDepartment(
          currentMember?.department
        );

        if (fallbackDepartment) {
          nextDepartments.add(fallbackDepartment);
        }

        const hasRoleAdmin = myRoles.some((role) => {
          const department = normalizeDepartment(role.department);
          const level = normalizeRoleLevel(role.role_level);

          return (
            level === "admin" ||
            department === "admin" ||
            department === "campaign_manager" ||
            level === "campaign_manager"
          );
        });

        const hasBaseAdmin = roleImpliesAdminAccess(
          currentMember?.role,
          currentMember?.title
        );

        setAllowedDepartments(nextDepartments);
        setHasAdminAccess(hasRoleAdmin || hasBaseAdmin);
      } catch (error: any) {
        if (!mounted) return;

        setRoleError(error?.message || "Failed to load workspace context.");

        setAllowedDepartments(new Set());
        setHasAdminAccess(false);
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadRoleContext();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleNavItems = useMemo(() => {
    const tierFiltered = navItems.filter((item) => {
      if (item.href === "/dashboard/tools") {
        return canAccessTools(aetherTier);
      }

      if (item.href === "/dashboard/integrations") {
        return canAccessIntegrations(aetherTier);
      }

      if (item.href === "/dashboard/finance") {
        return canAccessFinance(aetherTier);
      }

      if (item.href === "/dashboard/digital") {
        return canAccessDigital(aetherTier);
      }

      return true;
    });

    if (roleLoading) {
      return tierFiltered.filter((item) => item.alwaysVisible);
    }

    if (hasAdminAccess) {
      return tierFiltered;
    }

    return tierFiltered.filter((item) => {
      if (item.alwaysVisible) return true;

      if (!item.department) return true;

      return allowedDepartments.has(item.department);
    });
  }, [
    allowedDepartments,
    hasAdminAccess,
    roleLoading,
    aetherTier,
  ]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  const theme = getOrgContextTheme(contextMode);

  return (
    <aside className="flex h-screen w-full max-w-[280px] flex-col overflow-hidden border-r border-slate-800/70 bg-slate-950 text-white">
      <div
        className={cn(
          "border-b border-white/10 bg-gradient-to-br px-6 py-8 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]",
          theme.sidebarGradient
        )}
      >
        <Link href="/dashboard" className="block">
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/aether-logo-full.png"
              alt="Aether.os logo"
              width={180}
              height={120}
              className="h-auto w-[175px] object-contain"
              priority
            />

            <p className="mt-2 text-center text-sm font-medium text-slate-100">
              Political Operating System
            </p>

            <TierBadge tier={aetherTier} />
          </div>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-5">
        <div className="mb-4 px-3 text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
          Operations
        </div>

        {roleError ? (
          <div className="mb-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            Role context unavailable. Showing core navigation.
          </div>
        ) : null}

        <nav className="space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-black/55 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_18px_rgba(2,6,23,0.28)]"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-slate-950 px-4 pt-4 pb-5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black/60 px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-black/80"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
