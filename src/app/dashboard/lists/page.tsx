"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  createList,
  filterLists,
  getListCounts,
  getLists,
} from "@/lib/data/lists";
import { CampaignList } from "@/lib/data/types";
import { formatCreatedAt } from "@/lib/data/utils";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type ListTag = "outreach" | "finance" | "field" | "volunteer";

function resolveListTag(list: CampaignList): ListTag {
  const name = (list.name || "").toLowerCase();

  if (name.includes("finance") || name.includes("donor")) return "finance";
  if (name.includes("field") || name.includes("turf")) return "field";
  if (name.includes("volunteer") || name.includes("phone bank"))
    return "volunteer";

  return "outreach";
}

function tagTone(tag: ListTag) {
  switch (tag) {
    case "finance":
      return "bg-emerald-100 text-emerald-700";
    case "field":
      return "bg-sky-100 text-sky-700";
    case "volunteer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function DashboardListsPageContent() {
  const searchParams = useSearchParams();
  const listFromQuery = searchParams.get("name") || "";

  const [lists, setLists] = useState<CampaignList[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newListName, setNewListName] = useState("");
  const [search, setSearch] = useState("");
  const [contextMode, setContextMode] = useState("default");

  useEffect(() => {
    loadLists();
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

  useEffect(() => {
    if (listFromQuery) {
      setSearch(listFromQuery);
    }
  }, [listFromQuery]);

  async function loadLists() {
    try {
      setLoading(true);
      setMessage("");

      const data = await getLists();
      setLists(data);
    } catch (err: any) {
      setMessage(`Error loading lists: ${err?.message || "Unknown error"}`);
      setLists([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateList() {
    try {
      setMessage("");

      await createList({
        name: newListName,
      });

      setNewListName("");
      setMessage("List created successfully.");
      await loadLists();
    } catch (err: any) {
      setMessage(err?.message || "Error creating list.");
    }
  }

  const orgTheme = getOrgContextTheme(contextMode);

  const filteredLists = useMemo(() => {
    return filterLists(lists, search);
  }, [lists, search]);

  const counts = useMemo(() => {
    return getListCounts(lists, filteredLists);
  }, [lists, filteredLists]);

  const assignedOwnerCount = useMemo(() => {
    return lists.filter((list) => !!list.default_owner_name?.trim()).length;
  }, [lists]);

  const unassignedOwnerCount = useMemo(() => {
    return lists.filter((list) => !list.default_owner_name?.trim()).length;
  }, [lists]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Lists
        </h1>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-slate-900 bg-gradient-to-r p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            List Infrastructure
          </p>

          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
            List Management
          </h1>

          <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
            Build, organize, and deploy execution lists across Outreach,
            Finance, and Field.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Lists &amp; Call Packs
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Manage Lists
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="hidden" aria-hidden="true">
              <button
                onClick={loadLists}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
            <Link
              href="/dashboard/contacts"
              aria-label="Create List from Contacts"
              className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold !text-white shadow-sm transition hover:bg-slate-800"
            >
              <span className="block !text-white">Create List</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Saved Lists
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {counts.total}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total available lists</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Filtered
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {counts.filtered}
          </p>
          <p className="mt-1 text-xs text-slate-500">Current visible lists</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Ready
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {counts.ready}
          </p>
          <p className="mt-1 text-xs text-slate-500">Lists ready to route</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Owner Assigned
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {assignedOwnerCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Routing defaults set</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Needs Owner
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-600">
            {unassignedOwnerCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Still routing to unassigned
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Link
          href="/dashboard/outreach/focus"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Execution Route
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            Work Lists in Outreach
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Push active contact lists straight into outreach execution without
            losing routing context.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
            Open Outreach Focus
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/dashboard/finance/focus"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Finance Route
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            Work Donor Lists
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Move finance and donor lists into pledge collection, compliance
            cleanup, and follow-up.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
            Open Finance Focus
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/dashboard/field/focus"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Field Route
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            Deploy Field Lists
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Turn turf packets and call packs into active field execution with
            cleaner lane alignment.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
            Open Field Focus
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </section>

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Saved Lists
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredLists.length} list
              {filteredLists.length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/contacts"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Contacts
            </Link>

            <Link
              href="/dashboard/outreach/focus"
              aria-label="Open Outreach Focus"
              className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-slate-800"
            >
              <span className="block !text-white">Outreach Focus</span>
            </Link>
          </div>
        </div>

        {message ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <table className="w-full min-w-[1180px] border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Name
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Type
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Default Owner
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Created
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Readiness
                </th>
                <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLists.map((list) => {
                const hasOwner = !!list.default_owner_name?.trim();
                const tag = resolveListTag(list);
                const readyLabel = hasOwner ? "Execution Ready" : "Needs Owner";
                const isHighlighted =
                  listFromQuery &&
                  list.name.toLowerCase() === listFromQuery.toLowerCase();

                return (
                  <tr
                    key={list.id}
                    className={isHighlighted ? "bg-amber-50" : "bg-slate-50"}
                  >
                    <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                      {list.name}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tagTone(
                          tag
                        )}`}
                      >
                        {tag}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {list.default_owner_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatCreatedAt(list.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      {hasOwner ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {readyLabel}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          {readyLabel}
                        </span>
                      )}
                    </td>
                    <td className="rounded-r-2xl px-4 py-4 text-slate-600">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/dashboard/lists/${list.id}`}
                          className="font-medium transition hover:text-blue-700"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/outreach/focus?listId=${list.id}`}
                          className="font-medium text-emerald-700 transition hover:text-emerald-800"
                        >
                          Start Outreach
                        </Link>

                        <Link
                          href="/dashboard/contacts"
                          className="font-medium text-slate-700 transition hover:text-slate-900"
                        >
                          Open Contacts
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLists.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-slate-500"
                  >
                    No lists matched your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              List Controls
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create lists from Contacts segmentation, or narrow the current routing view.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_260px_160px]">
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lists or owner..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />

            <Link
              href="/dashboard/contacts"
              aria-label="Create List from Contacts"
              className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold !text-white shadow-sm transition hover:bg-slate-800"
            >
              <span className="block !text-white">Create List</span>
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}

export default function DashboardListsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading lists...</div>}>
      <DashboardListsPageContent />
    </Suspense>
  );
}