"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ContactRound,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-[11px]";

export default function BusinessNewContactPage() {
  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 shadow-sm lg:rounded-2xl lg:p-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400 lg:text-[10px]">
          Contact Management
        </p>

        <h1 className="mt-2 text-4xl font-semibold text-white lg:text-3xl">
          Add Contact
        </h1>

        <p className="mt-2 max-w-2xl text-slate-300 lg:text-sm">
          Create the starting record for a new customer relationship. Additional
          relationship history and operational context will live on the contact
          profile once the Business contact layer is connected.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:rounded-2xl lg:p-6">
        <div className="space-y-8 lg:space-y-6">
          <div>
            <div className="mb-4 flex items-center gap-2 lg:mb-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                  Identity
                </h2>
                <p className="text-sm text-slate-500 lg:text-[10px]">
                  Basic information used to identify the contact.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input className={inputClass} placeholder="First name" />
              </div>

              <div>
                <label className={labelClass}>Last Name</label>
                <input className={inputClass} placeholder="Last name" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 lg:pt-6">
            <div className="mb-4 flex items-center gap-2 lg:mb-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <ContactRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                  Contact Information
                </h2>
                <p className="text-sm text-slate-500 lg:text-[10px]">
                  Primary ways to reach this person.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 lg:pt-6">
            <div className="mb-4 flex items-center gap-2 lg:mb-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                  Business Context
                </h2>
                <p className="text-sm text-slate-500 lg:text-[10px]">
                  Optional professional context for the relationship.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:gap-4">
              <div>
                <label className={labelClass}>Company / Organization</label>
                <input
                  className={inputClass}
                  placeholder="Company or organization"
                />
              </div>

              <div>
                <label className={labelClass}>Job Title</label>
                <input className={inputClass} placeholder="Job title" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 lg:pt-6">
            <div className="mb-4 flex items-center gap-2 lg:mb-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                  Location
                </h2>
                <p className="text-sm text-slate-500 lg:text-[10px]">
                  Optional address information for customer context.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:gap-4">
              <div>
                <label className={labelClass}>Street Address</label>
                <input className={inputClass} placeholder="Street address" />
              </div>

              <div className="grid gap-6 md:grid-cols-3 lg:gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input className={inputClass} placeholder="City" />
                </div>

                <div>
                  <label className={labelClass}>State</label>
                  <input className={inputClass} placeholder="State" />
                </div>

                <div>
                  <label className={labelClass}>ZIP Code</label>
                  <input className={inputClass} placeholder="ZIP code" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 lg:pt-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                Initial Context
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[10px]">
                Optional starting context for the relationship. This is visual-only
                for now and does not create an interaction or follow-up.
              </p>
            </div>

            <div className="mt-4 lg:mt-3">
              <label className={labelClass}>Initial Note</label>
              <textarea
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Add any useful starting context..."
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 lg:rounded-xl lg:p-3 lg:text-[11px]">
              Contact creation is not connected yet. This form establishes the
              Business Add Contact experience without writing data or making schema
              assumptions.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between lg:mt-4 lg:gap-2">
              <Link
                href="/business/contacts"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
              >
                <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Back to Contacts
              </Link>

              <button
                type="button"
                disabled
                title="Contact creation is not connected yet."
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white opacity-50 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
              >
                <Save className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Save Contact
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
