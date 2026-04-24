"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  RefreshCw,
  Search,
  Users,
  Zap,
} from "lucide-react";
import {
  bulkUpdateContactOwner,
  filterContacts,
  getContactCounts,
  getContacts,
  updateContactOwner,
} from "@/lib/data/contacts";
import { getDashboardData } from "@/lib/data/dashboard";
import { Contact, DashboardData } from "@/lib/data/types";
import { fullName } from "@/lib/data/utils";
import { useDashboardOwner } from "../owner-context";

function normalizeOwner(value?: string | null) {
  return value?.trim() || "Unassigned";
}

type DashboardList = DashboardData["lists"][number];
type OutreachListTag = "outreach" | "field" | "finance" | "volunteer";

function resolveListTag(list: DashboardList): OutreachListTag {
  const name = (list.name || "").toLowerCase();
  const owner = (list.default_owner_name || "").toLowerCase();
  const combined = `${name} ${owner}`;

  if (
    combined.includes("volunteer") ||
    combined.includes("phone bank") ||
    combined.includes("phonebank")
  ) {
    return "volunteer";
  }

  if (
    combined.includes("finance") ||
    combined.includes("donor") ||
    combined.includes("fundraising")
  ) {
    return "finance";
  }

  if (
    combined.includes("field") ||
    combined.includes("canvass") ||
    combined.includes("door") ||
    combined.includes("turf")
  ) {
    return "field";
  }

  return "outreach";
}

function listTagTone(tag: OutreachListTag) {
  switch (tag) {
    case "field":
      return "border border-sky-200 bg-sky-100 text-sky-700";
    case "finance":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "volunteer":
      return "border border-purple-200 bg-purple-100 text-purple-700";
    case "outreach":
    default:
      return "border border-amber-200 bg-amber-100 text-amber-800";
  }
}

function donorTierTone(tier?: Contact["fec_donor_tier"] | null) {
  switch (tier) {
    case "maxed":
      return "border border-purple-200 bg-purple-100 text-purple-700";
    case "major":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "mid":
      return "border border-blue-200 bg-blue-100 text-blue-700";
    case "base":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-500";
  }
}

function formatDonorTier(tier?: Contact["fec_donor_tier"] | null) {
  switch (tier) {
    case "maxed":
      return "Maxed";
    case "major":
      return "Major";
    case "mid":
      return "Mid";
    case "base":
      return "Base";
    default:
      return "None";
  }
}

