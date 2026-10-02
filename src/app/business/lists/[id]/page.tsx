"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ContactRound,
  Download,
  ListChecks,
  Search,
  Trash2,
  UserPlus,
  Users,
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

type BusinessContact = {
  id: string;
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
};

type Membership = {
  list_id: string;
  contact_id: string;
  added_at: string;
  added_by_user_id: string | null;
};

const card =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5";

const departmentLabels: Record<BusinessList["department"], string> = {
  crm: "CRM",
  dispatch: "Dispatch",
  inventory: "Inventory",
};

export default function BusinessListDetailPage() {
  const params = useParams();
  const listId = String(params?.id || "");

  const [list, setList] = useState<BusinessList | null>(null);
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [createdByName, setCreatedByName] = useState("Not available");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [addingContactId, setAddingContactId] = useState<string | null>(null);
  const [removingContactId, setRemovingContactId] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState("");

  useEffect(() => {
    if (!listId) return;

    async function loadList() {
      setLoading(true);
      setLoadError("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);
        const organizationId = contextData?.organization?.id;

        if (!contextResponse.ok || !organizationId) {
          setLoadError("Unable to confirm the active Business organization.");
          return;
        }

        const { data: listData, error: listError } = await supabase
          .from("business_lists")
          .select(
            "id, organization_id, name, department, created_by_user_id, due_date, created_at, updated_at",
          )
          .eq("id", listId)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (listError) {
          setLoadError(`List did not load: ${listError.message}`);
          return;
        }

        if (!listData) {
          setLoadError("This list was not found in the active Business organization.");
          return;
        }

        const typedList = listData as BusinessList;
        setList(typedList);

        const [
          { data: contactData, error: contactError },
          { data: membershipData, error: membershipLoadError },
        ] = await Promise.all([
          supabase
            .from("business_contacts")
            .select("id, first_name, last_name, email, phone, company, job_title, street_address, city, state, zip")
            .eq("organization_id", organizationId)
            .order("last_name", { ascending: true })
            .order("first_name", { ascending: true }),
          supabase
            .from("business_list_contacts")
            .select("list_id, contact_id, added_at, added_by_user_id")
            .eq("list_id", listId)
            .order("added_at", { ascending: false }),
        ]);

        if (contactError) {
          setLoadError(`Contacts did not load: ${contactError.message}`);
          return;
        }

        if (membershipLoadError) {
          setLoadError(`List membership did not load: ${membershipLoadError.message}`);
          return;
        }

        setContacts((contactData as BusinessContact[]) || []);
        setMemberships((membershipData as Membership[]) || []);

        if (typedList.created_by_user_id) {
          const { data: creator } = await supabase
            .from("users")
            .select("*")
            .eq("id", typedList.created_by_user_id)
            .maybeSingle();

          if (creator) {
            const creatorRecord = creator as Record<string, unknown>;
            const possibleName =
              creatorRecord.full_name ||
              creatorRecord.name ||
              creatorRecord.display_name ||
              creatorRecord.email;

            if (typeof possibleName === "string" && possibleName.trim()) {
              setCreatedByName(possibleName);
            } else {
              setCreatedByName("Recorded user");
            }
          }
        }
      } catch (error: any) {
        setLoadError(`List did not load: ${error?.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }

    loadList();
  }, [listId]);

  const memberIds = useMemo(
    () => new Set(memberships.map((membership) => membership.contact_id)),
    [memberships],
  );

  const memberContacts = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    return contacts.filter((contact) => {
      if (!memberIds.has(contact.id)) return false;
      if (!query) return true;

      return contactSearchText(contact).includes(query);
    });
  }, [contacts, memberIds, memberSearch]);

  const availableContacts = useMemo(() => {
    const query = availableSearch.trim().toLowerCase();

    return contacts.filter((contact) => {
      if (memberIds.has(contact.id)) return false;
      if (!query) return true;

      return contactSearchText(contact).includes(query);
    });
  }, [contacts, memberIds, availableSearch]);

  async function resolveCurrentAppUserId() {
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id;

    if (!authUserId) return null;

    const { data: appUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUserId)
      .maybeSingle();

    return appUser?.id || null;
  }

  async function addContact(contactId: string) {
    if (!list) return;

    setAddingContactId(contactId);
    setMembershipError("");

    try {
      const addedByUserId = await resolveCurrentAppUserId();

      const { data, error } = await supabase
        .from("business_list_contacts")
        .insert({
          list_id: list.id,
          contact_id: contactId,
          added_by_user_id: addedByUserId,
        })
        .select("list_id, contact_id, added_at, added_by_user_id")
        .single();

      if (error) {
        setMembershipError(`Contact was not added: ${error.message}`);
        return;
      }

      setMemberships((current) => [data as Membership, ...current]);
    } catch (error: any) {
      setMembershipError(
        `Contact was not added: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setAddingContactId(null);
    }
  }

  async function removeContact(contactId: string) {
    if (!list) return;

    setRemovingContactId(contactId);
    setMembershipError("");

    try {
      const { error } = await supabase
        .from("business_list_contacts")
        .delete()
        .eq("list_id", list.id)
        .eq("contact_id", contactId);

      if (error) {
        setMembershipError(`Contact was not removed: ${error.message}`);
        return;
      }

      setMemberships((current) =>
        current.filter((membership) => membership.contact_id !== contactId),
      );
    } catch (error: any) {
      setMembershipError(
        `Contact was not removed: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setRemovingContactId(null);
    }
  }

  function csvCell(value: string | null | undefined) {
    const text = value || "";
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportListCsv() {
    if (!list || memberContacts.length === 0) return;

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

    const rows = memberContacts.map((contact) => [
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
    const anchor = document.createElement("a");
    const safeListName =
      list.name
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "business-list";

    anchor.href = url;
    anchor.download = `${safeListName}-contacts.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function formatDate(value: string | null) {
    if (!value) return "Not set";

    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(date);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm lg:text-[11px]">
        Loading Business list...
      </div>
    );
  }

  if (!list) {
    return (
      <div className="space-y-4">
        <Link
          href="/business/lists"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 lg:text-[11px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Link>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700 lg:text-[11px]">
          {loadError || "List not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              {departmentLabels[list.department]} List
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                {list.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                Manage the contacts assigned to this Business work list.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 lg:gap-3">
        {[
          ["Contacts", String(memberships.length)],
          ["Department", departmentLabels[list.department]],
          ["Created By", createdByName],
          ["Created", formatDate(list.created_at)],
          ["Due Date", formatDate(list.due_date)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900 lg:mt-2 lg:text-base">
              {value}
            </p>
          </div>
        ))}
      </section>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 lg:text-[10px]">
          {loadError}
        </div>
      ) : null}

      {membershipError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 lg:text-[10px]">
          {membershipError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:gap-4">
        <div className={card}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                List Members
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Contacts currently assigned to this list.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:h-3.5 lg:w-3.5" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search list members..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 sm:w-64 lg:rounded-xl lg:py-2 lg:pl-9 lg:pr-3 lg:text-[11px]"
                />
              </div>

              <button
                type="button"
                onClick={exportListCsv}
                disabled={memberContacts.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[10px]"
              >
                <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 lg:mt-4 lg:rounded-2xl">
            <table className="w-full min-w-[700px] border-separate border-spacing-0">
              <thead className="bg-white">
                <tr>
                  {["Contact", "Email", "Phone", "Added", "Action"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className={`px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:px-3 lg:py-3 lg:text-[9px] ${
                          heading === "Action" ? "w-[190px] min-w-[190px]" : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {memberContacts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="bg-white px-6 py-12 text-center lg:px-4 lg:py-10"
                    >
                      <div className="mx-auto flex max-w-lg flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 lg:h-10 lg:w-10 lg:rounded-xl">
                          <Users className="h-5 w-5 lg:h-4 lg:w-4" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-700 lg:mt-3 lg:text-[11px]">
                          {memberships.length === 0
                            ? "No contacts are on this list yet."
                            : "No list members match this search."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  memberContacts.map((contact) => {
                    const membership = memberships.find(
                      (item) => item.contact_id === contact.id,
                    );

                    return (
                      <tr key={contact.id}>
                        <td className="border-t border-slate-200 bg-white px-4 py-4 lg:px-3 lg:py-3">
                          <p className="text-sm font-semibold text-slate-800 lg:text-[11px]">
                            {contactName(contact)}
                          </p>
                          {contact.company ? (
                            <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                              {contact.company}
                            </p>
                          ) : null}
                        </td>
                        <td className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                          {contact.email || "—"}
                        </td>
                        <td className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                          {contact.phone || "—"}
                        </td>
                        <td className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 lg:px-3 lg:py-3 lg:text-[10px]">
                          {formatDate(membership?.added_at || null)}
                        </td>
                        <td className="w-[190px] min-w-[190px] border-t border-slate-200 bg-white px-4 py-4 lg:px-3 lg:py-3">
                          <div className="flex flex-nowrap gap-2">
                            <Link
                              href={`/business/contacts/${contact.id}`}
                              className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[9px]"
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeContact(contact.id)}
                              disabled={removingContactId === contact.id}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 lg:text-[9px]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {removingContactId === contact.id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <UserPlus className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                Add Contacts
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Search contacts in the active Business organization and add them to
                this list.
              </p>
            </div>
          </div>

          <div className="relative mt-5 lg:mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:h-3.5 lg:w-3.5" />
            <input
              value={availableSearch}
              onChange={(event) => setAvailableSearch(event.target.value)}
              placeholder="Search available contacts..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 lg:rounded-xl lg:py-2.5 lg:pl-9 lg:pr-3 lg:text-[11px]"
            />
          </div>

          <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {availableContacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 lg:rounded-xl lg:p-3 lg:text-[10px]">
                {contacts.length === memberships.length
                  ? "Every available contact is already on this list."
                  : "No available contacts match this search."}
              </div>
            ) : (
              availableContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 lg:text-[10px]">
                      {contactName(contact)}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500 lg:text-[9px]">
                      {contact.email || contact.company || "No additional details"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addContact(contact.id)}
                    disabled={addingContactId === contact.id}
                    className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 lg:text-[9px]"
                  >
                    {addingContactId === contact.id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
          The list organizes the work. The Contact Profile owns the customer history.
        </p>
        <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
          Department-specific execution, progress, and dispositions remain separate
          from list membership until those workflows are connected.
        </p>
      </section>
    </div>
  );
}

function contactName(contact: BusinessContact) {
  const name = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || contact.email || contact.company || "Unnamed Contact";
}

function contactSearchText(contact: BusinessContact) {
  return [
    contact.first_name,
    contact.last_name,
    contact.email,
    contact.phone,
    contact.company,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
