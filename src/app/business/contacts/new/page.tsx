"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ContactRound,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-[11px]";

type ContactForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
};

const emptyForm: ContactForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  street_address: "",
  city: "",
  state: "",
  zip: "",
};

export default function BusinessNewContactPage() {
  const router = useRouter();
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateField(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveContact() {
    if (!form.first_name.trim() && !form.last_name.trim()) {
      setSaveError("Enter at least a first or last name.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const contextData = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !contextData?.organization?.id) {
        setSaveError("Unable to confirm the active Business organization.");
        return;
      }

      const clean = (value: string) => value.trim() || null;

      const { data, error } = await supabase
        .from("business_contacts")
        .insert({
          organization_id: contextData.organization.id,
          first_name: clean(form.first_name),
          last_name: clean(form.last_name),
          email: clean(form.email),
          phone: clean(form.phone),
          company: clean(form.company),
          job_title: clean(form.job_title),
          street_address: clean(form.street_address),
          city: clean(form.city),
          state: clean(form.state),
          zip: clean(form.zip),
        })
        .select("id")
        .single();

      if (error) {
        setSaveError(`Contact did not save: ${error.message}`);
        return;
      }

      router.push(`/business/contacts/${data.id}`);
    } catch (error: any) {
      setSaveError(`Contact did not save: ${error?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

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
          Create the durable identity record for a new customer relationship.
          Relationship history and operational context build from the contact profile.
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
                <input
                  className={inputClass}
                  placeholder="First name"
                  value={form.first_name}
                  onChange={(event) => updateField("first_name", event.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  className={inputClass}
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={(event) => updateField("last_name", event.target.value)}
                />
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
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
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
                  value={form.company}
                  onChange={(event) => updateField("company", event.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Job Title</label>
                <input
                  className={inputClass}
                  placeholder="Job title"
                  value={form.job_title}
                  onChange={(event) => updateField("job_title", event.target.value)}
                />
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
                <input
                  className={inputClass}
                  placeholder="Street address"
                  value={form.street_address}
                  onChange={(event) => updateField("street_address", event.target.value)}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3 lg:gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>State</label>
                  <input
                    className={inputClass}
                    placeholder="State"
                    value={form.state}
                    onChange={(event) => updateField("state", event.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>ZIP Code</label>
                  <input
                    className={inputClass}
                    placeholder="ZIP code"
                    value={form.zip}
                    onChange={(event) => updateField("zip", event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>



          <div className="border-t border-slate-200 pt-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:rounded-xl lg:p-3 lg:text-[11px]">
              Save creates the durable Business contact record. Relationship notes,
              interactions, follow-ups, and list membership remain on the contact profile
              and their own operational layers.
            </div>

            {saveError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 lg:text-[10px]">
                {saveError}
              </div>
            ) : null}

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
                onClick={saveContact}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
              >
                <Save className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                {saving ? "Saving..." : "Save Contact"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
