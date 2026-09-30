"use client";

import Link from "next/link";
import {
  ArrowRight,
  ContactRound,
  ListChecks,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export default function BusinessContactsPage() {
  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Shared customer infrastructure
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Contact Management
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                Search, filter, segment, assign, and organize the customer records
                that power CRM and downstream execution.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-2">
            <Link
              href="/business/crm"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Back to CRM
              <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </Link>

            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

            <Link
              href="/business/contacts/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Plus className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Add Contact
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          ["Total Contacts", "—", "Connected customer records"],
          ["Filtered", "—", "Records matching the current segment"],
          ["Unassigned", "—", "Records without an owner"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4"
          >
            <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 lg:mt-2 lg:text-2xl">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500 lg:mt-1.5 lg:text-[9px]">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:rounded-2xl lg:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:mb-4 lg:gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Customer Segmentation
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 lg:mt-2 lg:text-xl">
              Build a Contact Segment
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
              This workspace will become the deep filtering surface for Business
              contacts. Filtered customer records can then be selected, assigned,
              or organized into executable lists.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]">
            Contact data not connected yet
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr] lg:gap-3">
          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/70 lg:rounded-2xl lg:p-3">
            <p className="mb-3 text-sm font-semibold text-slate-900 lg:mb-2 lg:text-[11px]">
              Search + Customer Filters
            </p>

            <div className="grid gap-3 md:grid-cols-4 lg:gap-2">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  disabled
                  placeholder="Search contacts..."
                  className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-400 lg:rounded-xl lg:py-2 lg:pl-9 lg:pr-3 lg:text-[11px]"
                />
              </div>

              <input
                disabled
                placeholder="Location"
                className="cursor-not-allowed rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              />

              <input
                disabled
                placeholder="Owner"
                className="cursor-not-allowed rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              />
            </div>

            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 lg:rounded-xl lg:p-3 lg:text-[11px]">
              Business-native customer filters will be added when the contact data
              model is connected. Political donor, party, FEC, and campaign-tier
              filters are intentionally not inherited.
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/70 lg:rounded-2xl lg:p-3">
            <p className="mb-3 text-sm font-semibold text-slate-900 lg:mb-2 lg:text-[11px]">
              Create List from Segment
            </p>

            <div className="space-y-3 lg:space-y-2">
              <input
                disabled
                placeholder="List name"
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              />

              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Create List
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500 lg:text-[9px]">
              List creation will use the records matching the active Business
              contact segment once connectivity is added.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:rounded-2xl lg:p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Current Segment
          </div>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            No active filters. Contact segmentation is not connected yet.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:mb-4 lg:gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
              Contact Records
            </h2>
            <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
              The filtered customer work surface. Individual records will open the
              canonical Business Contact Profile at /business/contacts/[id].
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]">
            0 visible records
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 lg:rounded-2xl">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead className="bg-white">
              <tr>
                {["Contact", "Email", "Phone", "Location", "Owner", "Relationship", "Action"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:py-3 lg:text-[9px]"
                    >
                      {heading}
                    </th>
                  )
                )}
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
                      <Users className="h-5 w-5 lg:h-4 lg:w-4" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700 lg:mt-3 lg:text-[11px]">
                      No Business contacts are connected yet.
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
                      Real customer records will populate this surface when the
                      Business contact layer is connected.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