function contactMatchesDonorSearch(contact: Contact, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const donorTerms = [
    contact.fec_match_status,
    contact.fec_donor_tier,
    contact.jackpot_candidate ? "jackpot" : "",
    contact.jackpot_anomaly_type,
    contact.jackpot_reason,
    contact.fec_total_given ? "fec donor" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return donorTerms.includes(normalized);
}

export default function DashboardContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<DashboardList[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  const [editingOwner, setEditingOwner] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOwnerName, setBulkOwnerName] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const { ownerFilter } = useDashboardOwner();

  useEffect(() => {
    loadContactsPageData();
  }, []);
    async function loadContactsPageData() {
    try {
      setLoading(true);
      setMessage("");

      const [contactData, dashboardData] = await Promise.all([
        getContacts(),
        getDashboardData(),
      ]);

      setContacts(contactData);
      setLists(dashboardData.lists ?? []);
    } catch (err: any) {
      setMessage(err?.message || "Error loading contacts.");
      setContacts([]);
      setLists([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveOwner(contactId: string) {
    try {
      setSavingId(contactId);
      setMessage("");

      await updateContactOwner(contactId, editingOwner[contactId]);
      setMessage("Owner updated.");
      await loadContactsPageData();
    } catch (err: any) {
      setMessage(err?.message || "Failed to update owner.");
    } finally {
      setSavingId(null);
    }
  }

  async function applyBulkOwner() {
    try {
      setBulkSaving(true);
      setMessage("");

      await bulkUpdateContactOwner(selectedIds, bulkOwnerName);

      setMessage(
        bulkOwnerName.trim()
          ? `Assigned ${selectedIds.length} contact${selectedIds.length === 1 ? "" : "s"} to ${bulkOwnerName.trim()}.`
          : `Cleared owner for ${selectedIds.length} contact${selectedIds.length === 1 ? "" : "s"}.`
      );

      setSelectedIds([]);
      setBulkOwnerName("");
      await loadContactsPageData();
    } catch (err: any) {
      setMessage(err?.message || "Failed bulk owner update.");
    } finally {
      setBulkSaving(false);
    }
  }

  function toggleSelected(contactId: string) {
    setSelectedIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  }

  function toggleSelectAllFiltered() {
    const filteredIds = filteredContacts.map((contact) => contact.id);
    const allFilteredSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedIds.includes(id));

    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  }

  const ownerScopedContacts = useMemo(() => {
    if (!ownerFilter.trim()) return contacts;

    const normalizedFilter = ownerFilter.trim().toLowerCase();

    return contacts.filter(
      (contact) =>
        normalizeOwner(contact.owner_name).toLowerCase() === normalizedFilter
    );
  }, [contacts, ownerFilter]);

  const filteredContacts = useMemo(() => {
    const baseFiltered = filterContacts(
      ownerScopedContacts,
      search,
      cityFilter,
      stateFilter,
      partyFilter
    );

    if (!search.trim()) return baseFiltered;

    const donorMatches = ownerScopedContacts.filter((contact) =>
      contactMatchesDonorSearch(contact, search)
    );

    const combined = new Map<string, Contact>();

    [...baseFiltered, ...donorMatches].forEach((contact) => {
      if (cityFilter && String(contact.city || "").toLowerCase() !== cityFilter.toLowerCase()) return;
      if (stateFilter && String(contact.state || "").toLowerCase() !== stateFilter.toLowerCase()) return;
      if (partyFilter && String(contact.party || "").toLowerCase() !== partyFilter.toLowerCase()) return;
      combined.set(contact.id, contact);
    });

    return Array.from(combined.values());
  }, [ownerScopedContacts, search, cityFilter, stateFilter, partyFilter]);

  const counts = useMemo(() => {
    return getContactCounts(ownerScopedContacts, filteredContacts);
  }, [ownerScopedContacts, filteredContacts]);

  const assignedCount = useMemo(() => {
    return ownerScopedContacts.filter((c) => c.owner_name?.trim()).length;
  }, [ownerScopedContacts]);

  const unassignedCount = useMemo(() => {
    return ownerScopedContacts.filter((c) => !c.owner_name?.trim()).length;
  }, [ownerScopedContacts]);

  const donorStats = useMemo(() => {
    const fecMatched = ownerScopedContacts.filter(
      (contact) =>
        contact.fec_match_status === "matched" ||
        contact.fec_match_status === "probable"
    ).length;

    const majorDonors = ownerScopedContacts.filter(
      (contact) =>
        contact.fec_donor_tier === "major" ||
        contact.fec_donor_tier === "maxed"
    ).length;

    const jackpotCandidates = ownerScopedContacts.filter(
      (contact) => contact.jackpot_candidate
    ).length;

    return {
      fecMatched,
      majorDonors,
      jackpotCandidates,
    };
  }, [ownerScopedContacts]);

  const allFilteredSelected = useMemo(() => {
    if (filteredContacts.length === 0) return false;
    return filteredContacts.every((contact) => selectedIds.includes(contact.id));
  }, [filteredContacts, selectedIds]);

  const visibleLists = useMemo(() => {
    if (!ownerFilter.trim()) return lists;

    const normalizedFilter = ownerFilter.trim().toLowerCase();

    return lists.filter(
      (list) =>
        normalizeOwner(list.default_owner_name).toLowerCase() === normalizedFilter
    );
  }, [lists, ownerFilter]);

  const taggedLists = useMemo(() => {
    return visibleLists.map((list) => ({
      ...list,
      tag: resolveListTag(list),
    }));
  }, [visibleLists]);
    if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Contact Management
        </h1>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Contact Management
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Contact Management
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                Search, assign, and organize the contact layer that powers
                Outreach, Lists, and downstream execution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/outreach"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowRight className="h-4 w-4" />
              Back to Outreach
            </Link>

            <button
              onClick={loadContactsPageData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Contacts = source of truth</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          This page should feel like the record layer beneath Outreach, Lists, Finance, and downstream execution.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active Owner Lane
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Viewing contacts for{" "}
              <span className="font-semibold">
                {ownerFilter || "All Owners"}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {ownerScopedContacts.length} contact
            {ownerScopedContacts.length === 1 ? "" : "s"} in current lane
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Contacts</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {counts.total}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Filtered</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {counts.filtered}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">With Phone</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {counts.withPhone}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Assigned Owner</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-600">
            {assignedCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unassigned</p>
          <p className="mt-3 text-3xl font-semibold text-rose-600">
            {unassignedCount}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">FEC Matched</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-950">
            {donorStats.fecMatched}
          </p>
          <p className="mt-2 text-sm text-emerald-900/70">
            Contacts with matched or probable donor records
          </p>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-800">Major Donors</p>
          <p className="mt-3 text-3xl font-semibold text-blue-950">
            {donorStats.majorDonors}
          </p>
          <p className="mt-2 text-sm text-blue-900/70">
            Contacts at major or maxed donor tiers
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-300 bg-yellow-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-yellow-900">Jackpot Candidates</p>
          <p className="mt-3 text-3xl font-semibold text-yellow-950">
            {donorStats.jackpotCandidates}
          </p>
          <p className="mt-2 text-sm text-yellow-900/80">
            Donor anomalies that should be reviewed
          </p>
        </div>
      </section>
      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:p-8">
        {message ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Contact Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              This is the main contact work surface. Open profiles, update ownership, and keep the source layer clean.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {filteredContacts.length} visible record
            {filteredContacts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Select
                </th>
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
                  State
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Party
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Donor Signal
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Owner
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
                            {filteredContacts.map((contact) => {
                const currentOwnerValue =
                  editingOwner[contact.id] ?? contact.owner_name ?? "";

                return (
                  <tr key={contact.id} className="bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleSelected(contact.id)}
                        className="h-4 w-4"
                      />
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-900">
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
                      {contact.city || "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {contact.state || "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {contact.party || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {contact.jackpot_candidate ? (
                          <span className="rounded-full border border-yellow-300 bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-900">
                            Jackpot
                          </span>
                        ) : null}

                        {contact.fec_match_status && contact.fec_match_status !== "none" ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            FEC {contact.fec_match_status}
                          </span>
                        ) : null}

                        {contact.fec_donor_tier && contact.fec_donor_tier !== "none" ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${donorTierTone(contact.fec_donor_tier)}`}>
                            {formatDonorTier(contact.fec_donor_tier)}
                          </span>
                        ) : null}

                        {!contact.jackpot_candidate &&
                        (!contact.fec_match_status || contact.fec_match_status === "none") &&
                        (!contact.fec_donor_tier || contact.fec_donor_tier === "none") ? (
                          <span className="text-sm text-slate-400">—</span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <input
                        value={currentOwnerValue}
                        onChange={(e) =>
                          setEditingOwner((prev) => ({
                            ...prev,
                            [contact.id]: e.target.value,
                          }))
                        }
                        placeholder="Assign owner..."
                        className="w-full min-w-[180px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <button
                        onClick={() => saveOwner(contact.id)}
                        disabled={savingId === contact.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === contact.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-slate-500"
                  >
                    No contacts matched your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Search + Filters
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quickly narrow the contact layer before building lists or assigning ownership.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {filteredContacts.length} matching contact
            {filteredContacts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts, FEC, jackpot, major..."
              className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4"
            />
          </div>

          <input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="City"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />

          <input
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder="State"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />

          <input
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            placeholder="Party"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Lists Workspace
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Contacts feed Lists. Lists feed Outreach. Keep the source layer and grouping layer together here.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {taggedLists.length} visible list
            {taggedLists.length === 1 ? "" : "s"}
          </div>
        </div>

        {taggedLists.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
            No lists available in the current owner lane yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {taggedLists.map((list) => (
              <div
                key={list.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {list.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Default owner: {list.default_owner_name || "Unassigned"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listTagTone(
                      list.tag
                    )}`}
                  >
                    {list.tag}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/lists/${list.id}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Open List
                  </Link>

                  <Link
                    href={`/dashboard/outreach?listId=${list.id}`}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Work in Outreach
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm lg:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Bulk Owner Assignment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Utility action: select filtered contacts and assign ownership in one move.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {selectedIds.length} selected
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
          <input
            value={bulkOwnerName}
            onChange={(e) => setBulkOwnerName(e.target.value)}
            placeholder="Bulk owner name..."
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />

          <button
            onClick={toggleSelectAllFiltered}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            {allFilteredSelected ? "Clear Filtered" : "Select Filtered"}
          </button>

          <button
            onClick={applyBulkOwner}
            disabled={bulkSaving || selectedIds.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Zap className="h-4 w-4" />
            {bulkSaving ? "Applying..." : "Apply Bulk Owner"}
          </button>
        </div>
      </section>
    </div>
  );
}