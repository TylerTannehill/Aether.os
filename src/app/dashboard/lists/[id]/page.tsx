"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  addContactToList,
  filterAssignedContacts,
  getAvailableContacts,
  getListDetail,
  removeContactFromList,
  updateListDefaultOwner,
} from "@/lib/data/lists";
import { CampaignList, Contact } from "@/lib/data/types";
import { formatCreatedAt, fullName } from "@/lib/data/utils";

export default function DashboardListDetailPage() {
  const params = useParams();
  const listId = params?.id as string;

  const [list, setList] = useState<CampaignList | null>(null);
  const [assignedContacts, setAssignedContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultOwnerName, setDefaultOwnerName] = useState("");

  useEffect(() => {
    if (!listId) return;
    loadData();
  }, [listId]);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const data = await getListDetail(listId);
      setList(data.list);
      setAssignedContacts(data.assignedContacts);
      setAllContacts(data.allContacts);
      setDefaultOwnerName(data.list?.default_owner_name || "");
    } catch (err: any) {
      setMessage(err?.message || "Error loading list detail.");
      setList(null);
      setAssignedContacts([]);
      setAllContacts([]);
      setDefaultOwnerName("");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDefaultOwner() {
    try {
      setSaving(true);
      setMessage("");

      await updateListDefaultOwner({
        listId,
        default_owner_name: defaultOwnerName || null,
      });

      setMessage(
        defaultOwnerName.trim()
          ? `Default owner saved as ${defaultOwnerName.trim()}.`
          : "Default owner cleared."
      );

      await loadData();
    } catch (err: any) {
      setMessage(err?.message || "Error saving default owner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContactToList() {
    setMessage("");

    if (!selectedContactId) {
      setMessage("Please choose a contact.");
      return;
    }

    const alreadyAssigned = assignedContacts.some(
      (contact) => contact.id === selectedContactId
    );

    if (alreadyAssigned) {
      setMessage("That contact is already in this list.");
      return;
    }

    try {
      setSaving(true);
      await addContactToList(listId, selectedContactId);
      setSelectedContactId("");
      setMessage("Contact added to list.");
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || "Error adding contact.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveContactFromList(contactId: string) {
    try {
      setMessage("");
      setSaving(true);
      await removeContactFromList(listId, contactId);
      setMessage("Contact removed from list.");
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || "Error removing contact.");
    } finally {
      setSaving(false);
    }
  }

  const availableContacts = useMemo(() => {
    return getAvailableContacts(allContacts, assignedContacts);
  }, [allContacts, assignedContacts]);

  const filteredAssignedContacts = useMemo(() => {
    return filterAssignedContacts(assignedContacts, search);
  }, [assignedContacts, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              List Detail
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                {list?.name || "List"}
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                Manage contacts, keep the list clean, and control membership from
                one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/lists"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Lists
            </Link>

            <Link
              href="/dashboard/contacts"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Open Contacts
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Assigned Contacts</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            {assignedContacts.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">Current list members</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Available to Add</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            {availableContacts.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">Not yet assigned</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Created</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {formatCreatedAt(list?.created_at)}
          </p>
          <p className="mt-2 text-sm text-slate-500">List creation time</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Default Owner</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {list?.default_owner_name || "Unassigned"}
          </p>
          <p className="mt-2 text-sm text-slate-500">Used by outreach automation</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Assigned Contacts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search the contacts already in this list.
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or phone..."
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          {filteredAssignedContacts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
              No contacts are currently in this list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Name
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Email
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Phone
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      City
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Party
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssignedContacts.map((contact) => (
                    <tr key={contact.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="transition hover:text-blue-700"
                        >
                          {fullName(contact)}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {contact.phone || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {[contact.city, contact.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {contact.party || "—"}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <button
                          onClick={() => handleRemoveContactFromList(contact.id)}
                          disabled={saving}
                          className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Default Owner
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Auto-generated outreach tasks from this list will route here.
              </p>
            </div>

            <div className="space-y-4">
              <input
                value={defaultOwnerName}
                onChange={(e) => setDefaultOwnerName(e.target.value)}
                placeholder="Set list default owner..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />

              <button
                onClick={handleSaveDefaultOwner}
                disabled={saving}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Default Owner"}
              </button>

              <button
                onClick={() => setDefaultOwnerName("")}
                disabled={saving}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Owner
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Contact
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Only contacts not already in this list are shown.
              </p>
            </div>

            <div className="space-y-4">
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="">Select a contact</option>
                {availableContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {fullName(contact)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddContactToList}
                disabled={saving || availableContacts.length === 0}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {availableContacts.length === 0 ? "No Contacts Available" : "Add Contact"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                List Notes
              </h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  Duplicate protection enabled
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Assigned contacts are filtered out of the add menu automatically.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  Automation now list-aware
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Callback and follow-up tasks can now inherit routing from the list itself.
                </p>
              </div>
            </div>
          </div>

          {message ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {message}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}