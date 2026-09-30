"use client";

import Link from "next/link";
import {
  ContactRound,
  ListChecks,
  Search,
  UsersRound,
  Zap,
} from "lucide-react";

export default function BusinessCrmPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-4">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-4">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white lg:rounded-2xl lg:p-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] lg:text-[10px]">
                Business CRM
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight lg:mt-3 lg:text-3xl">
                Relationship Pipeline
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300 lg:mt-2 lg:text-sm">
                See customer relationships, find the people and lists behind the work,
                and move into execution when the next action is clear.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end lg:gap-2">
              <Link
                href="/business/contacts"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Contacts
              </Link>

              <Link
                href="/business/lists"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Lists
              </Link>

              <Link
                href="/business/crm/focus"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-200 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <Zap className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Focus Mode
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="mb-5 lg:mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
              Quick Find
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
              Jump into customer reality
            </h2>
            <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
              These searches will become fast paths into contact profiles and lists.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:gap-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-xl lg:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 lg:text-[12px]">
                <ContactRound className="h-4 w-4" />
                Find Contact
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search contacts..."
                  aria-label="Search contacts"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 lg:text-[12px]"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-xl lg:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 lg:text-[12px]">
                <ListChecks className="h-4 w-4" />
                Find List
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search lists..."
                  aria-label="Search lists"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 lg:text-[12px]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
                CRM
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 lg:text-xl">
                Relationship Pipeline
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[11px]">
                This view will aggregate relationship state from customer activity rather
                than becoming a second customer record.
              </p>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search pipeline..."
                aria-label="Search relationship pipeline"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 lg:rounded-xl lg:py-2 lg:text-[12px]"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-4">
            {["All", "Follow-Up", "Awaiting Response", "Engaged", "Opportunity", "Customer"].map(
              (label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`rounded-2xl border px-4 py-2 text-sm font-medium transition lg:rounded-xl lg:px-3 lg:py-1.5 lg:text-[11px] ${
                    index === 0
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 lg:mt-4 lg:rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm lg:text-[12px]">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:text-[9px]">
                  <tr>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Contact</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Relationship</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Owner</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Last Activity</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Next Action</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center lg:min-h-52 lg:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <UsersRound className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Relationship activity will live here
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 lg:text-[11px] lg:leading-5">
                The pipeline is intentionally empty until CRM is connected to real contact,
                interaction, and follow-up data.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
