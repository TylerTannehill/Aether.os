"use client";

import Link from "next/link";
import {
  ArrowRight,
  ContactRound,
  ListChecks,
  Search,
  Users,
  Zap,
} from "lucide-react";

export default function BusinessListsPage() {
  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Shared customer infrastructure
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                List Management
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                Organize contacts into deliberate groups of customer work, then
                carry those lists into CRM Focus and future operational workflows.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>

            <Link
              href="/business/crm"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              CRM
            </Link>

            <Link
              href="/business/crm/focus"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Zap className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              CRM Focus
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 lg:gap-3">
        {[
          ["Saved Lists", "—", "Available customer work groups"],
          ["Active", "—", "Lists currently available for execution"],
          ["Contacts Organized", "—", "Customer records assigned to lists"],
          ["Needs Attention", "—", "Lists requiring organization or ownership"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 lg:mt-2 lg:text-2xl">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500 lg:mt-1.5 lg:text-[9px]">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
              List Infrastructure
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
              Saved Lists
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[11px]">
              Lists package contacts into repeatable customer work without replacing
              the permanent Contact Profile.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:h-3.5 lg:w-3.5" />
              <input
                disabled
                placeholder="Search lists..."
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-400 sm:w-64 lg:rounded-xl lg:py-2 lg:pl-9 lg:pr-3 lg:text-[11px]"
              />
            </div>

            <Link
              href="/business/contacts"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Users className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Build from Contacts
            </Link>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 lg:mt-4 lg:rounded-2xl">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead className="bg-white">
              <tr>
                {[
                  "List",
                  "Purpose",
                  "Owner",
                  "Contacts",
                  "Progress",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:py-3 lg:text-[9px]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={7}
                  className="bg-white px-6 py-12 text-center lg:px-4 lg:py-10"
                >
                  <div className="mx-auto flex max-w-lg flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 lg:h-10 lg:w-10 lg:rounded-xl">
                      <ListChecks className="h-5 w-5 lg:h-4 lg:w-4" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700 lg:mt-3 lg:text-[11px]">
                      No Business lists are connected yet.
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
                      Real lists created from Business contacts will populate this
                      workspace when the list layer is connected.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Create
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Build Lists from Customer Segments
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            Contact Management is the primary list-building surface. Search and
            segment customer records there, then package the matching contacts into
            a deliberate work list.
          </p>

          <Link
            href="/business/contacts"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:mt-4 lg:text-[9px]"
          >
            Open Contact Management
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Execute
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Carry Lists into CRM Focus
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            Lists ready for customer execution will eventually feed the Work a List
            lane while individual interactions continue to accumulate on each
            Contact Profile.
          </p>

          <Link
            href="/business/crm/focus"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:mt-4 lg:text-[9px]"
          >
            Open CRM Focus
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
          List connectivity is intentionally not active yet.
        </p>
        <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
          Search, counts, ownership, membership, progress, status, and execution
          routing will become real after the Business customer data model is wired.
        </p>
      </section>
    </div>
  );
}
