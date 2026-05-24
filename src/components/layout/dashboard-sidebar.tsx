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
    <aside className="flex h-screen w-full max-w-[280px] flex-col border-r border-slate-200 bg-white">
      <div
        className={cn(
          "border-b border-slate-200 bg-gradient-to-br px-6 py-6 text-white",
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
              className="h-auto w-[170px] object-contain"
              priority
            />

            <p className="mt-3 text-center text-sm text-slate-300">
              Campaign command center
            </p>

            <div className="mt-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
              {aetherTier.toUpperCase()}
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-5">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Navigation
        </div>

        {roleError ? (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
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
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
