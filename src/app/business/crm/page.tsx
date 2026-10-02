"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  BarChart3,
  ContactRound,
  ListChecks,
  Search,
  UsersRound,
  Zap,
} from "lucide-react";

type CrmList = {
  id: string;
  name: string;
};

type CrmContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  owner_user_id: string | null;
  updated_at: string;
};

type CrmInteraction = {
  contact_id: string;
  disposition:
    | "Talked on phone"
    | "No answer"
    | "Emailed"
    | "Responded to Email"
    | "Texted"
    | "Responded to text";
  created_at: string;
};

type CrmFollowUp = {
  contact_id: string;
  department: "crm" | "dispatch" | "inventory";
  follow_up_date: string;
  action: CrmInteraction["disposition"];
  created_at: string;
};

type PipelineFilter = "All" | "Follow-Up" | "Awaiting Response";

export default function BusinessCrmPage() {
  const router = useRouter();
  const [crmLists, setCrmLists] = useState<CrmList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [crmContacts, setCrmContacts] = useState<CrmContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactSearch, setContactSearch] = useState("");
  const [crmInteractions, setCrmInteractions] = useState<CrmInteraction[]>([]);
  const [crmFollowUps, setCrmFollowUps] = useState<CrmFollowUp[]>([]);
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("All");

  useEffect(() => {
    async function loadCrmLists() {
      setListsLoading(true);

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const context = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !context?.organization?.id) {
          setCrmLists([]);
          setCrmContacts([]);
          return;
        }

        const { data, error } = await supabase
          .from("business_lists")
          .select("id, name")
          .eq("organization_id", context.organization.id)
          .eq("department", "crm")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setCrmLists((data as CrmList[]) || []);

        const { data: contactData, error: contactError } = await supabase
          .from("business_contacts")
          .select("id, first_name, last_name, email, phone, company, owner_user_id, updated_at")
          .eq("organization_id", context.organization.id)
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true });

        if (contactError) throw contactError;

        setCrmContacts((contactData as CrmContact[]) || []);

        const [
          { data: interactionData, error: interactionError },
          { data: followUpData, error: followUpError },
        ] = await Promise.all([
          supabase
            .from("business_interactions")
            .select("contact_id, disposition, created_at")
            .eq("organization_id", context.organization.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("business_follow_ups")
            .select("contact_id, department, follow_up_date, action, created_at")
            .eq("organization_id", context.organization.id)
            .eq("department", "crm")
            .order("follow_up_date", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);

        if (interactionError) throw interactionError;
        if (followUpError) throw followUpError;

        setCrmInteractions((interactionData as CrmInteraction[]) || []);
        setCrmFollowUps((followUpData as CrmFollowUp[]) || []);
      } catch {
        setCrmLists([]);
        setCrmContacts([]);
        setCrmInteractions([]);
        setCrmFollowUps([]);
      } finally {
        setListsLoading(false);
        setContactsLoading(false);
      }
    }

    loadCrmLists();
  }, []);

  const normalizedContactSearch = contactSearch.trim().toLowerCase();

  const matchingContacts = normalizedContactSearch
    ? crmContacts
        .filter((contact) => {
          const searchable = [
            contact.first_name,
            contact.last_name,
            contact.email,
            contact.phone,
            contact.company,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(normalizedContactSearch);
        })
        .slice(0, 8)
    : [];

  const pipelineRows = crmContacts
    .map((contact) => {
      const latestInteraction =
        crmInteractions.find((interaction) => interaction.contact_id === contact.id) || null;
      const nextFollowUp =
        crmFollowUps.find((followUp) => followUp.contact_id === contact.id) || null;

      const lastActivityCandidates = [
        contact.updated_at,
        latestInteraction?.created_at || null,
        ...crmFollowUps
          .filter((followUp) => followUp.contact_id === contact.id)
          .map((followUp) => followUp.created_at),
      ].filter((value): value is string => Boolean(value));

      const lastActivity =
        lastActivityCandidates.length > 0
          ? lastActivityCandidates.reduce((latest, value) =>
              new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
            )
          : null;

      const awaitingResponse =
        latestInteraction?.disposition === "Emailed" ||
        latestInteraction?.disposition === "Texted";

      const name =
        `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
        contact.email ||
        contact.company ||
        "Unnamed Contact";

      return {
        contact,
        name,
        latestInteraction,
        nextFollowUp,
        lastActivity,
        awaitingResponse,
      };
    })
    .filter((row) => {
      const query = pipelineSearch.trim().toLowerCase();
      if (query) {
        const searchable = [
          row.name,
          row.contact.email,
          row.contact.phone,
          row.contact.company,
          row.latestInteraction?.disposition,
          row.nextFollowUp?.action,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      if (pipelineFilter === "Follow-Up") return Boolean(row.nextFollowUp);
      if (pipelineFilter === "Awaiting Response") return row.awaitingResponse;
      return true;
    });

  function formatPipelineDate(value: string | null) {
    if (!value) return "No activity yet";
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: value.length === 10 ? undefined : "short",
    }).format(date);
  }

  const totalContacts = crmContacts.length;
  const totalCrmLists = crmLists.length;
  const contactedContactIds = new Set(crmInteractions.map((interaction) => interaction.contact_id));
  const followUpContactIds = new Set(crmFollowUps.map((followUp) => followUp.contact_id));
  const contactedContacts = contactedContactIds.size;
  const contactsRequiringFollowUp = followUpContactIds.size;

  const chartData = [
    { label: "Total Contacts", value: totalContacts },
    { label: "Contacted", value: contactedContacts },
    { label: "Follow-Up", value: contactsRequiringFollowUp },
  ];
  const chartMax = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-4">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-4">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white lg:rounded-2xl lg:p-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] lg:text-[10px]">
                Business CRM
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight lg:mt-3 lg:text-3xl">
                Relationship Pipeline
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300 lg:mt-2 lg:text-sm">
                See customer relationships, find the people and lists behind the work,
                and move into execution when the next action is clear.
              </p>
            </div>

            <div className="flex flex-nowrap items-center gap-3 lg:justify-end lg:gap-2">
              <Link
                href="/business/contacts"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Contacts
              </Link>

              <Link
                href="/business/lists"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Lists
              </Link>

              <Link
                href="/business/crm/focus"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                <Zap className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Focus Mode
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
                CRM Activity
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 lg:text-xl">
                Contact Activity
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                A live view of known contacts, contacts with recorded interactions, and contacts requiring CRM follow-up.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 lg:h-9 lg:w-9 lg:rounded-xl">
              <BarChart3 className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
          </div>

          <div className="mt-6 grid min-h-64 grid-cols-3 items-end gap-5 border-b border-slate-200 px-4 pb-4 pt-6 lg:mt-4 lg:min-h-52 lg:gap-4 lg:px-3 lg:pb-3 lg:pt-4">
            {chartData.map((item) => {
              const height = item.value === 0 ? 0 : Math.max((item.value / chartMax) * 100, 10);

              return (
                <div key={item.label} className="flex h-full flex-col justify-end">
                  <div className="mb-2 text-center text-2xl font-bold text-slate-950 lg:text-lg">
                    {contactsLoading ? "—" : item.value}
                  </div>
                  <div className="flex h-44 items-end rounded-t-2xl bg-slate-100 px-3 lg:h-36 lg:rounded-t-xl lg:px-2">
                    <div
                      className="w-full rounded-t-xl bg-slate-900 transition-all lg:rounded-t-lg"
                      style={{ height: contactsLoading ? "0%" : `${height}%` }}
                    />
                  </div>
                  <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:mt-2 lg:text-[9px]">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-3">
          {[
            {
              label: "Total Contacts",
              value: totalContacts,
              detail: "Business contacts in this organization",
            },
            {
              label: "CRM Lists",
              value: totalCrmLists,
              detail: "Lists routed to CRM",
            },
            {
              label: "Contacted",
              value: contactedContacts,
              detail: "Unique contacts with recorded interactions",
            },
            {
              label: "Requires Follow-Up",
              value: contactsRequiringFollowUp,
              detail: "Unique contacts with CRM follow-ups",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
                {metric.label}
              </p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 lg:mt-2 lg:text-3xl">
                {contactsLoading || listsLoading ? "—" : metric.value}
              </p>
              <p className="mt-2 text-sm text-slate-500 lg:text-[10px]">
                {metric.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="mb-5 lg:mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
              Quick Find
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
              Jump into customer reality
            </h2>
            <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
              These searches will become fast paths into contact profiles and lists.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:gap-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-xl lg:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 lg:text-[12px]">
                <ContactRound className="h-4 w-4" />
                Find Contact
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="search"
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder={contactsLoading ? "Loading contacts..." : "Search contacts..."}
                  aria-label="Search contacts"
                  disabled={contactsLoading}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed lg:text-[12px]"
                />
              </div>

              {normalizedContactSearch ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:rounded-xl">
                  {matchingContacts.length > 0 ? (
                    matchingContacts.map((contact) => {
                      const name =
                        `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
                        "Unnamed Contact";
                      const detail =
                        contact.company || contact.email || contact.phone || "Contact profile";

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => router.push(`/business/contacts/${contact.id}`)}
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 lg:px-3 lg:py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 lg:text-[11px]">
                              {name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500 lg:text-[9px]">
                              {detail}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-slate-500 lg:text-[9px]">
                            Open
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 lg:px-3 lg:py-2.5 lg:text-[10px]">
                      No matching contacts.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-xl lg:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 lg:text-[12px]">
                <ListChecks className="h-4 w-4" />
                Jump to CRM List
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2">
                <ListChecks className="h-4 w-4 shrink-0 text-slate-400" />
                <select
                  defaultValue=""
                  disabled={listsLoading || crmLists.length === 0}
                  onChange={(event) => {
                    if (event.target.value) {
                      router.push(`/business/lists/${event.target.value}`);
                    }
                  }}
                  aria-label="Jump to CRM list"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400 lg:text-[12px]"
                >
                  <option value="">
                    {listsLoading
                      ? "Loading CRM lists..."
                      : crmLists.length === 0
                        ? "No CRM lists available"
                        : "Select a CRM list..."}
                  </option>
                  {crmLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
                CRM
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 lg:text-xl">
                Relationship Pipeline
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[11px]">
                This view will aggregate relationship state from customer activity rather
                than becoming a second customer record.
              </p>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={pipelineSearch}
                onChange={(event) => setPipelineSearch(event.target.value)}
                placeholder="Search pipeline..."
                aria-label="Search relationship pipeline"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 lg:rounded-xl lg:py-2 lg:text-[12px]"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-4">
            {(["All", "Follow-Up", "Awaiting Response"] as PipelineFilter[]).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setPipelineFilter(label)}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition lg:rounded-xl lg:px-3 lg:py-1.5 lg:text-[11px] ${
                  pipelineFilter === label
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}

            {["Engaged", "Opportunity", "Customer"].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                title="Relationship state is not connected yet."
                className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 opacity-70 lg:rounded-xl lg:px-3 lg:py-1.5 lg:text-[11px]"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 lg:mt-4 lg:rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm lg:text-[12px]">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:text-[9px]">
                  <tr>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Contact</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Relationship</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Owner</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Last Activity</th>
                    <th className="px-5 py-4 lg:px-3.5 lg:py-2.5">Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineRows.map((row) => (
                    <tr
                      key={row.contact.id}
                      onClick={() => router.push(`/business/contacts/${row.contact.id}`)}
                      className="cursor-pointer border-t border-slate-100 bg-white transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 lg:px-3.5 lg:py-3">
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                          {row.contact.company || row.contact.email || "Contact profile"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-500 lg:px-3.5 lg:py-3">
                        Not connected
                      </td>
                      <td className="px-5 py-4 text-slate-500 lg:px-3.5 lg:py-3">
                        {row.contact.owner_user_id ? "Assigned" : "Not connected"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 lg:px-3.5 lg:py-3">
                        {formatPipelineDate(row.lastActivity)}
                      </td>
                      <td className="px-5 py-4 text-slate-600 lg:px-3.5 lg:py-3">
                        {row.nextFollowUp
                          ? `${row.nextFollowUp.action} · ${formatPipelineDate(row.nextFollowUp.follow_up_date)}`
                          : "No follow-up scheduled"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!contactsLoading && pipelineRows.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <UsersRound className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  No contacts match this pipeline view
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 lg:text-[11px] lg:leading-5">
                  Adjust the search or filter to return to the customer relationships already recorded.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
