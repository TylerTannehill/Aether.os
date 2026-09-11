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
import { supabase } from "@/lib/supabase";

export default function DashboardListDetailPage() {
  const params = useParams();
  const listId = params?.id as string;

  const [list, setList] = useState<CampaignList | null>(null);
  const [assignedContacts, setAssignedContacts] = useState<Contact[]>([]);
  const [workedContacts, setWorkedContacts] = useState(0);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultOwnerName, setDefaultOwnerName] = useState("");
  const [contactSearch, setContactSearch] = useState("");

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

      const { data: progressRows, error: progressError } = await supabase
        .from("list_contacts")
        .select("disposition, notes, status, completed_at")
        .eq("list_id", listId);

      if (!progressError) {
        const worked = (progressRows || []).filter((assignment) =>
          Boolean(
            assignment.disposition ||
              assignment.notes ||
              assignment.status === "completed" ||
              assignment.completed_at
          )
        ).length;
        setWorkedContacts(worked);
      } else {
        setWorkedContacts(0);
      }
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
      setContactSearch("");
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

  const selectedContact = useMemo(() => {
    return (
      availableContacts.find((contact) => contact.id === selectedContactId) ||
      null
    );
  }, [availableContacts, selectedContactId]);

  const filteredAvailableContacts = useMemo(() => {
    const normalizedSearch = contactSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableContacts.slice(0, 8);
    }

    return availableContacts
      .filter((contact) => {
        const searchable = [
          fullName(contact),
          contact.email,
          contact.phone,
          contact.city,
          contact.state,
          contact.party,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      })
      .slice(0, 8);
  }, [availableContacts, contactSearch]);

  const filteredAssignedContacts = useMemo(() => {
    return filterAssignedContacts(assignedContacts, search);
  }, [assignedContacts, search]);

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <p className="text-slate-600">Loading list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 lg:text-[11px]">
              List Detail
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-2xl">
                {list?.name || "List"}
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-[11px]">
                Manage contacts, keep the list clean, and control membership from
                one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/dashboard/lists"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Back to Lists
            </Link>

            <Link
              href="/dashboard/contacts"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
            >
              <span className="block leading-tight text-white">Open Contacts</span>
              <span className="block text-xs font-medium leading-tight text-slate-300 lg:text-[9px]">
                View all contacts
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4 lg:gap-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <p className="text-sm font-medium text-slate-500 lg:text-[11px]">Assigned Contacts</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 lg:mt-2 lg:text-3xl">
            {assignedContacts.length}
          </p>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">Current list members</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <p className="text-sm font-medium text-slate-500 lg:text-[11px]">List Progress</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 lg:mt-2 lg:text-3xl">
            {assignedContacts.length > 0
              ? Math.round((workedContacts / assignedContacts.length) * 100)
              : 0}%
          </p>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            {workedContacts} of {assignedContacts.length} contacts worked
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 lg:mt-3">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{
                width: `${
                  assignedContacts.length > 0
                    ? Math.round((workedContacts / assignedContacts.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <p className="text-sm font-medium text-slate-500 lg:text-[11px]">Created</p>
          <p className="mt-3 text-lg font-semibold text-slate-900 lg:mt-2 lg:text-base">
            {formatCreatedAt(list?.created_at)}
          </p>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">List creation time</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <p className="text-sm font-medium text-slate-500 lg:text-[11px]">Default Owner</p>
          <p className="mt-3 text-lg font-semibold text-slate-900 lg:mt-2 lg:text-base">
            {list?.default_owner_name || "Unassigned"}
          </p>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">Used by outreach automation</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(250px,1fr)] lg:gap-4">
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-3 lg:mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Assigned Contacts
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Search the contacts already in this list.
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or phone..."
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:max-w-[280px] lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            />
          </div>

          {filteredAssignedContacts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500 lg:rounded-xl lg:p-4">
              No contacts are currently in this list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-y-3 lg:min-w-0 lg:table-fixed lg:border-spacing-y-2">
                <colgroup>
                  <col className="lg:w-[20%]" />
                  <col className="lg:w-[19%]" />
                  <col className="lg:w-[16%]" />
                  <col className="lg:w-[22%]" />
                  <col className="lg:w-[9%]" />
                  <col className="lg:w-[14%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:text-[9px]">
                      Name
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:text-[9px]">
                      Email
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:text-[9px]">
                      Phone
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:text-[9px]">
                      City
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:text-[9px]">
                      Party
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:text-[9px]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssignedContacts.map((contact) => (
                    <tr key={contact.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900 lg:px-3 lg:py-2.5 lg:break-words">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-semibold text-slate-950 underline-offset-2 transition hover:underline"
                        >
                          {fullName(contact)}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-600 lg:px-3 lg:py-2.5 lg:break-words">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 lg:px-3 lg:py-2.5 lg:break-words">
                        {contact.phone || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 lg:px-3 lg:py-2.5 lg:break-words">
                        {[contact.city, contact.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 lg:px-3 lg:py-2.5 lg:break-words">
                        {contact.party || "—"}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 lg:px-3 lg:py-2.5">
                        <button
                          onClick={() => handleRemoveContactFromList(contact.id)}
                          disabled={saving}
                          className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:text-[11px]"
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

        <div className="min-w-0 space-y-6 lg:space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
            <div className="mb-5 lg:mb-4">
              <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                Default Owner
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Auto-generated outreach tasks from this list will route here.
              </p>
            </div>

            <div className="space-y-4 lg:space-y-3">
              <input
                value={defaultOwnerName}
                onChange={(e) => setDefaultOwnerName(e.target.value)}
                placeholder="Set list default owner..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              />

              <button
                onClick={handleSaveDefaultOwner}
                disabled={saving}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                {saving ? "Saving..." : "Save Default Owner"}
              </button>

              <button
                onClick={() => setDefaultOwnerName("")}
                disabled={saving}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                Clear Owner
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
            <div className="mb-5 lg:mb-4">
              <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                Add Contact
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Search available contacts and add the right person to this list.
              </p>
            </div>

            <div className="space-y-4 lg:space-y-3">
              <input
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setSelectedContactId("");
                }}
                placeholder="Search contacts by name, email, phone, city, or party..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              />

              <div className="max-h-72 lg:max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:rounded-xl">
                {availableContacts.length === 0 ? (
                  <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 lg:px-3 lg:py-2 lg:text-[11px]">
                    No contacts are available to add.
                  </div>
                ) : filteredAvailableContacts.length === 0 ? (
                  <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 lg:px-3 lg:py-2 lg:text-[11px]">
                    No available contacts match that search.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableContacts.map((contact) => {
                      const isSelected = selectedContactId === contact.id;

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => setSelectedContactId(contact.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-100"
                          } lg:px-3 lg:py-2`}
                        >
                          <span className="block text-sm font-semibold lg:text-[11px]">
                            {fullName(contact)}
                          </span>
                          <span
                            className={`mt-1 block text-xs ${
                              isSelected ? "text-slate-300" : "text-slate-500"
                            } lg:text-[9px]`}
                          >
                            {[contact.email, contact.phone]
                              .filter(Boolean)
                              .join(" • ") || "No email or phone"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedContact ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]">
                  Selected:{" "}
                  <span className="font-semibold text-slate-950">
                    {fullName(selectedContact)}
                  </span>
                </div>
              ) : null}

              <button
                onClick={handleAddContactToList}
                disabled={saving || availableContacts.length === 0 || !selectedContactId}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                {availableContacts.length === 0
                  ? "No Contacts Available"
                  : saving
                    ? "Adding..."
                    : "Add Contact"}
              </button>
            </div>
          </div>

          {message ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 lg:rounded-xl lg:p-3 lg:text-[11px]">
              {message}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}