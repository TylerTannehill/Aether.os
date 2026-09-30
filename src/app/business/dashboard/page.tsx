import Link from "next/link";
import { Activity, Settings, UserRound } from "lucide-react";

export default function BusinessDashboardPage() {
  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <Activity className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Executive business hub
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Business Hub
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                See operational health, spot pressure fast, and understand where
                attention is needed before moving into execution.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-2">
            <Link
              href="/business/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <UserRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              My Profile
            </Link>

            <Link
              href="/business/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Settings className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Admin Control
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
