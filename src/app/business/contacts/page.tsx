"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import {
  ArrowRight,
  Check,
  ContactRound,
  Download,
  ListChecks,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  Users,
} from "lucide-react";

type BusinessContact = {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  owner_user_id: string | null;
};

type BusinessList = {
  id: string;
  organization_id: string;
  name: string;
  department: "crm" | "dispatch" | "inventory";
  due_date: string | null;
  created_at: string;
};

const departmentLabels: Record<BusinessList["department"], string> = {
  crm: "CRM",
  dispatch: "Dispatch",
  inventory: "Inventory",
};

function contactName(contact: BusinessContact) {
  return `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unnamed Contact";
}

function contactLocation(contact: BusinessContact) {
  return [contact.city, contact.state, contact.zip].filter(Boolean).join(", ") || "Not provided";
}

export default function BusinessContactsPage() {
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [lists, setLists] = useState<BusinessList[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [quickAddMessage, setQuickAddMessage] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDepartment, setNewListDepartment] =
    useState<BusinessList["department"]>("crm");
  const [newListDueDate, setNewListDueDate] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      setLoadError("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const context = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !context?.organization?.id) {
          throw new Error(context?.error || "Active organization context is unavailable.");
        }

        const activeOrganizationId = context.organization.id;
        setOrganizationId(activeOrganizationId);

        const [contactsResult, listsResult] = await Promise.all([
          supabase
            .from("business_contacts")
            .select(
              "id, organization_id, first_name, last_name, email, phone, company, job_title, street_address, city, state, zip, owner_user_id"
            )
            .eq("organization_id", activeOrganizationId)
            .order("last_name", { ascending: true })
            .order("first_name", { ascending: true }),
          supabase
            .from("business_lists")
            .select("id, organization_id, name, department, due_date, created_at")
            .eq("organization_id", activeOrganizationId)
            .order("created_at", { ascending: false }),
        ]);

        if (contactsResult.error) throw contactsResult.error;
        if (listsResult.error) throw listsResult.error;

        setContacts((contactsResult.data as BusinessContact[]) || []);
        setLists((listsResult.data as BusinessList[]) || []);
      } catch (error: any) {
        setContacts([]);
        setLoadError(error?.message || "Business contacts could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  function csvCell(value: string | null | undefined) {
    const text = value || "";
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportContactsCsv() {
    if (filteredContacts.length === 0) return;

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Job Title",
      "Street Address",
      "City",
      "State",
      "ZIP",
    ];

    const rows = filteredContacts.map((contact) => [
      contact.first_name,
      contact.last_name,
      contact.email,
      contact.phone,
      contact.company,
      contact.job_title,
      contact.street_address,
      contact.city,
      contact.state,
      contact.zip,
    ]);

    const csv = [
      headers.map((header) => csvCell(header)).join(","),
      ...rows.map((row) => row.map((value) => csvCell(value)).join(",")),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    const suffix = search.trim() ? "filtered" : "all";

    downloadAnchor.href = url;
    downloadAnchor.download = `business-contacts-${suffix}.csv`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  }

  function toggleContactSelection(contactId: string) {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
    setQuickAddMessage("");
  }

  function toggleVisibleContacts() {
    const visibleIds = filteredContacts.map((contact) => contact.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedContactIds.includes(id));

    setSelectedContactIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
    setQuickAddMessage("");
  }

  async function resolveCurrentAppUserId() {
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id || null;
    if (!authUserId) return null;

    const { data: appUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUserId)
      .maybeSingle();

    return appUser?.id || null;
  }

  async function addSelectedContactsToList(listId: string) {
    if (!listId || selectedContactIds.length === 0) return false;

    const addedByUserId = await resolveCurrentAppUserId();
    const rows = selectedContactIds.map((contactId) => ({
      list_id: listId,
      contact_id: contactId,
      added_by_user_id: addedByUserId,
    }));

    const { error } = await supabase
      .from("business_list_contacts")
      .upsert(rows, {
        onConflict: "list_id,contact_id",
        ignoreDuplicates: true,
      });

    if (error) throw error;
    return true;
  }

  async function quickAddToExistingList() {
    if (!selectedListId || selectedContactIds.length === 0) return;

    setQuickAddSaving(true);
    setQuickAddMessage("");

    try {
      await addSelectedContactsToList(selectedListId);
      const targetList = lists.find((list) => list.id === selectedListId);
      setQuickAddMessage(
        `${selectedContactIds.length} contact${
          selectedContactIds.length === 1 ? "" : "s"
        } added to ${targetList?.name || "the list"}.`,
      );
      setSelectedContactIds([]);
      setSelectedListId("");
    } catch (error: any) {
      setQuickAddMessage(
        `Contacts were not added: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setQuickAddSaving(false);
    }
  }

  async function createListFromSelection() {
    const cleanName = newListName.trim();
    if (!organizationId || !cleanName || selectedContactIds.length === 0) return;

    setCreatingList(true);
    setQuickAddMessage("");

    try {
      const createdByUserId = await resolveCurrentAppUserId();

      const { data, error } = await supabase
        .from("business_lists")
        .insert({
          organization_id: organizationId,
          name: cleanName,
          department: newListDepartment,
          created_by_user_id: createdByUserId,
          due_date: newListDueDate || null,
        })
        .select("id, organization_id, name, department, due_date, created_at")
        .single();

      if (error) throw error;

      const createdList = data as BusinessList;
      await addSelectedContactsToList(createdList.id);

      setLists((current) => [createdList, ...current]);
      setQuickAddMessage(
        `${createdList.name} created with ${selectedContactIds.length} contact${
          selectedContactIds.length === 1 ? "" : "s"
        }.`,
      );
      setSelectedContactIds([]);
      setNewListName("");
      setNewListDepartment("crm");
      setNewListDueDate("");
    } catch (error: any) {
      setQuickAddMessage(
        `List was not created: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setCreatingList(false);
    }
  }

  const filteredContacts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return contacts;

    return contacts.filter((contact) => {
      const haystack = [
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.phone,
        contact.company,
        contact.job_title,
        contact.city,
        contact.state,
        contact.zip,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [contacts, search]);

  const unassignedCount = contacts.filter((contact) => !contact.owner_user_id).length;
  const visibleIds = filteredContacts.map((contact) => contact.id);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedContactIds.includes(id));

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
              href="/business/contacts/import"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Upload className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Import Contacts
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
          ["Total Contacts", loading ? "—" : String(contacts.length), "Connected customer records"],
          ["Filtered", loading ? "—" : String(filteredContacts.length), "Records matching the current segment"],
          ["Unassigned", loading ? "—" : String(unassignedCount), "Records without an owner"],
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
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search contacts..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 lg:rounded-xl lg:py-2 lg:pl-9 lg:pr-3 lg:text-[11px]"
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
              Search is live against Business contacts. Location, owner, and deeper
              Business-native segmentation will be connected incrementally. Political
              donor, party, FEC, and campaign-tier filters are intentionally not inherited.
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/70 lg:rounded-2xl lg:p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">
                Quick Add to List
              </p>
              <span className="text-xs font-semibold text-slate-500 lg:text-[9px]">
                {selectedContactIds.length} selected
              </span>
            </div>

            <div className="mt-3 space-y-3 lg:space-y-2">
              <select
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
                disabled={selectedContactIds.length === 0 || quickAddSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 lg:text-[11px]"
              >
                <option value="">Choose an existing list...</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} · {departmentLabels[list.department]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={quickAddToExistingList}
                disabled={
                  selectedContactIds.length === 0 ||
                  !selectedListId ||
                  quickAddSaving
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[10px]"
              >
                <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                {quickAddSaving ? "Adding..." : "Add Selected to List"}
              </button>
            </div>

            <div className="my-4 border-t border-slate-200" />

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              Or Create New List
            </p>

            <div className="mt-3 space-y-2">
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                disabled={selectedContactIds.length === 0 || creatingList}
                placeholder="List name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 lg:text-[11px]"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newListDepartment}
                  onChange={(event) =>
                    setNewListDepartment(
                      event.target.value as BusinessList["department"],
                    )
                  }
                  disabled={selectedContactIds.length === 0 || creatingList}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 lg:text-[11px]"
                >
                  <option value="crm">CRM</option>
                  <option value="dispatch">Dispatch</option>
                  <option value="inventory">Inventory</option>
                </select>

                <input
                  type="date"
                  value={newListDueDate}
                  onChange={(event) => setNewListDueDate(event.target.value)}
                  disabled={selectedContactIds.length === 0 || creatingList}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 lg:text-[11px]"
                />
              </div>

              <button
                type="button"
                onClick={createListFromSelection}
                disabled={
                  selectedContactIds.length === 0 ||
                  !newListName.trim() ||
                  creatingList
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[10px]"
              >
                <Plus className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                {creatingList ? "Creating..." : "Create List + Add Selected"}
              </button>
            </div>

            {quickAddMessage ? (
              <p className="mt-3 text-xs font-medium text-slate-600 lg:text-[9px]">
                {quickAddMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:rounded-2xl lg:p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Current Segment
          </div>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            {search.trim()
              ? `Search: "${search.trim()}" · ${filteredContacts.length} matching record${filteredContacts.length === 1 ? "" : "s"}.`
              : "No active filters. Showing all Business contacts."}
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]">
              {loading ? "Loading..." : `${filteredContacts.length} visible record${filteredContacts.length === 1 ? "" : "s"}`}
            </div>

            <button
              type="button"
              onClick={exportContactsCsv}
              disabled={loading || filteredContacts.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[10px]"
            >
              <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2.5">
          <button
            type="button"
            onClick={toggleVisibleContacts}
            disabled={loading || filteredContacts.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[9px]"
          >
            <Check className="h-3.5 w-3.5" />
            {allVisibleSelected ? "Clear Visible" : "Select Visible"}
          </button>

          <span className="text-xs font-medium text-slate-500 lg:text-[9px]">
            {selectedContactIds.length} contact{selectedContactIds.length === 1 ? "" : "s"} selected
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 lg:rounded-2xl">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead className="bg-white">
              <tr>
                {["Select", "Contact", "Email", "Phone", "Location", "Owner", "Relationship", "Action"].map(
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="bg-white px-6 py-12 text-center text-sm text-slate-500 lg:text-[11px]">
                    Loading Business contacts...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={8} className="bg-white px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-rose-700 lg:text-[11px]">
                      Business contacts could not be loaded.
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">{loadError}</p>
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="bg-white px-6 py-12 text-center lg:px-4 lg:py-10">
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 lg:h-10 lg:w-10 lg:rounded-xl">
                        <Users className="h-5 w-5 lg:h-4 lg:w-4" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700 lg:mt-3 lg:text-[11px]">
                        {contacts.length === 0 ? "No Business contacts yet." : "No contacts match this search."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-slate-200 bg-white">
                    <td className="border-t border-slate-200 px-4 py-4 lg:px-3 lg:py-3">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        aria-label={`Select ${contactName(contact)}`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 lg:px-3 lg:py-3">
                      <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">{contactName(contact)}</p>
                      <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                        {[contact.company, contact.job_title].filter(Boolean).join(" · ") || "No business context"}
                      </p>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {contact.email || "Not provided"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {contact.phone || "Not provided"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {contactLocation(contact)}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {contact.owner_user_id ? "Assigned" : "Unassigned"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-400 lg:px-3 lg:py-3 lg:text-[10px]">
                      Not connected
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 lg:px-3 lg:py-3">
                      <Link
                        href={`/business/contacts/${contact.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[9px]"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
