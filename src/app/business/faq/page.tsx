"use client";

import { useState } from "react";

export default function BusinessFAQPage() {
  const [doctrineClicks, setDoctrineClicks] = useState(0);
  const [warningStage, setWarningStage] = useState<0 | 1 | 2 | 3 | 4>(0);

  function handleDoctrineClick() {
    setDoctrineClicks((current) => {
      const next = current + 1;

      if (next >= 33) {
        setWarningStage(1);
        return 0;
      }

      return next;
    });
  }

  function closeWarning() {
    setWarningStage(0);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-6 py-12 text-white sm:px-8 lg:px-9 lg:py-9">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[-10%] top-[-40%] h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-[-35%] right-[-10%] h-96 w-96 rounded-full bg-purple-500 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100 lg:mb-3 lg:px-2.5 lg:py-0.5 lg:text-[9px]">
              Aether Business FAQ
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-4xl">
              Business Operating System
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg lg:mt-4 lg:text-sm lg:leading-6">
              Product documentation will grow alongside the Business platform as
              each operational module is built and validated.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur lg:min-w-[220px] lg:gap-2 lg:rounded-2xl lg:p-3">
            <div
              className="cursor-default rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3"
              onClick={handleDoctrineClick}
            >
              <div className="text-3xl font-black lg:text-2xl">OS</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 lg:text-[9px]">
                Doctrine
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-9 lg:py-6">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm lg:rounded-2xl lg:p-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              Documentation in progress
            </div>

            <h2 className="mt-3 text-2xl font-black text-slate-950 lg:text-xl">
              The Business FAQ will be built from the product itself.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              As CRM, Marketing, Inventory, Dispatch, Focus Mode, and the
              Business Dashboard take shape, this page will document how those
              systems actually work.
            </p>
          </div>
        </div>
      </section>

      {warningStage > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm"
          onClick={closeWarning}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-[2rem] border border-red-500/30 bg-[#0B1629] p-8 text-center shadow-2xl lg:max-w-md lg:rounded-2xl lg:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            {warningStage === 1 && (
              <>
                <h2 className="text-3xl font-black text-white lg:text-2xl">
                  Don't click this.
                </h2>
                <button
                  type="button"
                  onClick={() => setWarningStage(2)}
                  className="mt-8 w-full rounded-2xl border border-red-400 bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-500 lg:mt-6 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
                >
                  DON'T
                </button>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-4 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}

            {warningStage === 2 && (
              <>
                <h2 className="text-3xl font-black text-white lg:text-2xl">
                  Seriously...? Final Warning...
                </h2>
                <button
                  type="button"
                  onClick={() => setWarningStage(3)}
                  className="mt-8 w-full rounded-2xl border border-red-400 bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-500 lg:mt-6 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
                >
                  DON'T
                </button>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-4 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}

            {warningStage === 3 && (
              <>
                <div className="text-5xl lg:text-4xl" aria-hidden="true">
                  ⚠️ ⚠️ ⚠️
                </div>
                <h2 className="mt-5 text-3xl font-black uppercase tracking-wide text-red-400 lg:mt-4 lg:text-2xl">
                  Warning
                </h2>
                <button
                  type="button"
                  onClick={() => setWarningStage(4)}
                  className="mt-8 w-full rounded-2xl border border-red-400 bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-500 lg:mt-6 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
                >
                  Delete Org
                </button>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-4 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}

            {warningStage === 4 && (
              <>
                <h2 className="text-3xl font-black text-white lg:text-2xl">
                  You've been warned...
                </h2>
                <audio
                  className="mx-auto mt-8 w-full lg:mt-6"
                  controls
                  preload="metadata"
                  src="/audio/dont-click-this.m4a"
                >
                  Your browser does not support audio playback.
                </audio>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-5 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
