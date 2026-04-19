"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardData } from "@/lib/data/types";
import { useDashboardOwner } from "../owner-context";

type Props = {
  contacts: DashboardData["contacts"];
  lists: DashboardData["lists"];
  logs: DashboardData["logs"];
  tasks: DashboardData["tasks"];
};

function normalizeOwner(value?: string | null) {
  return value?.trim() || "Unassigned";
}

export default function OperatorSwitcher({
  contacts,
  lists,
  logs,
  tasks,
}: Props) {
  const pathname = usePathname();
  const {
    ownerFilter,
    savedHomeOwner,
    setOwnerFilter,
    saveHomeOwner,
    clearHomeOwner,
    applyMyDashboard,
  } = useDashboardOwner();

  const owners = useMemo(() => {
    const set = new Set<string>();

    contacts.forEach((c) => set.add(normalizeOwner(c.owner_name)));
    lists.forEach((l) => set.add(normalizeOwner(l.default_owner_name)));
    tasks.forEach((t) => set.add(normalizeOwner(t.owner_name)));

    return Array.from(set).sort();
  }, [contacts, lists, tasks]);

  const scoped = useMemo(() => {
    if (!ownerFilter.trim()) {
      return {
        contacts: contacts.length,
        tasks: tasks.length,
        logs: logs.length,
      };
    }

    const filter = ownerFilter.toLowerCase();

    return {
      contacts: contacts.filter(
        (c) => normalizeOwner(c.owner_name).toLowerCase() === filter
      ).length,

      tasks: tasks.filter(
        (t) => normalizeOwner(t.owner_name).toLowerCase() === filter
      ).length,

      logs: logs.filter((l) => {
        const contactOwner = normalizeOwner(l.contacts?.owner_name).toLowerCase();
        const listOwner = normalizeOwner(l.lists?.default_owner_name).toLowerCase();
        return contactOwner === filter || listOwner === filter;
      }).length,
    };
  }, [contacts, tasks, logs, ownerFilter]);

  const isDashboardHome = pathname === "/dashboard";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      {/* TOP ROW */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Operator Switcher
          </p>

          <p className="mt-1 text-sm text-slate-700">
            Active lane:{" "}
            <span className="font-semibold">{ownerFilter || "All Owners"}</span>
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Saved home: {savedHomeOwner || "All Owners"}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">All Owners</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => saveHomeOwner(ownerFilter)}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Save
            </button>

            <button
              onClick={applyMyDashboard}
              className="rounded-2xl border px-4 py-2 text-sm"
            >
              My Dashboard
            </button>

            <button
              onClick={clearHomeOwner}
              className="rounded-2xl border px-4 py-2 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* COUNTS ROW */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Contacts</p>
          <p className="text-lg font-semibold">{scoped.contacts}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Tasks</p>
          <p className="text-lg font-semibold">{scoped.tasks}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Activity</p>
          <p className="text-lg font-semibold">{scoped.logs}</p>
        </div>
      </div>

      {!isDashboardHome && (
        <div className="text-xs text-blue-600">
          Owner lane active across all pages
        </div>
      )}
    </div>
  );
}