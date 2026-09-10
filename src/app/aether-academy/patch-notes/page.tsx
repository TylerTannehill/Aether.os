"use client";

import Link from "next/link";
import { useState } from "react";

export default function PatchNotesPage() {
  const [easterEggOpen, setEasterEggOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/aether-academy"
          className="mb-8 inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300"
        >
          ← Back to Aether Academy
        </Link>

        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
          Product Changelog
        </p>

        <h1 className="mt-2 text-4xl font-bold">Patch Notes</h1>

        <p className="mt-3 text-base text-slate-300">
          Every improvement, documented.
        </p>

        <div className="mt-6 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
            Current Public Version
          </p>
          <p className="mt-1 text-xl font-semibold text-white">Aether v1.1</p>
          <p className="mt-1 text-slate-300">Live</p>
        </div>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                September 10, 2026
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.1 Patch Update
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Organization-facing and internal updates.
              </p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Updates
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Organization-facing changes
              </h3>

              <div className="mt-5 space-y-5 text-sm text-slate-300 leading-6">
                <div>
                  <h4 className="text-base font-semibold text-white">Honest Abe</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Added Early Campaign, Mid Campaign, and Late Campaign stage documentation.</li>
                    <li>✓ Clarified campaign-wide operational interpretation and shifting priorities.</li>
                    <li>✓ Clarified Organization Administrator stage control and human decision authority.</li>
                    <li>✓ Defined the public boundary around Abe&apos;s proprietary internal logic.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Integrations & Imports</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Gmail, Google Drive, Google Calendar, and Google Routes live.</li>
                    <li>✓ ActBlue and WinRed live.</li>
                    <li>✓ YouTube, Meta, Instagram, TikTok, and Campaign Websites live.</li>
                    <li>✓ CSV import workflows available.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Security, Governance & Data Ownership</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Expanded organization separation and administrative-access documentation.</li>
                    <li>✓ Clarified connected-service permissions and campaign data ownership.</li>
                    <li>✓ Expanded Full Data Export and retention documentation.</li>
                    <li>✓ Clarified shared security responsibilities between organizations and Team Aether.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Pricing & Account Management</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Standard public pricing now active.</li>
                    <li>✓ Unlimited users across all tiers.</li>
                    <li>✓ No setup or implementation fees.</li>
                    <li>✓ Aether Mobile and supported Google Routes functionality included.</li>
                    <li>✓ Dedicated Team Aether account manager included.</li>
                    <li>✓ Account-management continuity clarified: dedicated does not mean dependent.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Aether Academy & Training</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Expanded Honest Abe documentation.</li>
                    <li>✓ Updated integration documentation.</li>
                    <li>✓ Expanded security, governance, and data-portability documentation.</li>
                    <li>✓ Updated post-launch platform status language.</li>
                    <li>✓ Continued expansion of the companion training library.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Aether Mobile</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Android APK available.</li>
                    <li>✓ Contact lookup and campaign lists available on mobile.</li>
                    <li>✓ Call Time and Field execution workflows available.</li>
                    <li>✓ Notes, dispositions, and synchronized campaign updates supported.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="my-7 border-t border-white/10" />

            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Internal / Team Aether Updates
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Team Aether internal changes
              </h3>

              <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 text-sm text-slate-300 leading-6">
                <p className="font-semibold text-white">Why share internal updates?</p>
                <p className="mt-2">
                  Aether believes transparency should extend beyond customer-facing features. This section documents meaningful internal work across infrastructure, operations, support, security, tooling, and company processes that may not immediately change what organizations see inside the platform—but helps explain how Aether is being maintained and strengthened behind the scenes.
                </p>
                <p className="mt-2">
                  Not every internal change will be published, particularly where doing so would expose sensitive security information, proprietary systems, customer data, or internal access procedures.
                </p>
              </div>

              <div className="mt-5 space-y-5 text-sm text-slate-300 leading-6">
                <div>
                  <h4 className="text-base font-semibold text-white">Operations & Provisioning</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Standardized organization provisioning workflow.</li>
                    <li>✓ Clarified account-management responsibilities.</li>
                    <li>✓ Established repeatable post-provisioning support process.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Internal SOPs</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ SOP-001 — Provisioning &amp; Account Management.</li>
                    <li>✓ SOP-002 — Sales Pipeline &amp; Outreach.</li>
                    <li>✓ SOP-003 — Content Management &amp; Approval.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Infrastructure & Access</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Decommissioned previous development environment.</li>
                    <li>✓ Invested in and configured an updated development environment.</li>
                    <li>✓ Administrative access reorganized.</li>
                    <li>✓ Authentication records cleaned up.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Sales Operations</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Production sales infrastructure established.</li>
                    <li>✓ Campaign prospecting and outreach workflows operational.</li>
                    <li>✓ Internal sales reporting connected to Team Aether operations.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Continuity & Support</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Cross-training and operational redundancy incorporated into the support model.</li>
                    <li>✓ Emergency continuity procedures established for critical technical and administrative situations.</li>
                    <li>✓ Authorized alternate support paths established when a primary point of contact is unavailable.</li>
                    <li>✓ Sensitive continuity mechanisms remain internal.</li>
                  </ul>
                </div>

              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>

            <div className="relative h-3">
              <button
                type="button"
                onClick={() => setEasterEggOpen(true)}
                className="absolute -bottom-7 -right-5 rotate-12 text-[22px] opacity-45 transition duration-200 hover:scale-110 hover:opacity-90 focus:outline-none focus-visible:opacity-90 md:-right-7"
                aria-label="Easter egg"
              >
                🥚
              </button>
            </div>
          </div>
        </details>
      </div>

      {easterEggOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="easter-egg-title"
          onClick={() => setEasterEggOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-violet-400/30 bg-[#0a1728] p-8 text-center shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="easter-egg-title" className="text-2xl font-semibold text-white">
              Did you really think we wouldn&apos;t have some fun too?
            </p>
            <p className="mt-4 text-lg text-violet-300">Happy hunting.</p>
            <button
              type="button"
              onClick={() => setEasterEggOpen(false)}
              className="mt-7 rounded-xl border border-violet-400/40 bg-violet-400/10 px-5 py-2.5 font-semibold text-violet-200 transition hover:border-violet-300 hover:bg-violet-400/15"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
