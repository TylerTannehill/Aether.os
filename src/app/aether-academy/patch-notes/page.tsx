"use client";

import Link from "next/link";
import { useState } from "react";

export default function PatchNotesPage() {
  const [easterEggOpen, setEasterEggOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-wrap gap-3 lg:mb-6">
          <Link
            href="/aether-academy"
            className="inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5 lg:py-2.5 lg:text-sm"
          >
            ← Back to Political Academy
          </Link>
          <Link
            href="/aether-academy/business-academy"
            className="inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5 lg:py-2.5 lg:text-sm"
          >
            ← Back to Business Academy
          </Link>
        </div>

        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
          Product Changelog
        </p>

        <h1 className="mt-2 text-4xl font-bold lg:text-3xl">Patch Notes</h1>

        <p className="mt-3 text-base text-slate-300">
          Every improvement, documented.
        </p>

        <div className="mt-6 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 lg:mt-5 lg:p-3.5">
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
            Current Public Version
          </p>
          <p className="mt-1 text-xl font-semibold text-white">Aether v1.8</p>
          <p className="mt-1 text-slate-300">Live</p>
        </div>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">October 9, 2026</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Aether v1.8 — Business Launch &amp; Platform Expansion</h2>
              <p className="mt-1 text-sm text-slate-400">Aether Business launches publicly, alongside mobile, Political, Academy, and organization provisioning updates.</p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">↓</span>
          </summary>
          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <p className="text-sm leading-7 text-slate-300">Over ten working days, Team Aether developed and publicly introduced Aether Business, a dedicated Business Operating System. This release also expands Aether Mobile, improves Aether Political, and begins a broader educational experience across both products.</p>
            <div className="mt-6 space-y-6 text-sm leading-6 text-slate-300">
              <section>
                <h3 className="text-xl font-semibold text-white">Aether Business — Public Launch</h3>
                <ul className="mt-3 space-y-1.5">
                  <li>✓ Introduced a modular Business Operating System with CRM, Marketing, Inventory, Dispatch, and Finance departments.</li>
                  <li>✓ Established business dashboards, operational workflows, and departmental Focus Modes.</li>
                  <li>✓ Introduced A.B.E. for Business, using deterministic interpretation of recorded operational data—not generative AI or autonomous decision-making.</li>
                  <li>✓ Launched the public Aether Business website with product information and educational resources.</li>
                </ul>
              </section>
              <section>
                <h3 className="text-xl font-semibold text-white">Aether Mobile — Business &amp; Political</h3>
                <ul className="mt-3 space-y-1.5">
                  <li>✓ Expanded Aether Mobile to accommodate business organizations alongside political campaigns, with additional capabilities still in development.</li>
                  <li>✓ Updated mobile access and navigation for the growing Aether ecosystem.</li>
                  <li>✓ Added native text messaging for supported Aether Political contact workflows.</li>
                  <li>✓ Added links to public campaign pages so people can view campaign information and statistics when a campaign chooses to share them.</li>
                </ul>
              </section>
              <section>
                <h3 className="text-xl font-semibold text-white">Aether Academy — Educational Expansion</h3>
                <ul className="mt-3 space-y-1.5">
                  <li>✓ Added a dedicated Business Learning Library alongside the Political Academy.</li>
                  <li>✓ Published 18 Business educational guides covering the platform, departments, workflows, and administration.</li>
                  <li>✓ Established a Business Training Videos library for upcoming walkthroughs.</li>
                  <li>✓ Connected both Academies to shared Articles, Blog, and Patch Notes.</li>
                </ul>
                <p className="mt-3 italic text-slate-400">Additional Academy documentation and training materials will continue rolling out over the coming weeks.</p>
              </section>
              <section>
                <h3 className="text-xl font-semibold text-white">Team Aether — Organization Provisioning</h3>
                <ul className="mt-3 space-y-1.5">
                  <li>✓ Expanded internal organization management and provisioning to support Aether Business.</li>
                  <li>✓ Extended Team Aether's administrative dashboard to manage Political and Business organizations within the Aether ecosystem.</li>
                </ul>
              </section>
            </div>
            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Two products. One expanding ecosystem.</p>
              <p className="mt-2 text-slate-300">Aether Political continues to evolve, Aether Business is now publicly introduced, and more improvements are underway.</p>
              <p className="mt-4 font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                October 2, 2026
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.7 Patch Update
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Aether Mobile is now publicly available through the Apple App Store and Google Play.
              </p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Update
              </p>

              <h3 className="mt-1 text-xl font-semibold text-white">
                Aether Mobile — App Store &amp; Google Play Release
              </h3>

              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300 lg:mt-4 lg:space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Public Mobile Distribution</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Aether Mobile is now publicly available on the Apple App Store.</li>
                    <li>✓ Aether Mobile is now publicly available on Google Play.</li>
                    <li>✓ Campaign teams can install Aether Mobile through the standard iOS and Android store experience.</li>
                    <li>✓ Direct Android APK distribution remains available as an alternate installation option.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Aether Mobile Access</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Mobile access continues to support campaign contact lookup and organized campaign lists.</li>
                    <li>✓ Finance, Outreach, and Field workflows remain synchronized with the organization&apos;s Aether workspace.</li>
                    <li>✓ Notes, dispositions, activity, and list progress can be recorded from mobile campaign workflows.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Public Website</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Added direct Apple App Store and Google Play download links to the Aether landing page.</li>
                    <li>✓ Updated mobile download presentation with dedicated App Store and Google Play badges.</li>
                    <li>✓ Retained the direct Android APK link in the site footer for alternate distribution.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                September 25, 2026
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.6 Patch Update
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Dashboard performance, analytics presentation, and campaign reporting improvements.
              </p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Update
              </p>

              <h3 className="mt-1 text-xl font-semibold text-white">
                Analytics &amp; Dashboard Improvements
              </h3>

              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300 lg:mt-4 lg:space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Dashboard Performance</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Improved Overview Dashboard startup performance and departmental data loading.</li>
                    <li>✓ Reduced blocking between core campaign information and supplemental analytics.</li>
                    <li>✓ Improved Dashboard resilience when processing larger campaign datasets.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Analytics &amp; Reporting</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Improved Field analytics processing and campaign-list reporting.</li>
                    <li>✓ Improved Finance trend visibility across campaign-cycle activity.</li>
                    <li>✓ Refined analytics behavior across Finance, Field, and Digital reporting surfaces.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Chart Experience</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Updated Field and Digital trend charts with a cleaner, more consistent visual system.</li>
                    <li>✓ Improved at-a-glance readability across departmental analytics.</li>
                    <li>✓ Standardized trend presentation across the Overview, Finance, Field, and Digital experience.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                September 20, 2026
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.5 Patch Update
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Training resources, Public Campaign Portal documentation, and demo-request improvements.
              </p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Update
              </p>

              <h3 className="mt-1 text-xl font-semibold text-white">
                Training, Documentation &amp; Demo Experience
              </h3>

              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300 lg:mt-4 lg:space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Aether Mobile Training</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Added the Aether Mobile training video to the Training Videos library.</li>
                    <li>✓ Expanded guided training for mobile contact lookup, campaign lists, and field execution workflows.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Public Campaign Portal Training &amp; Documentation</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Added a dedicated Public Campaign Portal guide to Aether Academy.</li>
                    <li>✓ Added Public Campaign Portal documentation to the Aether Comprehensive Guide.</li>
                    <li>✓ Added the Public Campaign Portal training video to the Training Videos library.</li>
                    <li>✓ Connected the Academy guide and companion training video for easier navigation between written and video resources.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Demo Request Experience</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Updated the Request Demo page with the Welcome to Aether video.</li>
                    <li>✓ Refined the page layout into a more focused single-screen desktop experience.</li>
                    <li>✓ Updated demo-request messaging to emphasize education, campaign goals, and product fit rather than a traditional sales pitch.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                September 18, 2026
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.4 Patch Update
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Public campaign visibility, organization controls, and account recovery improvements.
              </p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Update
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Voter Portal &amp; Account Recovery
              </h3>

              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300 lg:mt-4 lg:space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Voter-Facing Campaign Portal</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Added a public campaign directory for participating organizations.</li>
                    <li>✓ Added voter-facing campaign pages with organization-selected campaign activity and performance metrics.</li>
                    <li>✓ Added direct campaign portal links for easier sharing with voters and supporters.</li>
                    <li>✓ Added optional campaign website and donation links to public campaign profiles.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Organization Administrator Controls</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Added administrator controls to enable or disable an organization&apos;s public campaign portal.</li>
                    <li>✓ Added individual visibility controls so organizations choose which supported campaign metrics appear publicly.</li>
                    <li>✓ Added public directory information controls for state, office, and district.</li>
                    <li>✓ Organizations with the public portal disabled remain absent from the public campaign directory.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Password Recovery</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Improved password-reset link handling and recovery-session verification.</li>
                    <li>✓ Updated the password recovery flow to route users directly into the secure password update experience.</li>
                    <li>✓ Improved expired or invalid reset-link messaging.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                September 16, 2026
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.3 Patch Update
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Platform stability, mobile field operations, and integration improvements.
              </p>
            </div>
            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Update
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Platform &amp; Mobile Improvements
              </h3>

              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300 lg:mt-4 lg:space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Potato Gate</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Improved authentication and profile-state handling across protected application workflows.</li>
                    <li>✓ Strengthened access validation and application-state consistency.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">System Performance</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Resolved elevated CPU usage caused by scheduled background processes.</li>
                    <li>✓ Improved background scheduling behavior to reduce unnecessary resource consumption.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Routes &amp; Field Operations</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Updated Routes functionality across Aether Mobile.</li>
                    <li>✓ Improved mobile Routes and organized-list workflows.</li>
                    <li>✓ Completed end-to-end testing across desktop list creation, mobile retrieval, and field execution.</li>
                    <li>✓ Refined mobile list and route behavior based on end-to-end testing.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">X Integration</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Resolved an API integration issue affecting X.</li>
                    <li>✓ Restored expected integration behavior and data flow.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                September 11, 2026
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-white">
                Aether v1.2 Patch Update
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Interface scale and density normalization.
              </p>
            </div>

            <span className="shrink-0 text-2xl text-violet-300 transition-transform duration-200 group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Update
              </p>

              <h3 className="mt-1 text-xl font-semibold text-white">
                The 75% Zoom Incident
              </h3>

              <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 text-sm leading-6 text-slate-300">
                <p>
                  The Architect developed much of Aether while his browser was set to 75% zoom.
                </p>
                <p className="mt-2 font-semibold text-white">
                  Normal people, reasonably, do not change their browser zoom to use software.
                </p>
              </div>

              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300 lg:mt-4 lg:space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Interface Scale &amp; Density</h4>
                  <ul className="mt-1.5 space-y-0.5">
                    <li>✓ Normalized desktop interface scale for standard 100% browser zoom.</li>
                    <li>✓ Reduced oversized spacing, typography, cards, and navigation across Aether.</li>
                    <li>✓ Preserved mobile sizing and mobile-first execution workflows.</li>
                    <li>✓ No campaign logic, data behavior, permissions, or operational workflows were changed as part of this visual pass.</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">Clarity. Focus. Execution.</p>
              <p className="mt-1 text-slate-400">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden lg:gap-3 lg:p-4">
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

          <div className="border-t border-white/10 p-5 md:p-6 lg:p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Public / Organization Updates
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Organization-facing changes
              </h3>

              <div className="mt-5 space-y-5 text-sm text-slate-300 leading-6 lg:mt-4 lg:space-y-4">
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

              <div className="mt-5 space-y-5 text-sm text-slate-300 leading-6 lg:mt-4 lg:space-y-4">
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
