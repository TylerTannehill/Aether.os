"use client";

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import { SocialSidebar } from "@/components/layout/social-sidebar";

export function SocialShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[210px]">
        <SocialSidebar />
      </div>

      <div className="lg:pl-[210px]">
        <header className="sticky top-0 z-40 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open Social navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm text-slate-500">Aether.os</p>
              <h1 className="text-base font-semibold text-slate-950">Social</h1>
            </div>
          </div>

          <div className="hidden w-full items-center justify-center lg:flex">
            <p className="select-none text-sm font-black uppercase tracking-[0.45em] text-slate-700">
              AETHER SOCIAL
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1800px] p-4 lg:p-6">
          {children}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close Social navigation"
            className="absolute inset-0 w-full bg-slate-950/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Social navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>
              <SocialSidebar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
