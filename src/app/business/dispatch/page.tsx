"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ContactRound,
  ListChecks,
  MapPinned,
  Navigation,
  Plus,
  Search,
  Truck,
  UserRoundCheck,
  Zap,
} from "lucide-react";

type DispatchJobStatus =
  | "unassigned"
  | "assigned"
  | "scheduled"
  | "in_progress"
  | "completed";

type DispatchJob = {
  id: string;
  name: string;
  contactId: string | null;
  customerName: string | null;
  address: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  assigneeName: string | null;
  status: DispatchJobStatus;
};

type DispatchContact = {
  id: string;
  firstName: string;
  lastName: string;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

type DispatchList = {
  id: string;
  name: string;
};

function statusLabel(status: DispatchJobStatus) {
  switch (status) {
    case "unassigned":
      return "Unassigned";
    case "assigned":
      return "Assigned";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
  }
}

function statusTone(status: DispatchJobStatus) {
  switch (status) {
    case "unassigned":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "assigned":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "scheduled":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "in_progress":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

export default function BusinessDispatchPage() {
  const [jobs, setJobs] = useState<DispatchJob[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<DispatchContact[]>([]);
  const [dispatchLists, setDispatchLists] = useState<DispatchList[]>([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobContactIds, setNewJobContactIds] = useState<string[]>([]);
  const [newJobListId, setNewJobListId] = useState("");
  const [newJobAddress, setNewJobAddress] = useState("");
  const [savingJob, setSavingJob] = useState(false);
  const [createJobError, setCreateJobError] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editJobName, setEditJobName] = useState("");
  const [editJobContactId, setEditJobContactId] = useState("");
  const [editJobAddress, setEditJobAddress] = useState("");
  const [editScheduledStart, setEditScheduledStart] = useState("");
  const [editScheduledEnd, setEditScheduledEnd] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editJobError, setEditJobError] = useState<string | null>(null);

  async function loadDispatchJobs() {
    setLoading(true);
    setError(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active organization found.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: availableContacts, error: availableContactsError } =
        await supabase
          .from("business_contacts")
          .select("id,first_name,last_name,street_address,city,state,zip")
          .eq("organization_id", organizationId)
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true });

      if (availableContactsError) throw availableContactsError;

      setContacts(
        (availableContacts || []).map((contact) => ({
          id: contact.id,
          firstName: contact.first_name || "",
          lastName: contact.last_name || "",
          streetAddress: contact.street_address,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
        }))
      );

      const { data: availableDispatchLists, error: dispatchListsError } =
        await supabase
          .from("business_lists")
          .select("id,name")
          .eq("organization_id", organizationId)
          .eq("department", "dispatch")
          .order("name", { ascending: true });

      if (dispatchListsError) throw dispatchListsError;

      setDispatchLists(
        (availableDispatchLists || []).map((list) => ({
          id: list.id,
          name: list.name,
        }))
      );

      const { data: jobRows, error: jobsError } = await supabase
        .from("business_dispatch_jobs")
        .select(
          "id,name,contact_id,address,assigned_user_id,scheduled_start,scheduled_end,status"
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const contactIds = Array.from(
        new Set(
          (jobRows || [])
            .map((job) => job.contact_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const assigneeIds = Array.from(
        new Set(
          (jobRows || [])
            .map((job) => job.assigned_user_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const [contactsResult, usersResult] = await Promise.all([
        contactIds.length > 0
          ? supabase
              .from("business_contacts")
              .select("id,first_name,last_name")
              .eq("organization_id", organizationId)
              .in("id", contactIds)
          : Promise.resolve({ data: [], error: null }),
        assigneeIds.length > 0
          ? supabase
              .from("users")
              .select("id,name")
              .in("id", assigneeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (contactsResult.error) throw contactsResult.error;
      if (usersResult.error) throw usersResult.error;

      const contactNames = new Map(
        (contactsResult.data || []).map((contact) => [
          contact.id,
          [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
            "Unnamed contact",
        ])
      );

      const assigneeNames = new Map(
        (usersResult.data || []).map((user) => [
          user.id,
          String(user.name || "").trim() || "Assigned user",
        ])
      );

      setJobs(
        (jobRows || []).map((job) => ({
          id: job.id,
          name: job.name,
          contactId: job.contact_id,
          customerName: job.contact_id
            ? contactNames.get(job.contact_id) || null
            : null,
          address: job.address,
          scheduledStart: job.scheduled_start,
          scheduledEnd: job.scheduled_end,
          assigneeName: job.assigned_user_id
            ? assigneeNames.get(job.assigned_user_id) || "Assigned"
            : null,
          status: job.status as DispatchJobStatus,
        }))
      );
    } catch (loadError) {
      console.error("Unable to load Business Dispatch jobs:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Business Dispatch jobs."
      );
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDispatchJobs();
  }, []);

  function formatContactAddress(contact: DispatchContact) {
    return [
      contact.streetAddress?.trim(),
      contact.city?.trim(),
      contact.state?.trim(),
      contact.zip?.trim(),
    ]
      .filter(Boolean)
      .join(", ");
  }

  function toggleNewJobContact(contactId: string) {
    setNewJobListId("");
    setNewJobContactIds((current) => {
      const next = current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId];

      if (next.length === 1) {
        const contact = contacts.find((item) => item.id === next[0]);
        setNewJobAddress(contact ? formatContactAddress(contact) : "");
      } else {
        setNewJobAddress("");
      }

      return next;
    });
  }

  async function handleDispatchListSelection(listId: string) {
    setNewJobListId(listId);
    setNewJobContactIds([]);
    setNewJobAddress("");
    setCreateJobError(null);

    if (!listId) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: memberships, error: membershipError } = await supabase
        .from("business_list_contacts")
        .select("contact_id")
        .eq("list_id", listId);

      if (membershipError) throw membershipError;

      const contactIds = Array.from(
        new Set(
          (memberships || [])
            .map((membership) => membership.contact_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      setNewJobContactIds(contactIds);

      if (contactIds.length === 1) {
        const contact = contacts.find((item) => item.id === contactIds[0]);
        setNewJobAddress(contact ? formatContactAddress(contact) : "");
      }
    } catch (listError) {
      console.error("Unable to load Dispatch list contacts:", listError);
      setCreateJobError(
        listError instanceof Error
          ? listError.message
          : "Unable to load contacts from this Dispatch list."
      );
    }
  }

  function resetCreateJob() {
    setShowCreateJob(false);
    setNewJobName("");
    setNewJobContactIds([]);
    setNewJobListId("");
    setNewJobAddress("");
    setCreateJobError(null);
  }

  async function createDispatchJob() {
    const name = newJobName.trim();

    if (!name) {
      setCreateJobError("Job name is required.");
      return;
    }

    const selectedContacts = newJobContactIds
      .map((contactId) => contacts.find((contact) => contact.id === contactId))
      .filter((contact): contact is DispatchContact => Boolean(contact));

    if (selectedContacts.length === 0 && !newJobAddress.trim()) {
      setCreateJobError(
        "Select at least one customer, choose a Dispatch list, or enter a service address."
      );
      return;
    }

    const contactsMissingAddress = selectedContacts.filter(
      (contact) => !formatContactAddress(contact)
    );

    if (contactsMissingAddress.length > 0) {
      const names = contactsMissingAddress
        .map(
          (contact) =>
            [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
            "Unnamed contact"
        )
        .join(", ");

      setCreateJobError(
        `Add a service address before dispatching: ${names}.`
      );
      return;
    }

    setSavingJob(true);
    setCreateJobError(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active organization found.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const rows =
        selectedContacts.length > 0
          ? selectedContacts.map((contact) => {
              const contactName =
                [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                "Unnamed contact";

              return {
                organization_id: organizationId,
                contact_id: contact.id,
                name:
                  selectedContacts.length > 1
                    ? `${name} — ${contactName}`
                    : name,
                address: formatContactAddress(contact),
                status: "unassigned",
              };
            })
          : [
              {
                organization_id: organizationId,
                contact_id: null,
                name,
                address: newJobAddress.trim(),
                status: "unassigned",
              },
            ];

      const { error: insertError } = await supabase
        .from("business_dispatch_jobs")
        .insert(rows);

      if (insertError) throw insertError;

      resetCreateJob();
      await loadDispatchJobs();
    } catch (saveError) {
      console.error("Unable to create Dispatch job:", saveError);
      setCreateJobError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create Dispatch job."
      );
    } finally {
      setSavingJob(false);
    }
  }

  function toLocalDateTimeInput(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }

  function beginEditJob(job: DispatchJob) {
    setEditingJobId(job.id);
    setEditJobName(job.name);
    setEditJobContactId(job.contactId || "");
    setEditJobAddress(job.address);
    setEditScheduledStart(toLocalDateTimeInput(job.scheduledStart));
    setEditScheduledEnd(toLocalDateTimeInput(job.scheduledEnd));
    setEditJobError(null);
  }

  function cancelEditJob() {
    setEditingJobId(null);
    setEditJobName("");
    setEditJobContactId("");
    setEditJobAddress("");
    setEditScheduledStart("");
    setEditScheduledEnd("");
    setEditJobError(null);
  }

  function handleEditContactSelection(contactId: string) {
    setEditJobContactId(contactId);
    const contact = contacts.find((item) => item.id === contactId);
    if (contact) {
      setEditJobAddress(formatContactAddress(contact));
    }
  }

  async function saveDispatchJob() {
    if (!editingJobId) return;

    const name = editJobName.trim();
    const address = editJobAddress.trim();

    if (!name) {
      setEditJobError("Job name is required.");
      return;
    }

    if (!address) {
      setEditJobError("A service address is required.");
      return;
    }

    if (
      editScheduledStart &&
      editScheduledEnd &&
      new Date(editScheduledEnd).getTime() < new Date(editScheduledStart).getTime()
    ) {
      setEditJobError("Schedule end must be after schedule start.");
      return;
    }

    setSavingEdit(true);
    setEditJobError(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active organization found.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const currentJob = jobs.find((job) => job.id === editingJobId);
      const nextStatus: DispatchJobStatus =
        currentJob?.status === "unassigned" && editScheduledStart
          ? "unassigned"
          : currentJob?.status || "unassigned";

      const { error: updateError } = await supabase
        .from("business_dispatch_jobs")
        .update({
          contact_id: editJobContactId || null,
          name,
          address,
          scheduled_start: editScheduledStart
            ? new Date(editScheduledStart).toISOString()
            : null,
          scheduled_end: editScheduledEnd
            ? new Date(editScheduledEnd).toISOString()
            : null,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", editingJobId);

      if (updateError) throw updateError;

      cancelEditJob();
      await loadDispatchJobs();
    } catch (saveError) {
      console.error("Unable to update Dispatch job:", saveError);
      setEditJobError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update Dispatch job."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status !== "completed"),
    [jobs]
  );

  const unassignedJobs = useMemo(
    () => jobs.filter((job) => job.status === "unassigned"),
    [jobs]
  );

  const inProgressJobs = useMemo(
    () => jobs.filter((job) => job.status === "in_progress"),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === "completed"),
    [jobs]
  );

  const routedJobs = useMemo(
    () => activeJobs.filter((job) => job.address.trim().length > 0),
    [activeJobs]
  );

  const query = search.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    if (!query) return jobs;

    return jobs.filter((job) =>
      [
        job.name,
        job.customerName,
        job.address,
        job.assigneeName,
        statusLabel(job.status),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [jobs, query]);

  const hasJobs = jobs.length > 0;

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Truck className="h-3.5 w-3.5" />
              Dispatch Command Center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Put the right work in the right hands.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Coordinate jobs, assignments, service locations, schedules, and
                routes from one operational workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateJob((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold !text-slate-950 transition hover:bg-slate-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              style={{ color: "#020617" }}
            >
              <Plus className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              New Job
            </button>

            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>

            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

            <Link
              href="/business/dispatch/focus"
              className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2"
            >
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:text-[9px]">
                    Focus Mode
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-200 transition group-hover:text-white lg:text-[11px]">
                    Open Dispatch Focus
                  </p>
                </div>
                <Zap className="h-4 w-4 text-slate-300 transition group-hover:text-white" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {showCreateJob ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                New Dispatch Job
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Create real work
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select one or more customers, or pull an entire Dispatch list into the job queue.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Job name</span>
                <input
                  value={newJobName}
                  onChange={(event) => setNewJobName(event.target.value)}
                  placeholder="e.g. Tuesday installation"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Dispatch list
                </span>
                <select
                  value={newJobListId}
                  onChange={(event) => void handleDispatchListSelection(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                >
                  <option value="">Choose individual customers</option>
                  {dispatchLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Customers
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {newJobContactIds.length} selected
                    {newJobListId ? " from the Dispatch list" : ""}
                  </p>
                </div>

                {newJobContactIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewJobContactIds([]);
                      setNewJobListId("");
                      setNewJobAddress("");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {contacts.map((contact) => {
                  const name =
                    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                    "Unnamed contact";
                  const address = formatContactAddress(contact);
                  const selected = newJobContactIds.includes(contact.id);

                  return (
                    <label
                      key={contact.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        selected
                          ? "border-slate-900 bg-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleNewJobContact(contact.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {name}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {address || "No service address"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {newJobContactIds.length <= 1 ? (
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Service address
                </span>
                <input
                  value={newJobAddress}
                  onChange={(event) => setNewJobAddress(event.target.value)}
                  placeholder="Street, city, state, ZIP"
                  disabled={newJobContactIds.length === 1}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600"
                />
                {newJobContactIds.length === 1 ? (
                  <span className="mt-1 block text-xs text-slate-500">
                    Using the selected customer&apos;s saved service address.
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-slate-500">
                    Leave customers unselected to create a one-off job at a manual address.
                  </span>
                )}
              </label>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                Each selected customer will become its own Dispatch job using that customer&apos;s saved service address.
              </div>
            )}

            {createJobError ? (
              <p className="text-sm font-medium text-rose-700">{createJobError}</p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={resetCreateJob}
                disabled={savingJob}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createDispatchJob()}
                disabled={savingJob}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: "#ffffff" }}
              >
                {savingJob
                  ? "Creating…"
                  : newJobContactIds.length > 1
                    ? `Create ${newJobContactIds.length} Jobs`
                    : "Create Job"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Active Jobs",
            value: activeJobs.length,
            detail: "Work still in motion",
            icon: BriefcaseBusiness,
          },
          {
            label: "Unassigned",
            value: unassignedJobs.length,
            detail: "Jobs needing an owner",
            icon: UserRoundCheck,
          },
          {
            label: "In Progress",
            value: inProgressJobs.length,
            detail: "Work currently underway",
            icon: Clock3,
          },
          {
            label: "Route Ready",
            value: routedJobs.length,
            detail: "Active jobs with locations",
            icon: Navigation,
          },
          {
            label: "Completed",
            value: completedJobs.length,
            detail: "Finished jobs",
            icon: CheckCircle2,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      {!loading && !hasJobs ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <BriefcaseBusiness className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Dispatch status
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                No dispatch jobs connected yet
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Dispatch will populate from real jobs and work orders once the
                Business data layer is connected. No assignments, schedules,
                routes, or completion activity have been estimated or generated.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Operations
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Jobs & work orders
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track who owns the work, where it happens, and where it stands.
              </p>
            </div>

            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dispatch"
                disabled={!hasJobs}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1.1fr_1fr_1.5fr_1fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Job</span>
              <span>Assigned To</span>
              <span>Location</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BriefcaseBusiness className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {hasJobs ? "No jobs match this search" : "No dispatch jobs"}
                </p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {hasJobs
                    ? "Adjust the search to find another job or work order."
                    : "Real jobs will appear here once Dispatch persistence is connected."}
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => beginEditJob(job)}
                  className="grid w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 last:border-b-0 md:grid-cols-[1.1fr_1fr_1.5fr_1fr_0.8fr] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{job.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {job.customerName || "No customer recorded"}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600">
                    {job.assigneeName || "Unassigned"}
                  </p>

                  <p className="text-sm text-slate-600">{job.address}</p>

                  <p className="text-sm text-slate-600">
                    {job.scheduledStart || "Not scheduled"}
                  </p>

                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                      job.status
                    )}`}
                  >
                    {statusLabel(job.status)}
                  </span>
                </button>
              ))
            )}
          </div>

          {editingJobId ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Edit Dispatch Job
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  Update the work
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Change the customer, service address, or schedule for this job.
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Customer</span>
                  <select
                    value={editJobContactId}
                    onChange={(event) => handleEditContactSelection(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  >
                    <option value="">No customer selected</option>
                    {contacts.map((contact) => {
                      const name =
                        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                        "Unnamed contact";
                      return (
                        <option key={contact.id} value={contact.id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Job name</span>
                  <input
                    value={editJobName}
                    onChange={(event) => setEditJobName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Service address
                  </span>
                  <input
                    value={editJobAddress}
                    onChange={(event) => setEditJobAddress(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    Scheduled start
                  </span>
                  <input
                    type="datetime-local"
                    value={editScheduledStart}
                    onChange={(event) => setEditScheduledStart(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    Scheduled end
                  </span>
                  <input
                    type="datetime-local"
                    value={editScheduledEnd}
                    onChange={(event) => setEditScheduledEnd(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              {editJobError ? (
                <p className="mt-4 text-sm font-medium text-rose-700">{editJobError}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditJob}
                  disabled={savingEdit}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveDispatchJob()}
                  disabled={savingEdit}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: "#ffffff" }}
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6 lg:space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Routing
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Google Routes
                </h2>
              </div>
              <MapPinned className="h-5 w-5 text-blue-600" />
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Aether-managed routing
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Aether already operates the Google Routes service. Dispatch
                    will use that shared routing engine when real job locations
                    are connected.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Dispatch adapter pending
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The current routing engine accepts Political Field lists.
                Business Dispatch will receive its own adapter after real job
                persistence exists. The existing Political route workflow
                remains untouched.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Assignment pressure
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Work ownership
                </h2>
              </div>
              <UserRoundCheck className="h-5 w-5 text-slate-500" />
            </div>

            {unassignedJobs.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No unassigned work
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Jobs will appear here only when real Dispatch records need an
                  owner.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {unassignedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{job.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{job.address}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Scheduling",
            value: jobs.filter((job) => Boolean(job.scheduledStart)).length,
            detail: "Jobs with a recorded schedule",
            icon: Clock3,
          },
          {
            label: "Assignments",
            value: jobs.filter((job) => Boolean(job.assigneeName)).length,
            detail: "Jobs with a recorded owner",
            icon: UserRoundCheck,
          },
          {
            label: "Service Locations",
            value: jobs.filter((job) => job.address.trim().length > 0).length,
            detail: "Jobs with routable addresses",
            icon: MapPinned,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-700">
                  {item.label}
                </p>
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Dispatch reflects real operational state
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This workspace does not fabricate jobs, workers, schedules,
              routes, travel times, or completion activity. As the Business
              Dispatch data layer is built, these surfaces will populate from
              records that actually exist.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
