"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ContactRound,
  ListChecks,
  Search,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

const card =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5";

export default function BusinessListDetailPage() {
  const params = useParams();
  const listId = String(params?.id || "");

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              List Detail
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                Customer Work List
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                The canonical Business view for list membership, ownership,
                progress, and execution context.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 lg:text-[9px]">
              List ID: {listId || "Not available"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
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
          ["Contacts", "—", "Current list members"],
          ["Progress", "—", "Customer work completed"],
          ["Owner", "Not connected", "Default list ownership"],
          ["Status", "Not connected", "Current execution state"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              {label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:mt-2 lg:text-xl">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500 lg:mt-1.5 lg:text-[9px]">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] lg:gap-4">
        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <ListChecks className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                List Identity
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Core list context will live here once Business list storage is
                connected.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-4 lg:gap-3">
            {[
              ["List Name", "Not connected"],
              ["Purpose", "Not connected"],
              ["Created", "Not connected"],
              ["Default Owner", "Not connected"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700 lg:text-[11px]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
            Execution Snapshot
          </h2>
          <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
            List-level execution state will summarize here without replacing the
            individual customer records underneath it.
          </p>

          <div className="mt-5 space-y-3 lg:mt-4 lg:space-y-2">
            {[
              ["Ready for Work", "Not connected"],
              ["Worked", "Not connected"],
              ["Remaining", "Not connected"],
              ["Last Activity", "Not connected"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2.5"
              >
                <span className="text-sm font-medium text-slate-500 lg:text-[10px]">
                  {label}
                </span>
                <span className="text-sm font-semibold text-slate-700 lg:text-[10px]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)] lg:gap-4">
        <div className={card}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                List Members
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Customer records assigned to this list will appear here and link
                back to their canonical Contact Profiles.
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:h-3.5 lg:w-3.5" />
              <input
                disabled
                placeholder="Search list members..."
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-400 sm:w-64 lg:rounded-xl lg:py-2 lg:pl-9 lg:pr-3 lg:text-[11px]"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 lg:mt-4 lg:rounded-2xl">
            <table className="w-full min-w-[760px] border-separate border-spacing-0">
              <thead className="bg-white">
                <tr>
                  {[
                    "Contact",
                    "Email",
                    "Phone",
                    "Relationship",
                    "Progress",
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
                    colSpan={6}
                    className="bg-white px-6 py-12 text-center lg:px-4 lg:py-10"
                  >
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 lg:h-10 lg:w-10 lg:rounded-xl">
                        <Users className="h-5 w-5 lg:h-4 lg:w-4" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700 lg:mt-3 lg:text-[11px]">
                        No list members are connected yet.
                      </p>
                      <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
                        Real Business contacts assigned to this list will populate
                        this workspace after connectivity is added.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-4">
          <div className={card}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
                <UserRound className="h-5 w-5 lg:h-4 lg:w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                  List Owner
                </h2>
                <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                  Ownership will control who is responsible for this customer work.
                </p>
              </div>
            </div>

            <input
              disabled
              placeholder="Owner not connected"
              className="mt-5 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 lg:mt-4 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            />

            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white opacity-40 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Save Owner
            </button>
          </div>

          <div className={card}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
                <ContactRound className="h-5 w-5 lg:h-4 lg:w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                  Manage Membership
                </h2>
                <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                  Add and remove contacts here once Business list membership is
                  connected.
                </p>
              </div>
            </div>

            <input
              disabled
              placeholder="Search available contacts..."
              className="mt-5 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 lg:mt-4 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            />

            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white opacity-40 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Add Contact
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 lg:gap-4">
        <div className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Customer Reality
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Individual history stays with the Contact
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            Working this list will eventually create interactions and dispositions
            on each customer&apos;s Contact Profile. The list organizes the work; it
            does not become a second relationship history.
          </p>

          <Link
            href="/business/contacts"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:mt-4 lg:text-[9px]"
          >
            Open Contact Management
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>

        <div className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Execution
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Work this List in CRM Focus
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            Once list execution is connected, this record will carry its membership
            and progress into the Work a List lane without manufacturing customer
            activity.
          </p>

          <Link
            href="/business/crm/focus"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:mt-4 lg:text-[9px]"
          >
            <Zap className="h-3.5 w-3.5" />
            Open CRM Focus
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
          List detail connectivity is intentionally inactive.
        </p>
        <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
          Membership, ownership, progress, status, and execution will become real
          after the Business customer data model is wired.
        </p>
      </section>
    </div>
  );
}
