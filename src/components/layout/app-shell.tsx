"use client";

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[280px]">
        <DashboardSidebar />
      </div>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm text-slate-500">Workspace</p>
              <h1 className="text-base font-semibold text-slate-950">
                Aether.os
              </h1>
            </div>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-950">
              Campaign Operations Dashboard
            </h1>
          </div>

          <div className="text-sm font-medium text-slate-500">
            Build fast. Ship clean.
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 lg:p-8">
          {children}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DashboardSidebar />
          </div>
        </div>
      )}
    </div>
  );
}