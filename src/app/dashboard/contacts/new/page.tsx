"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { createContact } from "@/lib/data/contacts";

export default function NewContactPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      alert("First Name, Last Name, and Phone Number are required.");
      return;
    }

    try {
      setSaving(true);

      const contact = await createContact({
        first_name: firstName,
        last_name: lastName,
        phone,
      });

      window.location.href = `/contacts/${contact.id}`;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to create contact.";

      if (
        message.toLowerCase().includes("unique_phone") ||
        message.toLowerCase().includes("duplicate key")
      ) {
        alert(
          "A contact with this phone number already exists. Phone numbers must be unique."
        );
      } else {
        alert("Unable to create contact. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-3xl border border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
          Contact Management
        </p>

        <h1 className="mt-2 text-4xl font-semibold text-white">
          Add Contact
        </h1>

        <p className="mt-2 max-w-2xl text-slate-300">
          Create a new contact. Additional information can be added later from
          the contact profile.
        </p>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              First Name *
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Last Name *
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Phone Number *
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/dashboard/contacts"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Contact"}
          </button>
        </div>
      </form>
    </div>
  );
}