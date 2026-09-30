"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  ContactRound,
  ListChecks,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

const card =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5";

export default function BusinessContactProfilePage() {
  const params = useParams();
  const contactId = String(params?.id || "");

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contact Profile
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                Contact Record
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                The canonical Business record for identity, relationship context,
                interactions, follow-ups, ownership, and list membership.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 lg:text-[9px]">
              Record ID: {contactId || "Not available"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>

            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

            <Link
              href="/business/crm"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              CRM
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] lg:gap-4">
        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <UserRound className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Contact Identity
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Core identity and contact information will live here.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-4 lg:gap-3">
            {[
              ["Name", "Not connected", UserRound],
              ["Email", "Not connected", Mail],
              ["Phone", "Not connected", Phone],
              ["Location", "Not connected", MapPin],
              ["Company / Organization", "Not connected", BriefcaseBusiness],
              ["Job Title", "Not connected", BriefcaseBusiness],
            ].map(([label, value, Icon]) => {
              const RowIcon = Icon as typeof UserRound;
              return (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <RowIcon className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] lg:text-[9px]">
                      {String(label)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700 lg:text-[11px]">
                    {String(value)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
            Relationship Snapshot
          </h2>
          <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
            CRM-level relationship state will summarize here once real contact
            activity is connected.
          </p>

          <div className="mt-5 space-y-3 lg:mt-4 lg:space-y-2">
            {[
              ["Relationship", "Not connected"],
              ["Owner", "Not connected"],
              ["Last Activity", "Not connected"],
              ["Next Action", "Not connected"],
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] lg:gap-4">
        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <MessageSquare className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Interaction History
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Calls, messages, notes, dispositions, and other customer interactions
                will accumulate on this record.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:mt-4 lg:rounded-xl lg:p-5">
            <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
              No interaction history is connected yet.
            </p>
            <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
              Real customer activity will appear here when the Business interaction
              layer is connected.
            </p>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <CalendarClock className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Follow-Up
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Future obligations created by real interactions will live here and
                eventually feed CRM Focus.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 lg:mt-4 lg:rounded-xl lg:p-4">
            <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
              No follow-up is connected yet.
            </p>
            <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
              Nothing is manufactured until actual relationship events create the
              next action.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 lg:gap-4">
        <div className={card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Contact Notes
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Persistent relationship context and internal notes will live on the
                canonical contact record.
              </p>
            </div>
            <MessageSquare className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <textarea
            disabled
            rows={4}
            placeholder="Notes will be available when contact storage is connected."
            className="mt-5 w-full cursor-not-allowed resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 lg:mt-4 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px]"
          />

          <button
            type="button"
            disabled
            className="mt-3 inline-flex cursor-not-allowed items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white opacity-40 lg:text-[9px]"
          >
            Save Note
          </button>
        </div>

        <div className={card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                List Membership
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Lists organize this contact into executable customer work without
                replacing the permanent relationship record.
              </p>
            </div>
            <ListChecks className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 lg:mt-4 lg:rounded-xl lg:p-4">
            <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
              No list memberships are connected yet.
            </p>
            <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
              Membership and list progress will appear here after the Business list
              layer is connected.
            </p>
          </div>

          <Link
            href="/business/lists"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[9px]"
          >
            <Users className="h-3.5 w-3.5" />
            Open List Management
          </Link>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
          Operational Context
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
          This is where other Business modules can eventually contribute customer
          context through deliberate product bridges without turning the Contact
          Profile into a duplicate operational system.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3 lg:mt-4 lg:gap-3">
          {[
            ["CRM", "Relationship state and next action"],
            ["Dispatch", "Service and delivery history"],
            ["Marketing", "Customer-level context when appropriate"],
          ].map(([label, detail]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
            >
              <p className="text-sm font-semibold text-slate-800 lg:text-[11px]">
                {label}
              </p>
              <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                {detail}
              </p>
              <p className="mt-3 text-xs font-medium text-slate-400 lg:text-[9px]">
                Not connected
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
