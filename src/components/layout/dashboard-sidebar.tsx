"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  DollarSign,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  MessageSquare,
  PlugZap,
  Printer,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DepartmentKey = "field" | "outreach" | "digital" | "finance" | "print";

type NavItem = {
  title: string;
  href: string;
  icon: any;
  department?: DepartmentKey;
  alwaysVisible?: boolean;
};

type OrgMemberRole = {
  id: string;
  organization_member_id: string;
  organization_id: string;
  department: string;
  role_level: string;
  is_primary?: boolean;
};

type OrgMembersResponse = {
  organizationId?: string;
  currentMember?: {
    id: string;
    organization_id: string;
    role?: string | null;
    department?: string | null;
    title?: string | null;
  };
  members?: Array<{
    id: string;
    user_id: string;
    role?: string | null;
    department?: string | null;
    title?: string | null;
    organization_id: string;
  }>;
  roles?: OrgMemberRole[];
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
    title: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
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
    title: "Integrations",
    href: "/dashboard/integrations",
    icon: PlugZap,
    alwaysVisible: true,
  },
];

function normalizeDepartment(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRoleLevel(value?: string | null) {
  return String(value || "").trim().toLowerCase();
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");
  const [allowedDepartments, setAllowedDepartments] = useState<Set<string>>(
    new Set()
  );
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRoleContext() {
      try {
        setRoleLoading(true);
        setRoleError("");

        const response = await fetch("/api/admin/org-members", {
          method: "GET",
        });

        const data = (await response.json()) as OrgMembersResponse;

        if (!response.ok) {
          throw new Error(data.error || "Failed to load role context.");
        }

        if (!mounted) return;

        const currentMemberId = data.currentMember?.id;
        const currentMember = data.currentMember;

        const myRoles = (data.roles || []).filter(
          (role) => role.organization_member_id === currentMemberId
        );

        const nextDepartments = new Set<string>();

        myRoles.forEach((role) => {
          const department = normalizeDepartment(role.department);
          if (department) {
            nextDepartments.add(department);
          }
        });

        const fallbackDepartment = normalizeDepartment(currentMember?.department);
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

        setRoleError(error?.message || "Failed to load role context.");
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
    if (roleLoading) {
      return navItems.filter((item) => item.alwaysVisible);
    }

    if (hasAdminAccess) {
      return navItems;
    }

    return navItems.filter((item) => {
      if (item.alwaysVisible) return true;
      if (!item.department) return true;

      return allowedDepartments.has(item.department);
    });
  }, [allowedDepartments, hasAdminAccess, roleLoading]);

  return (
    <aside className="flex h-screen w-full max-w-[280px] flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-6 text-white">
        <Link href="/dashboard" className="block">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-sm backdrop-blur">
              <Image
                src="/aether-logo.png"
                alt="Aether.os logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-2xl font-semibold tracking-tight">Aether.os</p>
              <p className="text-sm text-slate-300">
                Campaign command center
              </p>
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
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-700" />
            <p className="text-sm font-semibold text-slate-900">
              System Status
            </p>
          </div>

          <p className="mb-4 text-sm leading-6 text-slate-600">
            {roleLoading
              ? "Loading workspace role context..."
              : hasAdminAccess
                ? "Admin workspace online. All operating lanes visible."
                : "Workspace filtered to your assigned operating lanes."}
          </p>

          <button
            type="button"
            className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Manage Workspace
          </button>
        </div>
      </div>
    </aside>
  );
}
