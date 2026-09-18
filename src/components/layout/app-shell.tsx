"use client";

import { ReactNode, useEffect, useState } from "react";
import { Check, Menu, Share2, X } from "lucide-react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [easterEggStep, setEasterEggStep] = useState(0);
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const [publicPortalEnabled, setPublicPortalEnabled] = useState(false);
  const [publicPortalOrgId, setPublicPortalOrgId] = useState("");
  const [portalCopied, setPortalCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPublicPortalSettings() {
      try {
        const response = await fetch("/api/public-portal/settings", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!active || !response.ok || data?.success !== true) return;

        const settings = data?.settings;
        const organizationId =
          settings?.organization_id ??
          settings?.organizationId ??
          settings?.org_id ??
          settings?.orgId ??
          "";

        setPublicPortalEnabled(settings?.enabled === true);
        setPublicPortalOrgId(String(organizationId || ""));
      } catch {
        if (active) {
          setPublicPortalEnabled(false);
          setPublicPortalOrgId("");
        }
      }
    }

    loadPublicPortalSettings();

    return () => {
      active = false;
    };
  }, []);

  const handleSharePublicPortal = async () => {
    if (!publicPortalOrgId) return;

    const portalUrl = `${window.location.origin}/campaign-directory?campaign=${encodeURIComponent(publicPortalOrgId)}`;

    try {
      await navigator.clipboard.writeText(portalUrl);
      setPortalCopied(true);
      window.setTimeout(() => setPortalCopied(false), 1800);
    } catch {
      window.prompt("Copy your public campaign portal link:", portalUrl);
    }
  };

  const handleEasterEggClick = (word: "clarity" | "focus" | "execution") => {
    const sequence = [
      "clarity", "clarity", "clarity",
      "focus", "focus", "focus",
      "execution", "execution", "execution",
    ] as const;

    if (word === sequence[easterEggStep]) {
      const nextStep = easterEggStep + 1;

      if (nextStep === sequence.length) {
        setEasterEggStep(0);
        setEasterEggOpen(true);
        return;
      }

      setEasterEggStep(nextStep);
      return;
    }

    setEasterEggStep(word === "clarity" ? 1 : 0);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[210px]">
        <DashboardSidebar />
      </div>

      <div className="lg:pl-[210px]">
        <header className="sticky top-0 z-40 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 lg:h-[60px] lg:px-6">
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

          <div className="hidden w-full grid-cols-[1fr_auto_1fr] items-center lg:grid">
            <div />

            <p className="select-none text-sm font-black uppercase tracking-[0.45em] text-slate-700">
              <span onClick={() => handleEasterEggClick("clarity")}>CLARITY.</span>{" "}
              <span onClick={() => handleEasterEggClick("focus")}>FOCUS.</span>{" "}
              <span onClick={() => handleEasterEggClick("execution")}>EXECUTION.</span>
            </p>

            <div className="flex justify-end">
              {publicPortalEnabled && publicPortalOrgId && (
                <button
                  type="button"
                  onClick={handleSharePublicPortal}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 text-xs font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                >
                  {portalCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span>{portalCopied ? "Copied!" : "Share Public Portal"}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1800px] p-4 lg:p-6">
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

      {easterEggOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-6 backdrop-blur-sm"
          onClick={() => setEasterEggOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="short-kings-easter-egg"
            className="w-full max-w-lg rounded-[2rem] border border-violet-400/30 bg-[#0B1629] p-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="short-kings-easter-egg"
              className="text-2xl font-black tracking-tight text-white"
            >
              What are you doing with your day that you found this Easter egg?
            </h2>

            <p className="mt-6 text-base leading-7 text-violet-200">
              This one goes out to all the bad bosses.
            </p>

            <audio
              className="mx-auto mt-8 w-full"
              controls
              preload="metadata"
              src="/audio/short-kings.m4a"
            >
              Your browser does not support audio playback.
            </audio>

            <button
              type="button"
              onClick={() => setEasterEggOpen(false)}
              className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}