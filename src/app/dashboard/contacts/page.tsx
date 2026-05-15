"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Users,
  X,
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
import { getOrgContextTheme } from "@/lib/org-context-theme";

function normalizeOwner(value?: string | null) {
  return value?.trim() || "Unassigned";
}

type DashboardList = DashboardData["lists"][number];
type OutreachListTag = "outreach" | "field" | "finance" | "volunteer";
type GivingRange = "any" | "none" | "1-99" | "100-499" | "500-999" | "1000+";
type FecStatusFilter = "any" | "matched" | "probable" | "none";
type DonorTierFilter = "any" | "base" | "mid" | "major" | "maxed";
type PartyFilter = "any" | "Democrat" | "Republican" | "Independent" | "Unknown";

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
      return "border border-slate-200 bg-slate-100 text-slate-300";
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

function formatCurrency(value?: number | null) {
  if (!value) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function matchesGivingRange(contact: Contact, range: GivingRange) {
  const total = Number(contact.fec_total_given || 0);

  switch (range) {
    case "none":
      return total <= 0;
    case "1-99":
      return total > 0 && total < 100;
    case "100-499":
      return total >= 100 && total < 500;
    case "500-999":
      return total >= 500 && total < 1000;
    case "1000+":
      return total >= 1000;
    case "any":
    default:
      return true;
  }
}

function matchesFecStatus(contact: Contact, status: FecStatusFilter) {
  if (status === "any") return true;
  return (contact.fec_match_status || "none") === status;
}

function matchesDonorTier(contact: Contact, tier: DonorTierFilter) {
  if (tier === "any") return true;
  return (contact.fec_donor_tier || "none") === tier;
}

function matchesParty(contact: Contact, party: PartyFilter) {
  if (party === "any") return true;
  return String(contact.party || "Unknown").toLowerCase() === party.toLowerCase();
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function DashboardContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<DashboardList[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState<PartyFilter>("any");
  const [givingRange, setGivingRange] = useState<GivingRange>("any");
  const [fecStatusFilter, setFecStatusFilter] = useState<FecStatusFilter>("any");
  const [donorTierFilter, setDonorTierFilter] = useState<DonorTierFilter>("any");
  const [segmentName, setSegmentName] = useState("");

  const [editingOwner, setEditingOwner] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOwnerName, setBulkOwnerName] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [contextMode, setContextMode] = useState("default");

  const { ownerFilter } = useDashboardOwner();
  const orgTheme = getOrgContextTheme(contextMode);

  useEffect(() => {
    loadContactsPageData();
  }, []);

  useEffect(() => {
    async function loadOrgContext() {
      try {
        const response = await fetch("/api/auth/current-context");

        if (!response.ok) return;

        const data = await response.json();

        setContextMode(
          data?.organization?.context_mode || "default"
        );
      } catch (error) {
        console.error("Failed to load org context", error);
      }
    }

    loadOrgContext();
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

  function stageCurrentSegment() {
    const trimmedName = segmentName.trim();

    if (!trimmedName) {
      setMessage("Name this segment before saving it as a list.");
      return;
    }

    setMessage(
      `"${trimmedName}" is staged from ${filteredContacts.length} filtered contact${filteredContacts.length === 1 ? "" : "s"}. Connect this button to the list creation helper to persist it on the Lists page.`
    );
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

  function clearFilters() {
    setSearch("");
    setCityFilter("");
    setStateFilter("");
    setPartyFilter("any");
    setGivingRange("any");
    setFecStatusFilter("any");
    setDonorTierFilter("any");
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
      partyFilter === "any" ? "" : partyFilter
    );

    const donorMatches = search.trim()
      ? ownerScopedContacts.filter((contact) =>
          contactMatchesDonorSearch(contact, search)
        )
      : [];

    const combined = new Map<string, Contact>();

    [...baseFiltered, ...donorMatches].forEach((contact) => {
      if (
        cityFilter &&
        String(contact.city || "").toLowerCase() !== cityFilter.toLowerCase()
      )
        return;
      if (
        stateFilter &&
        String(contact.state || "").toLowerCase() !== stateFilter.toLowerCase()
      )
        return;
      if (!matchesParty(contact, partyFilter)) return;
      if (!matchesGivingRange(contact, givingRange)) return;
      if (!matchesFecStatus(contact, fecStatusFilter)) return;
      if (!matchesDonorTier(contact, donorTierFilter)) return;

      combined.set(contact.id, contact);
    });

    return Array.from(combined.values());
  }, [
    ownerScopedContacts,
    search,
    cityFilter,
    stateFilter,
    partyFilter,
    givingRange,
    fecStatusFilter,
    donorTierFilter,
  ]);

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

  const activeFilters = useMemo(() => {
    const filters: { label: string; onClear: () => void }[] = [];

    if (search.trim()) filters.push({ label: `Search: ${search.trim()}`, onClear: () => setSearch("") });
    if (cityFilter.trim()) filters.push({ label: `City: ${cityFilter.trim()}`, onClear: () => setCityFilter("") });
    if (stateFilter.trim()) filters.push({ label: `State: ${stateFilter.trim()}`, onClear: () => setStateFilter("") });
    if (partyFilter !== "any") filters.push({ label: `Party: ${partyFilter}`, onClear: () => setPartyFilter("any") });
    if (givingRange !== "any") filters.push({ label: `Giving: ${givingRange}`, onClear: () => setGivingRange("any") });
    if (fecStatusFilter !== "any") filters.push({ label: `FEC: ${fecStatusFilter}`, onClear: () => setFecStatusFilter("any") });
    if (donorTierFilter !== "any") filters.push({ label: `Donor: ${donorTierFilter}`, onClear: () => setDonorTierFilter("any") });

    return filters;
  }, [search, cityFilter, stateFilter, partyFilter, givingRange, fecStatusFilter, donorTierFilter]);

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
    <div className="space-y-8 pb-10">
      <section
        className={`rounded-3xl border border-slate-900 bg-gradient-to-r p-5 shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Contact Management
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Contact Management
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Search, segment, assign, and organize the contact layer that powers
                Outreach, Lists, and downstream execution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/dashboard/outreach"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowRight className="h-4 w-4" />
              Back to Outreach
            </Link>

            <Link
              href="/dashboard/lists"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Users className="h-4 w-4" />
              View Lists
            </Link>

            <div className="hidden" aria-hidden="true">
              <button
                onClick={loadContactsPageData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Contacts</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{counts.total}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Filtered</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{counts.filtered}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">With Phone</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{counts.withPhone}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Assigned Owner</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-600">{assignedCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unassigned</p>
          <p className="mt-3 text-3xl font-semibold text-rose-600">{unassignedCount}</p>
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

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">Major Donors</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-950">
            {donorStats.majorDonors}
          </p>
          <p className="mt-2 text-sm text-emerald-900/70">
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

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Strategic Segmentation
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Build a Contact Universe
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Use human-controlled filters for giving history, location, and party.
              Then select, assign, or stage the current segment as a list.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {filteredContacts.length} matching contact
            {filteredContacts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p className="mb-3 text-sm font-semibold text-slate-900">
              Search + Location
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts, donor terms..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm"
                />
              </div>

              <input
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="City"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />

              <input
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                placeholder="State"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p className="mb-3 text-sm font-semibold text-slate-900">
              Save Current Segment
            </p>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                placeholder="Example: IL GOP $500+ donors"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />

              <Link
                href="/dashboard/lists"
                onClick={stageCurrentSegment}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <Save className="h-4 w-4" />
                Save List
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-slate-200/70">
            <p className="mb-3 text-sm font-semibold text-slate-900">Giving History</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["any", "Any"],
                ["none", "$0"],
                ["1-99", "$1–99"],
                ["100-499", "$100–499"],
                ["500-999", "$500–999"],
                ["1000+", "$1k+"],
              ].map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={givingRange === value}
                  onClick={() => setGivingRange(value as GivingRange)}
                >
                  {label}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-slate-200/70">
            <p className="mb-3 text-sm font-semibold text-slate-900">FEC + Donor Tier</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["any", "Any FEC"],
                ["matched", "Matched"],
                ["probable", "Probable"],
                ["none", "No FEC"],
              ].map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={fecStatusFilter === value}
                  onClick={() => setFecStatusFilter(value as FecStatusFilter)}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["any", "Any Tier"],
                ["base", "Base"],
                ["mid", "Mid"],
                ["major", "Major"],
                ["maxed", "Maxed"],
              ].map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={donorTierFilter === value}
                  onClick={() => setDonorTierFilter(value as DonorTierFilter)}
                >
                  {label}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-slate-200/70">
            <p className="mb-3 text-sm font-semibold text-slate-900">Party</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["any", "Any"],
                ["Democrat", "Dem"],
                ["Republican", "GOP"],
                ["Independent", "Ind"],
                ["Unknown", "Unknown"],
              ].map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={partyFilter === value}
                  onClick={() => setPartyFilter(value as PartyFilter)}
                >
                  {label}
                </FilterButton>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Current Segment
              </div>

              <div className="flex flex-wrap gap-2">
              {activeFilters.length === 0 ? (
                <span className="text-sm text-slate-500">
                  No active filters applied.
                </span>
              ) : (
                activeFilters.map((filter) => (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={filter.onClear}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {filter.label}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))
              )}
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Contact Records</h2>
            <p className="mt-1 text-sm text-slate-500">
              Filtered work surface. Open profiles, update ownership, or select rows for bulk action.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {filteredContacts.length} visible record
            {filteredContacts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="max-h-[680px] overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
          <table className="w-full min-w-[1180px] border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="w-[72px] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Select
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Phone
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  City
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  State
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Party
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Giving
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Donor Signal
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Owner
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => {
                const currentOwnerValue =
                  editingOwner[contact.id] ?? contact.owner_name ?? "";

                return (
                  <tr
                    key={contact.id}
                    className="border-b border-slate-200 bg-white transition hover:bg-slate-50"
                  >
                    <td className="border-b border-slate-100 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleSelected(contact.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="group inline-flex items-center rounded-xl px-2 py-1 -mx-2 -my-1 font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-800"
                      >
                        <span className="underline-offset-4 group-hover:underline">
                          {fullName(contact)}
                        </span>

                        <ArrowRight className="ml-1 h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                      {contact.email || "—"}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                      {contact.phone || "—"}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                      {contact.city || "—"}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                      {contact.state || "—"}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                      {contact.party || "—"}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                      {formatCurrency(contact.fec_total_given)}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3">
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
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${donorTierTone(
                              contact.fec_donor_tier
                            )}`}
                          >
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

                    <td className="border-b border-slate-100 px-4 py-3">
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

                    <td className="border-b border-slate-100 px-4 py-3">
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
                    colSpan={11}
                    className="bg-white px-4 py-8 text-center text-slate-500"
                  >
                    No contacts matched your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <section className="sticky bottom-5 z-20 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl lg:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_190px_190px] lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">Bulk Owner Assignment</h2>
              <p className="mt-1 text-sm text-slate-300">
                {selectedIds.length} selected. Assign ownership in one move or expand selection to all filtered contacts.
              </p>
            </div>

            <input
              value={bulkOwnerName}
              onChange={(e) => setBulkOwnerName(e.target.value)}
              placeholder="Bulk owner name..."
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-900"
            />

            <button
              onClick={toggleSelectAllFiltered}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <Users className="h-4 w-4" />
              {allFilteredSelected ? "Clear Filtered" : "Select Filtered"}
            </button>

            <button
              onClick={applyBulkOwner}
              disabled={bulkSaving || selectedIds.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Zap className="h-4 w-4" />
              {bulkSaving ? "Applying..." : "Apply Owner"}
            </button>
          </div>
        </section>
      ) : null}

    </div>
  );
}
