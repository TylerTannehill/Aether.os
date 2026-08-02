"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Building2,
  Sparkles,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Headset,
  Search,
  RefreshCw,
  CalendarDays,
  Tag,
  Flag,
  CircleDot,
  Hash,
  Pencil,
  Save,
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

type OrganizationStatus = "active" | "suspended" | string;

type Organization = {
  id: string;
  name: string;
  slug: string;
  context_mode: string | null;
  aether_tier: string | null;
  abe_stage: string | null;
  status: OrganizationStatus | null;
  scheduled_deletion_at: string | null;
  created_at: string | null;
};

type OrganizationsResponse = {
  success?: boolean;
  organizations?: Organization[];
  error?: string;
};

type OrganizationEditForm = {
  name: string;
  slug: string;
  context_mode: string;
  aether_tier: string;
  abe_stage: string;
  status: string;
};

type StatusFilter =
  | "all"
  | "active"
  | "suspended"
  | "scheduled_deletion";

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not set";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusStyles(organization: Organization) {
  if (organization.scheduled_deletion_at) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (organization.status === "suspended") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function statusLabel(organization: Organization) {
  if (organization.scheduled_deletion_at) {
    return "Pending Deletion";
  }

  return formatLabel(organization.status || "active");
}

export default function TeamAetherOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [editForm, setEditForm] = useState<OrganizationEditForm>({
    name: "",
    slug: "",
    context_mode: "default",
    aether_tier: "t3",
    abe_stage: "early",
    status: "active",
  });

  const selectedOrganization = useMemo(
    () =>
      organizations.find(
        (organization) =>
          organization.id === selectedOrganizationId
      ) || null,
    [organizations, selectedOrganizationId]
  );

  const filteredOrganizations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return organizations.filter((organization) => {
      const matchesSearch =
        !normalizedSearch ||
        organization.name.toLowerCase().includes(normalizedSearch) ||
        organization.slug.toLowerCase().includes(normalizedSearch) ||
        organization.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "scheduled_deletion"
          ? Boolean(organization.scheduled_deletion_at)
          : (organization.status || "active") === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [organizations, search, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      all: organizations.length,
      active: organizations.filter(
        (organization) =>
          (organization.status || "active") === "active"
      ).length,
      suspended: organizations.filter(
        (organization) =>
          organization.status === "suspended"
      ).length,
      scheduled_deletion: organizations.filter(
        (organization) =>
          Boolean(organization.scheduled_deletion_at)
      ).length,
    }),
    [organizations]
  );

  async function loadOrganizations(showRefreshState = false) {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch(
        "/api/team-aether/organizations",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as OrganizationsResponse;

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load organizations."
        );
      }

      const nextOrganizations = result.organizations || [];

      setOrganizations(nextOrganizations);

      setSelectedOrganizationId((currentId) => {
        if (
          currentId &&
          nextOrganizations.some(
            (organization) => organization.id === currentId
          )
        ) {
          return currentId;
        }

        return nextOrganizations[0]?.id || null;
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organizations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function beginEditing() {
    if (!selectedOrganization) return;

    setEditForm({
      name: selectedOrganization.name,
      slug: selectedOrganization.slug,
      context_mode: selectedOrganization.context_mode || "default",
      aether_tier: selectedOrganization.aether_tier || "t3",
      abe_stage: selectedOrganization.abe_stage || "early",
      status: selectedOrganization.status || "active",
    });

    setEditing(true);
    setShowDeletionForm(false);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function handleVisualSave() {
    if (!selectedOrganization) return;

    try {
      setRefreshing(true);

      const response = await fetch(
        `/api/team-aether/organizations/${selectedOrganization.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            slug: editForm.slug.trim(),
            context_mode: editForm.context_mode,
            aether_tier: editForm.aether_tier,
            abe_stage: editForm.abe_stage,
            status: editForm.status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save organization.");
      }

      await loadOrganizations(true);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Unable to save organization.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleVisualScheduleDeletion() {
    if (!selectedOrganization) return;

    try {
      setRefreshing(true);

      const response = await fetch(
        `/api/team-aether/organizations/${selectedOrganization.id}/schedule-deletion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: deletionReason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to schedule deletion.");
      }

      await loadOrganizations(true);
      setDeletionReason("");
      setShowDeletionForm(false);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Unable to schedule deletion."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleVisualCancelDeletion() {
    if (!selectedOrganization) return;

    try {
      setRefreshing(true);

      const response = await fetch(
        `/api/team-aether/organizations/${selectedOrganization.id}/cancel-deletion`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to cancel deletion.");
      }

      await loadOrganizations(true);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Unable to cancel deletion."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (logoutError) {
      console.error("Logout failed", logoutError);
    }
  }

  useEffect(() => {
    void loadOrganizations();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* HERO */}
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Team Aether
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-5xl">
                Organization Management
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">
                Search, review, and manage every organization provisioned
                through Aether.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[170px_1fr]">
              <div className="flex flex-col items-start gap-3 pt-6">
                <a
                  href="/team-aether/sales-help"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  <Sparkles className="h-4 w-4" />
                  Sales Help
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/team-aether/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </a>

                  <a
                    href="/team-aether/organizations"
                    aria-current="page"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Building2 className="h-4 w-4" />
                    Organizations
                  </a>

                  <a
                    href="/team-aether"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <Sparkles className="h-4 w-4" />
                    Provisioning
                  </a>

                  <a
                    href="/team-aether/sales-pipeline"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Sales Pipeline
                  </a>

                  <a
                    href="/team-aether/support-portal"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <Headset className="h-4 w-4" />
                    Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              All Organizations
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {statusCounts.all}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Active
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-950">
              {statusCounts.active}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
              Suspended
            </p>
            <p className="mt-3 text-3xl font-semibold text-rose-950">
              {statusCounts.suspended}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              Pending Deletion
            </p>
            <p className="mt-3 text-3xl font-semibold text-amber-950">
              {statusCounts.scheduled_deletion}
            </p>
          </div>
        </section>

        {/* ORGANIZATION LIST */}
        <section className="rounded-[2rem] border-2 border-slate-900 bg-white p-6 shadow-md lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                <Building2 className="h-3.5 w-3.5" />
                Organizations
              </div>

              <h2 className="mt-3 text-2xl font-semibold">
                Manage Organizations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Live organization records loaded from Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadOrganizations(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by organization name, slug, or ID"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["active", "Active"],
                  ["suspended", "Suspended"],
                  ["scheduled_deletion", "Pending Deletion"],
                ] as const
              ).map(([value, label]) => {
                const active = statusFilter === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading organizations...
            </div>
          ) : null}

          {!loading && !error && organizations.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 font-semibold text-slate-900">
                No organizations found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Organizations will appear here after they are provisioned.
              </p>
            </div>
          ) : null}

          {!loading &&
          !error &&
          organizations.length > 0 &&
          filteredOrganizations.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No organizations match the current search and filter.
            </div>
          ) : null}

          {!loading && !error && filteredOrganizations.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Organization</th>
                      <th className="px-5 py-4">Tier</th>
                      <th className="px-5 py-4">Context</th>
                      <th className="px-5 py-4">Abe Stage</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Created</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredOrganizations.map((organization) => {
                      const selected =
                        organization.id === selectedOrganizationId;

                      return (
                        <tr
                          key={organization.id}
                          onClick={() => {
                            setSelectedOrganizationId(
                              organization.id
                            );
                            setEditing(false);
                            setShowDeletionForm(false);
                            setDeletionReason("");
                          }}
                          className={`cursor-pointer transition ${
                            selected
                              ? "bg-slate-100"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-950">
                              {organization.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {organization.slug}
                            </p>
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatLabel(organization.aether_tier)}
                          </td>

                          <td className="px-5 py-4">
                            {formatLabel(organization.context_mode)}
                          </td>

                          <td className="px-5 py-4">
                            {formatLabel(organization.abe_stage)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(
                                organization
                              )}`}
                            >
                              {statusLabel(organization)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {formatDate(organization.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        {/* SELECTED ORGANIZATION */}
        {selectedOrganization ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <CircleDot className="h-3.5 w-3.5" />
                  Selected Organization
                </div>

                <h2 className="mt-3 text-2xl font-semibold">
                  {selectedOrganization.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review the live organization record before making
                  management changes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(
                    selectedOrganization
                  )}`}
                >
                  {statusLabel(selectedOrganization)}
                </span>

                {!editing ? (
                  <button
                    type="button"
                    onClick={beginEditing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Organization
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Hash className="h-4 w-4" />
                  Organization ID
                </div>
                <p className="mt-3 break-all text-sm font-semibold">
                  {selectedOrganization.id}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Tag className="h-4 w-4" />
                  Slug
                </div>
                <p className="mt-3 break-all text-sm font-semibold">
                  {selectedOrganization.slug}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Created
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {formatDate(selectedOrganization.created_at)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Building2 className="h-4 w-4" />
                  Aether Tier
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {formatLabel(selectedOrganization.aether_tier)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Flag className="h-4 w-4" />
                  Context
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {formatLabel(selectedOrganization.context_mode)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Sparkles className="h-4 w-4" />
                  Abe Stage
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {formatLabel(selectedOrganization.abe_stage)}
                </p>
              </div>
            </div>

            {editing ? (
              <div className="mt-8 border-t border-slate-200 pt-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Organization
                  </div>

                  <h3 className="mt-3 text-xl font-semibold">
                    Organization Settings
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    These controls are visual only until the update API is connected.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      Organization Name
                    </span>
                    <input
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      Slug
                    </span>
                    <input
                      value={editForm.slug}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      Political / Design Context
                    </span>
                    <select
                      value={editForm.context_mode}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          context_mode: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="default">Default</option>
                      <option value="democrat">Democrat</option>
                      <option value="republican">Republican</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      Aether Tier
                    </span>
                    <select
                      value={editForm.aether_tier}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          aether_tier: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="t1">T1</option>
                      <option value="t2">T2</option>
                      <option value="t3">T3</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      Abe Stage
                    </span>
                    <select
                      value={editForm.abe_stage}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          abe_stage: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="early">Early</option>
                      <option value="mid">Mid</option>
                      <option value="late">Late</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      Organization Status
                    </span>
                    <select
                      value={editForm.status}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleVisualSave()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-8 border-t border-slate-200 pt-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Organization Lifecycle
                </div>

                <h3 className="mt-3 text-xl font-semibold">
                  Deletion Management
                </h3>
              </div>

              {selectedOrganization.scheduled_deletion_at ? (
                <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-amber-950">
                        Deletion scheduled
                      </p>
                      <p className="mt-1 text-sm text-amber-800">
                        Permanent deletion is scheduled for{" "}
                        {formatDate(
                          selectedOrganization.scheduled_deletion_at
                        )}
                        .
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleVisualCancelDeletion}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Cancel Scheduled Deletion
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        No deletion scheduled
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Scheduling deletion will suspend access immediately and retain data for 60 days.
                      </p>
                    </div>

                    {!showDeletionForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeletionForm(true);
                          setEditing(false);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Schedule Deletion
                      </button>
                    ) : null}
                  </div>

                  {showDeletionForm ? (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        This organization will be suspended immediately. Its data will remain recoverable for 60 days before permanent deletion.
                      </div>

                      <label className="mt-5 block">
                        <span className="text-sm font-semibold text-slate-900">
                          Reason
                        </span>
                        <textarea
                          value={deletionReason}
                          onChange={(event) =>
                            setDeletionReason(event.target.value)
                          }
                          placeholder="Example: Subscription ended and payment was not restored."
                          rows={4}
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                        />
                      </label>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleVisualScheduleDeletion}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Confirm 60-Day Deletion
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDeletionForm(false);
                            setDeletionReason("");
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
