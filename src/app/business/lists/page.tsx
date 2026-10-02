"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ContactRound,
  ListChecks,
  Search,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type BusinessList = {
  id: string;
  organization_id: string;
  name: string;
  department: "crm" | "dispatch" | "inventory";
  created_by_user_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

const departmentLabels: Record<BusinessList["department"], string> = {
  crm: "CRM",
  dispatch: "Dispatch",
  inventory: "Inventory",
};

export default function BusinessListsPage() {
  const [lists, setLists] = useState<BusinessList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [department, setDepartment] =
    useState<BusinessList["department"]>("crm");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    async function loadLists() {
      setLoading(true);
      setLoadError("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !contextData?.organization?.id) {
          setLists([]);
          setLoadError("Unable to confirm the active Business organization.");
          return;
        }

        const { data, error } = await supabase
          .from("business_lists")
          .select(
            "id, organization_id, name, department, created_by_user_id, due_date, created_at, updated_at",
          )
          .eq("organization_id", contextData.organization.id)
          .order("created_at", { ascending: false });

        if (error) {
          setLists([]);
          setLoadError(`Lists did not load: ${error.message}`);
          return;
        }

        setLists((data as BusinessList[]) || []);
      } catch (error: any) {
        setLists([]);
        setLoadError(`Lists did not load: ${error?.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }

    loadLists();
  }, []);

  async function createList() {
    const cleanName = name.trim();

    if (!cleanName) {
      setCreateError("Enter a list name.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const contextData = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !contextData?.organization?.id) {
        setCreateError("Unable to confirm the active Business organization.");
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;

      let createdByUserId: string | null = null;

      if (authUserId) {
        const { data: appUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", authUserId)
          .maybeSingle();

        createdByUserId = appUser?.id || null;
      }

      const { data, error } = await supabase
        .from("business_lists")
        .insert({
          organization_id: contextData.organization.id,
          name: cleanName,
          department,
          created_by_user_id: createdByUserId,
          due_date: dueDate || null,
        })
        .select(
          "id, organization_id, name, department, created_by_user_id, due_date, created_at, updated_at",
        )
        .single();

      if (error) {
        setCreateError(`List did not save: ${error.message}`);
        return;
      }

      setLists((current) => [data as BusinessList, ...current]);
      setName("");
      setDepartment("crm");
      setDueDate("");
    } catch (error: any) {
      setCreateError(`List did not save: ${error?.message || "Unknown error"}`);
    } finally {
      setCreating(false);
    }
  }

  const filteredLists = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return lists;

    return lists.filter((list) => {
      const departmentLabel = departmentLabels[list.department].toLowerCase();
      return (
        list.name.toLowerCase().includes(query) ||
        departmentLabel.includes(query)
      );
    });
  }, [lists, search]);

  const dueCount = lists.filter((list) => Boolean(list.due_date)).length;

  function formatDate(value: string | null) {
    if (!value) return "Not set";

    const date = new Date(
      value.length === 10 ? `${value}T00:00:00` : value,
    );

    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(date);
  }

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Shared customer infrastructure
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                List Management
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                Organize contacts into named work groups and route each list to the
                department where it logically belongs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          ["Saved Lists", String(lists.length), "Real Business work groups"],
          ["Visible", String(filteredLists.length), "Lists matching current search"],
          ["Due Dated", String(dueCount), "Lists with an optional due date"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 lg:mt-2 lg:text-2xl">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500 lg:mt-1.5 lg:text-[9px]">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
          Create
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
          Create Business List
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[11px]">
          Name the list, choose the department where the work belongs, and add an
          optional due date.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto] lg:items-end lg:gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              List Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="List name"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              Department
            </span>
            <select
              value={department}
              onChange={(event) =>
                setDepartment(event.target.value as BusinessList["department"])
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
            >
              <option value="crm">CRM</option>
              <option value="dispatch">Dispatch</option>
              <option value="inventory">Inventory</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              Due Date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
            />
          </label>

          <button
            type="button"
            onClick={createList}
            disabled={creating}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[11px]"
          >
            {creating ? "Creating..." : "Create List"}
          </button>
        </div>

        {createError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 lg:text-[10px]">
            {createError}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
              List Infrastructure
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
              Saved Lists
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[11px]">
              Lists package contacts into repeatable customer work without replacing
              the permanent Contact Profile.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:h-3.5 lg:w-3.5" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 sm:w-64 lg:rounded-xl lg:py-2 lg:pl-9 lg:pr-3 lg:text-[11px]"
            />
          </div>
        </div>

        {loadError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 lg:text-[10px]">
            {loadError}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 lg:mt-4 lg:rounded-2xl">
          <table className="w-full min-w-[820px] border-separate border-spacing-0">
            <thead className="bg-white">
              <tr>
                {[
                  "List",
                  "Department",
                  "Created",
                  "Due Date",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:py-3 lg:text-[9px]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-white px-6 py-12 text-center text-sm text-slate-500 lg:text-[11px]"
                  >
                    Loading Business lists...
                  </td>
                </tr>
              ) : filteredLists.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-white px-6 py-12 text-center lg:px-4 lg:py-10"
                  >
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 lg:h-10 lg:w-10 lg:rounded-xl">
                        <ListChecks className="h-5 w-5 lg:h-4 lg:w-4" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700 lg:mt-3 lg:text-[11px]">
                        {lists.length === 0
                          ? "No Business lists yet."
                          : "No lists match this search."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLists.map((list) => (
                  <tr key={list.id} className="border-t border-slate-200">
                    <td className="border-t border-slate-200 bg-white px-4 py-4 lg:px-3 lg:py-3">
                      <p className="text-sm font-semibold text-slate-800 lg:text-[11px]">
                        {list.name}
                      </p>
                    </td>
                    <td className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {departmentLabels[list.department]}
                    </td>
                    <td className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {formatDate(list.created_at)}
                    </td>
                    <td className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                      {formatDate(list.due_date)}
                    </td>
                    <td className="border-t border-slate-200 bg-white px-4 py-4 lg:px-3 lg:py-3">
                      <Link
                        href={`/business/lists/${list.id}`}
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

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
          Membership and execution remain intentionally separate.
        </p>
        <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
          This surface currently owns list identity and department routing only.
          Contacts, progress, dispositions, and Focus execution will become real through
          their own layers.
        </p>
      </section>
    </div>
  );
}
