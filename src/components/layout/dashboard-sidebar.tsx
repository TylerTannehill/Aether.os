"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  DollarSign,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  PlugZap,
  Printer,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Field",
    href: "/dashboard/field",
    icon: MapPinned,
  },
  {
    title: "Outreach",
    href: "/dashboard/outreach",
    icon: Megaphone,
  },
  {
    title: "Digital",
    href: "/dashboard/digital",
    icon: BarChart3,
  },
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: DollarSign,
  },
  {
    title: "Print",
    href: "/dashboard/print",
    icon: Printer,
  },
  {
    title: "Integrations",
    href: "/dashboard/integrations",
    icon: PlugZap,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

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

        <nav className="space-y-2">
          {navItems.map((item) => {
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
            Dashboards online and ready for module-by-module expansion.
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