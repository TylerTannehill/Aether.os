"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import {
  ArrowRight,
  Clock3,
  ContactRound,
  ListChecks,
  Phone,
  Users,
  Zap,
} from "lucide-react";

const laneCard =
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4";

type CrmWorkList = {
  id: string;
  name: string;
  due_date: string | null;
};

type CrmFollowUp = {
  id: string;
  contact_id: string;
  department: "crm" | "dispatch" | "inventory";
  follow_up_date: string;
  action:
    | "Talked on phone"
    | "No answer"
    | "Emailed"
    | "Responded to Email"
    | "Texted"
    | "Responded to text";
};

type CrmFollowUpContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
};

export default function BusinessCrmFocusPage() {
  const [crmLists, setCrmLists] = useState<CrmWorkList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [crmFollowUps, setCrmFollowUps] = useState<CrmFollowUp[]>([]);
  const [followUpContacts, setFollowUpContacts] = useState<Record<string, CrmFollowUpContact>>({});
  const [followUpsLoading, setFollowUpsLoading] = useState(true);

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
          return;
        }

        const { data, error } = await supabase
          .from("business_lists")
          .select("id, name, due_date")
          .eq("organization_id", context.organization.id)
          .eq("department", "crm")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setCrmLists((data as CrmWorkList[]) || []);
      } catch {
        setCrmLists([]);
      } finally {
        setListsLoading(false);
      }
    }

    loadCrmLists();
  }, []);

  useEffect(() => {
    async function loadCrmFollowUps() {
      setFollowUpsLoading(true);

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const context = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !context?.organization?.id) {
          setCrmFollowUps([]);
          setFollowUpContacts({});
          return;
        }

        const { data: followUpData, error: followUpError } = await supabase
          .from("business_follow_ups")
          .select("id, contact_id, department, follow_up_date, action")
          .eq("organization_id", context.organization.id)
          .eq("department", "crm")
          .order("follow_up_date", { ascending: true })
          .order("created_at", { ascending: true });

        if (followUpError) throw followUpError;

        const loadedFollowUps = (followUpData as CrmFollowUp[]) || [];
        setCrmFollowUps(loadedFollowUps);

        const contactIds = Array.from(
          new Set(loadedFollowUps.map((followUp) => followUp.contact_id)),
        );

        if (contactIds.length === 0) {
          setFollowUpContacts({});
          return;
        }

        const { data: contactData, error: contactError } = await supabase
          .from("business_contacts")
          .select("id, first_name, last_name, company")
          .eq("organization_id", context.organization.id)
          .in("id", contactIds);

        if (contactError) throw contactError;

        const contactsById = ((contactData as CrmFollowUpContact[]) || []).reduce<
          Record<string, CrmFollowUpContact>
        >((current, contact) => {
          current[contact.id] = contact;
          return current;
        }, {});

        setFollowUpContacts(contactsById);
      } catch {
        setCrmFollowUps([]);
        setFollowUpContacts({});
      } finally {
        setFollowUpsLoading(false);
      }
    }

    loadCrmFollowUps();
  }, []);

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Zap className="h-3.5 w-3.5" />
              CRM Focus Mode
            </div>

            <div className="space-y-3 lg:space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                Relationship Execution
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                Work customer lists, complete real follow-ups, and organize contacts
                into executable relationship work.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/crm"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Back to CRM
              <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </Link>

            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
              Execution Doctrine
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
              Real relationship state becomes real work.
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
              CRM Focus will only surface work created by actual contacts, lists,
              interactions, and follow-up obligations. Nothing is manufactured here.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]">
            Customer reality → Focus → Execution
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3 lg:gap-4">
        <div className={laneCard}>
          <div className="mb-4 flex items-start justify-between gap-3 lg:mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 lg:text-sm">
                Work a List
              </h2>
              <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                Execute customer work from deliberately created lists.
              </p>
            </div>
            <Phone className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-2">
            {listsLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-medium text-slate-700 lg:text-[11px]">
                  Loading CRM lists...
                </p>
              </div>
            ) : crmLists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-medium text-slate-700 lg:text-[11px]">
                  No CRM lists are ready to work.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 lg:text-[9px]">
                  CRM-tagged Business lists will appear here when they exist.
                </p>
              </div>
            ) : (
              crmLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/business/lists/${list.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100 lg:rounded-xl lg:p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 lg:text-[11px]">
                      {list.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                      {list.due_date
                        ? `Due ${new Date(`${list.due_date}T00:00:00`).toLocaleDateString()}`
                        : "No due date"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 lg:h-3.5 lg:w-3.5" />
                </Link>
              ))
            )}
          </div>

          <Link
            href="/business/lists"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 lg:mt-3 lg:px-2.5 lg:text-[9px]"
          >
            Open List Management
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className={laneCard}>
          <div className="mb-4 flex items-start justify-between gap-3 lg:mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 lg:text-sm">
                Follow Up
              </h2>
              <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                Continue relationship actions created by prior interactions.
              </p>
            </div>
            <Clock3 className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-2">
            {followUpsLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-medium text-slate-700 lg:text-[11px]">
                  Loading CRM follow-ups...
                </p>
              </div>
            ) : crmFollowUps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-medium text-slate-700 lg:text-[11px]">
                  No CRM follow-ups are scheduled.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 lg:text-[9px]">
                  CRM follow-up obligations created on Contact Profiles will appear here.
                </p>
              </div>
            ) : (
              crmFollowUps.map((followUp) => {
                const followUpContact = followUpContacts[followUp.contact_id];
                const contactName = followUpContact
                  ? `${followUpContact.first_name || ""} ${followUpContact.last_name || ""}`.trim() ||
                    "Unnamed Contact"
                  : "Contact";

                return (
                  <Link
                    key={followUp.id}
                    href={`/business/contacts/${followUp.contact_id}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100 lg:rounded-xl lg:p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 lg:text-[11px]">
                          {contactName}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-600 lg:text-[9px]">
                          {followUp.action}
                        </p>
                        {followUpContact?.company ? (
                          <p className="mt-1 truncate text-xs text-slate-500 lg:text-[9px]">
                            {followUpContact.company}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-slate-700 lg:text-[9px]">
                          {new Date(`${followUp.follow_up_date}T00:00:00`).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 lg:text-[8px]">
                          CRM
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/business/crm"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 lg:mt-3 lg:px-2.5 lg:text-[9px]"
          >
            View Relationship Pipeline
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className={laneCard}>
          <div className="mb-4 flex items-start justify-between gap-3 lg:mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 lg:text-sm">
                Build a List
              </h2>
              <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                Organize customer records into the next executable segment.
              </p>
            </div>
            <Users className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
            <p className="text-sm font-medium text-slate-700 lg:text-[11px]">
              No organization pressure is connected yet.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 lg:text-[9px]">
              This lane will route real contact organization work into Contact
              Management without inventing segments or recommendations.
            </p>
          </div>

          <Link
            href="/business/contacts"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 lg:mt-3 lg:px-2.5 lg:text-[9px]"
          >
            Open Contact Management
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 lg:rounded-xl lg:p-2.5">
            <ListChecks className="h-5 w-5 lg:h-4 lg:w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
              Active Work Panel
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
              Execution controls will live here once CRM lists, follow-ups, and
              contact interactions are connected. For now, this surface remains
              intentionally empty rather than simulating customer work.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 lg:mt-4 lg:rounded-xl lg:p-4 lg:text-[11px]">
          Select real CRM work here once the Business relationship layer is connected.
        </div>
      </section>
    </div>
  );
}
