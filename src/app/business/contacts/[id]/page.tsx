"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  ContactRound,
  ListChecks,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type BusinessContact = {
  id: string;
  organization_id: string;
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
  updated_at: string;
};

type BusinessContactNote = {
  id: string;
  organization_id: string;
  contact_id: string;
  author_user_id: string | null;
  note: string;
  created_at: string;
};

type BusinessList = {
  id: string;
  organization_id: string;
  name: string;
  department: "crm" | "dispatch" | "inventory";
  due_date: string | null;
  created_at: string;
};

type BusinessListMembership = {
  list_id: string;
  contact_id: string;
  added_at: string;
  added_by_user_id: string | null;
};

type BusinessInteraction = {
  id: string;
  organization_id: string;
  contact_id: string;
  department: "crm" | "dispatch" | "inventory";
  disposition:
    | "Talked on phone"
    | "No answer"
    | "Emailed"
    | "Responded to Email"
    | "Texted"
    | "Responded to text";
  created_by_user_id: string | null;
  created_at: string;
};

type BusinessFollowUp = {
  id: string;
  organization_id: string;
  contact_id: string;
  department: "crm" | "dispatch" | "inventory";
  follow_up_date: string;
  action: BusinessInteraction["disposition"];
  created_by_user_id: string | null;
  created_at: string;
};

const interactionDispositions: BusinessInteraction["disposition"][] = [
  "Talked on phone",
  "No answer",
  "Emailed",
  "Responded to Email",
  "Texted",
  "Responded to text",
];

const departmentLabels: Record<BusinessList["department"], string> = {
  crm: "CRM",
  dispatch: "Dispatch",
  inventory: "Inventory",
};

const card =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5";

export default function BusinessContactProfilePage() {
  const params = useParams();
  const contactId = String(params?.id || "");
  const [contact, setContact] = useState<BusinessContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityDraft, setIdentityDraft] = useState<BusinessContact | null>(null);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const [notes, setNotes] = useState<BusinessContactNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [availableLists, setAvailableLists] = useState<BusinessList[]>([]);
  const [listMemberships, setListMemberships] = useState<BusinessListMembership[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [listSearch, setListSearch] = useState("");
  const [listMessage, setListMessage] = useState("");
  const [addingListId, setAddingListId] = useState<string | null>(null);
  const [removingListId, setRemovingListId] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<BusinessInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(true);
  const [interactionDepartment, setInteractionDepartment] =
    useState<BusinessInteraction["department"]>("crm");
  const [interactionDisposition, setInteractionDisposition] =
    useState<BusinessInteraction["disposition"]>("Talked on phone");
  const [interactionSaving, setInteractionSaving] = useState(false);
  const [interactionMessage, setInteractionMessage] = useState("");
  const [followUps, setFollowUps] = useState<BusinessFollowUp[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);
  const [followUpDepartment, setFollowUpDepartment] =
    useState<BusinessFollowUp["department"]>("crm");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpAction, setFollowUpAction] =
    useState<BusinessFollowUp["action"]>("Talked on phone");
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");

  useEffect(() => {
    if (!contactId) return;

    async function loadContact() {
      setLoading(true);
      setLoadError("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !contextData?.organization?.id) {
          setContact(null);
          setLoadError("Unable to confirm the active Business organization.");
          return;
        }

        const { data, error } = await supabase
          .from("business_contacts")
          .select(
            "id, organization_id, first_name, last_name, email, phone, company, job_title, street_address, city, state, zip, updated_at",
          )
          .eq("id", contactId)
          .eq("organization_id", contextData.organization.id)
          .maybeSingle();

        if (error) {
          setContact(null);
          setLoadError(`Contact did not load: ${error.message}`);
          return;
        }

        if (!data) {
          setContact(null);
          setLoadError("This contact was not found in the active Business organization.");
          return;
        }

        const loadedContact = data as BusinessContact;
        setContact(loadedContact);
        setIdentityDraft(loadedContact);
      } catch (error: any) {
        setContact(null);
        setLoadError(
          `Contact did not load: ${error?.message || "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    }

    loadContact();
  }, [contactId]);

  useEffect(() => {
    if (!contactId) return;

    async function loadNotes() {
      setNotesLoading(true);
      setNoteMessage("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !contextData?.organization?.id) {
          setNotes([]);
          setNoteMessage("Unable to confirm the active Business organization.");
          return;
        }

        const { data, error } = await supabase
          .from("business_contact_notes")
          .select("id, organization_id, contact_id, author_user_id, note, created_at")
          .eq("organization_id", contextData.organization.id)
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false });

        if (error) {
          setNotes([]);
          setNoteMessage(`Notes did not load: ${error.message}`);
          return;
        }

        setNotes((data as BusinessContactNote[]) || []);
      } catch (error: any) {
        setNotes([]);
        setNoteMessage(`Notes did not load: ${error?.message || "Unknown error"}`);
      } finally {
        setNotesLoading(false);
      }
    }

    loadNotes();
  }, [contactId]);

  useEffect(() => {
    if (!contactId) return;

    async function loadInteractions() {
      setInteractionsLoading(true);
      setInteractionMessage("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !contextData?.organization?.id) {
          setInteractions([]);
          setInteractionMessage("Unable to confirm the active Business organization.");
          return;
        }

        const { data, error } = await supabase
          .from("business_interactions")
          .select(
            "id, organization_id, contact_id, department, disposition, created_by_user_id, created_at",
          )
          .eq("organization_id", contextData.organization.id)
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false });

        if (error) {
          setInteractions([]);
          setInteractionMessage(`Interactions did not load: ${error.message}`);
          return;
        }

        setInteractions((data as BusinessInteraction[]) || []);
      } catch (error: any) {
        setInteractions([]);
        setInteractionMessage(
          `Interactions did not load: ${error?.message || "Unknown error"}`,
        );
      } finally {
        setInteractionsLoading(false);
      }
    }

    loadInteractions();
  }, [contactId]);

  useEffect(() => {
    if (!contactId) return;

    async function loadFollowUps() {
      setFollowUpsLoading(true);
      setFollowUpMessage("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);

        if (!contextResponse.ok || !contextData?.organization?.id) {
          setFollowUps([]);
          setFollowUpMessage("Unable to confirm the active Business organization.");
          return;
        }

        const { data, error } = await supabase
          .from("business_follow_ups")
          .select(
            "id, organization_id, contact_id, department, follow_up_date, action, created_by_user_id, created_at",
          )
          .eq("organization_id", contextData.organization.id)
          .eq("contact_id", contactId)
          .order("follow_up_date", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) {
          setFollowUps([]);
          setFollowUpMessage(`Follow-ups did not load: ${error.message}`);
          return;
        }

        setFollowUps((data as BusinessFollowUp[]) || []);
      } catch (error: any) {
        setFollowUps([]);
        setFollowUpMessage(
          `Follow-ups did not load: ${error?.message || "Unknown error"}`,
        );
      } finally {
        setFollowUpsLoading(false);
      }
    }

    loadFollowUps();
  }, [contactId]);

  useEffect(() => {
    if (!contactId) return;

    async function loadListMemberships() {
      setListsLoading(true);
      setListMessage("");

      try {
        const contextResponse = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });
        const contextData = await contextResponse.json().catch(() => null);
        const organizationId = contextData?.organization?.id;

        if (!contextResponse.ok || !organizationId) {
          setAvailableLists([]);
          setListMemberships([]);
          setListMessage("Unable to confirm the active Business organization.");
          return;
        }

        const [listsResult, membershipsResult] = await Promise.all([
          supabase
            .from("business_lists")
            .select("id, organization_id, name, department, due_date, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false }),
          supabase
            .from("business_list_contacts")
            .select("list_id, contact_id, added_at, added_by_user_id")
            .eq("contact_id", contactId)
            .order("added_at", { ascending: false }),
        ]);

        if (listsResult.error) {
          setListMessage(`Lists did not load: ${listsResult.error.message}`);
          return;
        }

        if (membershipsResult.error) {
          setListMessage(
            `List memberships did not load: ${membershipsResult.error.message}`,
          );
          return;
        }

        setAvailableLists((listsResult.data as BusinessList[]) || []);
        setListMemberships(
          (membershipsResult.data as BusinessListMembership[]) || [],
        );
      } catch (error: any) {
        setListMessage(
          `List memberships did not load: ${error?.message || "Unknown error"}`,
        );
      } finally {
        setListsLoading(false);
      }
    }

    loadListMemberships();
  }, [contactId]);

  async function resolveCurrentAppUserId() {
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id || null;
    if (!authUserId) return null;

    const { data: appUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUserId)
      .maybeSingle();

    return appUser?.id || null;
  }

  async function addContactToList(listId: string) {
    if (!contact) return;

    setAddingListId(listId);
    setListMessage("");

    try {
      const addedByUserId = await resolveCurrentAppUserId();
      const { data, error } = await supabase
        .from("business_list_contacts")
        .insert({
          list_id: listId,
          contact_id: contact.id,
          added_by_user_id: addedByUserId,
        })
        .select("list_id, contact_id, added_at, added_by_user_id")
        .single();

      if (error) {
        setListMessage(`Contact was not added to the list: ${error.message}`);
        return;
      }

      setListMemberships((current) => [
        data as BusinessListMembership,
        ...current,
      ]);
      setListSearch("");
      setListMessage("Contact added to list.");
    } catch (error: any) {
      setListMessage(
        `Contact was not added to the list: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setAddingListId(null);
    }
  }

  async function removeContactFromList(listId: string) {
    if (!contact) return;

    setRemovingListId(listId);
    setListMessage("");

    try {
      const { error } = await supabase
        .from("business_list_contacts")
        .delete()
        .eq("list_id", listId)
        .eq("contact_id", contact.id);

      if (error) {
        setListMessage(`Contact was not removed from the list: ${error.message}`);
        return;
      }

      setListMemberships((current) =>
        current.filter((membership) => membership.list_id !== listId),
      );
      setListMessage("Contact removed from list.");
    } catch (error: any) {
      setListMessage(
        `Contact was not removed from the list: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setRemovingListId(null);
    }
  }

  async function saveInteraction() {
    if (!contact) return;

    setInteractionSaving(true);
    setInteractionMessage("");

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const contextData = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !contextData?.organization?.id) {
        setInteractionMessage("Unable to confirm the active Business organization.");
        return;
      }

      const createdByUserId = await resolveCurrentAppUserId();
      const { data, error } = await supabase
        .from("business_interactions")
        .insert({
          organization_id: contextData.organization.id,
          contact_id: contact.id,
          department: interactionDepartment,
          disposition: interactionDisposition,
          created_by_user_id: createdByUserId,
        })
        .select(
          "id, organization_id, contact_id, department, disposition, created_by_user_id, created_at",
        )
        .single();

      if (error) {
        setInteractionMessage(`Interaction did not save: ${error.message}`);
        return;
      }

      setInteractions((current) => [data as BusinessInteraction, ...current]);
      setInteractionMessage("Interaction saved.");
    } catch (error: any) {
      setInteractionMessage(
        `Interaction did not save: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setInteractionSaving(false);
    }
  }

  async function saveFollowUp() {
    if (!contact || !followUpDate) return;

    setFollowUpSaving(true);
    setFollowUpMessage("");

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const contextData = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !contextData?.organization?.id) {
        setFollowUpMessage("Unable to confirm the active Business organization.");
        return;
      }

      const createdByUserId = await resolveCurrentAppUserId();
      const { data, error } = await supabase
        .from("business_follow_ups")
        .insert({
          organization_id: contextData.organization.id,
          contact_id: contact.id,
          department: followUpDepartment,
          follow_up_date: followUpDate,
          action: followUpAction,
          created_by_user_id: createdByUserId,
        })
        .select(
          "id, organization_id, contact_id, department, follow_up_date, action, created_by_user_id, created_at",
        )
        .single();

      if (error) {
        setFollowUpMessage(`Follow-up did not save: ${error.message}`);
        return;
      }

      setFollowUps((current) =>
        [data as BusinessFollowUp, ...current].sort((a, b) => {
          const dateCompare = a.follow_up_date.localeCompare(b.follow_up_date);
          if (dateCompare !== 0) return dateCompare;
          return b.created_at.localeCompare(a.created_at);
        }),
      );
      setFollowUpDate("");
      setFollowUpMessage("Follow-up saved.");
    } catch (error: any) {
      setFollowUpMessage(
        `Follow-up did not save: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setFollowUpSaving(false);
    }
  }

  async function saveNote() {
    const cleanNote = noteDraft.trim();
    if (!contact || !cleanNote) return;

    setNoteSaving(true);
    setNoteMessage("");

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const contextData = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !contextData?.organization?.id) {
        setNoteMessage("Unable to confirm the active Business organization.");
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id || null;

      let authorUserId: string | null = null;
      if (authUserId) {
        const { data: appUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", authUserId)
          .maybeSingle();

        authorUserId = appUser?.id || null;
      }

      const { data, error } = await supabase
        .from("business_contact_notes")
        .insert({
          organization_id: contextData.organization.id,
          contact_id: contact.id,
          author_user_id: authorUserId,
          note: cleanNote,
        })
        .select("id, organization_id, contact_id, author_user_id, note, created_at")
        .single();

      if (error) {
        setNoteMessage(`Note did not save: ${error.message}`);
        return;
      }

      setNotes((current) => [data as BusinessContactNote, ...current]);
      setNoteDraft("");
      setNoteMessage("Note saved.");
    } catch (error: any) {
      setNoteMessage(`Note did not save: ${error?.message || "Unknown error"}`);
    } finally {
      setNoteSaving(false);
    }
  }

  function formatNoteTimestamp(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Timestamp unavailable";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function beginIdentityEdit() {
    if (!contact) return;
    setIdentityDraft({ ...contact });
    setIdentityMessage("");
    setEditingIdentity(true);
  }

  function cancelIdentityEdit() {
    if (contact) setIdentityDraft({ ...contact });
    setIdentityMessage("");
    setEditingIdentity(false);
  }

  function updateIdentityDraft(
    field: keyof BusinessContact,
    value: string,
  ) {
    setIdentityDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  async function saveIdentity() {
    if (!contact || !identityDraft) return;

    setIdentitySaving(true);
    setIdentityMessage("");

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const contextData = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !contextData?.organization?.id) {
        setIdentityMessage("Unable to confirm the active Business organization.");
        return;
      }

      const updates = {
        first_name: identityDraft.first_name?.trim() || null,
        last_name: identityDraft.last_name?.trim() || null,
        email: identityDraft.email?.trim() || null,
        phone: identityDraft.phone?.trim() || null,
        company: identityDraft.company?.trim() || null,
        job_title: identityDraft.job_title?.trim() || null,
        street_address: identityDraft.street_address?.trim() || null,
        city: identityDraft.city?.trim() || null,
        state: identityDraft.state?.trim() || null,
        zip: identityDraft.zip?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("business_contacts")
        .update(updates)
        .eq("id", contact.id)
        .eq("organization_id", contextData.organization.id)
        .select(
          "id, organization_id, first_name, last_name, email, phone, company, job_title, street_address, city, state, zip, updated_at",
        )
        .single();

      if (error) {
        setIdentityMessage(`Contact did not save: ${error.message}`);
        return;
      }

      const savedContact = data as BusinessContact;
      setContact(savedContact);
      setIdentityDraft(savedContact);
      setEditingIdentity(false);
      setIdentityMessage("Contact information saved.");
    } catch (error: any) {
      setIdentityMessage(
        `Contact did not save: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setIdentitySaving(false);
    }
  }

  const fullName = contact
    ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unnamed Contact"
    : "Contact Record";

  const location = contact
    ? [contact.street_address, contact.city, contact.state, contact.zip]
        .filter(Boolean)
        .join(", ") || "Not provided"
    : "Not connected";

  const identityRows = [
    ["Name", contact ? fullName : "Not connected", UserRound],
    ["Email", contact?.email || (contact ? "Not provided" : "Not connected"), Mail],
    ["Phone", contact?.phone || (contact ? "Not provided" : "Not connected"), Phone],
    ["Location", location, MapPin],
    [
      "Company / Organization",
      contact?.company || (contact ? "Not provided" : "Not connected"),
      BriefcaseBusiness,
    ],
    [
      "Job Title",
      contact?.job_title || (contact ? "Not provided" : "Not connected"),
      BriefcaseBusiness,
    ],
  ] as const;

  const membershipIds = new Set(
    listMemberships.map((membership) => membership.list_id),
  );

  const joinedLists = availableLists.filter((list) => membershipIds.has(list.id));

  const matchingAvailableLists = availableLists.filter((list) => {
    if (membershipIds.has(list.id)) return false;
    const query = listSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      list.name.toLowerCase().includes(query) ||
      departmentLabels[list.department].toLowerCase().includes(query)
    );
  });

  function formatListDate(value: string | null) {
    if (!value) return "Not set";
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return "Not set";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }

  const activityTimestamps = [
    contact?.updated_at || null,
    notes[0]?.created_at || null,
    interactions[0]?.created_at || null,
    followUps.reduce<string | null>((latest, followUp) => {
      if (!latest) return followUp.created_at;
      return new Date(followUp.created_at).getTime() > new Date(latest).getTime()
        ? followUp.created_at
        : latest;
    }, null),
    listMemberships.reduce<string | null>((latest, membership) => {
      if (!latest) return membership.added_at;
      return new Date(membership.added_at).getTime() > new Date(latest).getTime()
        ? membership.added_at
        : latest;
    }, null),
  ].filter((value): value is string => Boolean(value));

  const lastActivityTimestamp =
    activityTimestamps.length > 0
      ? activityTimestamps.reduce((latest, value) =>
          new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
        )
      : null;

  const nextFollowUp = followUps[0] || null;

  const lastActivityValue =
    loading || notesLoading || interactionsLoading || followUpsLoading || listsLoading
      ? "Loading..."
      : lastActivityTimestamp
        ? formatNoteTimestamp(lastActivityTimestamp)
        : "No activity yet";

  const nextActionValue = followUpsLoading
    ? "Loading..."
    : nextFollowUp
      ? `${nextFollowUp.action} · ${departmentLabels[nextFollowUp.department]} · ${formatListDate(nextFollowUp.follow_up_date)}`
      : "No follow-up scheduled";

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contact Profile
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                {loading ? "Loading Contact..." : fullName}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                The canonical Business record for identity, relationship context,
                interactions, follow-ups, ownership, and list membership.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 lg:text-[9px]">
              Record ID: {contactId || "Not available"}
            </div>

            {loadError ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 lg:text-[9px]">
                {loadError}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>

            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

            <Link
              href="/business/crm"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              CRM
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] lg:gap-4">
        <div className={card}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
                <UserRound className="h-5 w-5 lg:h-4 lg:w-4" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                  Contact Identity
                </h2>
                <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                  Core identity and durable Business contact information.
                </p>
              </div>
            </div>

            {!editingIdentity ? (
              <button
                type="button"
                onClick={beginIdentityEdit}
                disabled={!contact || loading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[9px]"
              >
                Edit Contact
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelIdentityEdit}
                  disabled={identitySaving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 lg:text-[9px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveIdentity}
                  disabled={identitySaving}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[9px]"
                >
                  {identitySaving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            )}
          </div>

          {editingIdentity && identityDraft ? (
            <div className="mt-6 space-y-4 lg:mt-4 lg:space-y-3">
              <div className="grid gap-4 sm:grid-cols-2 lg:gap-3">
                {[
                  ["First Name", "first_name"],
                  ["Last Name", "last_name"],
                  ["Email", "email"],
                  ["Phone", "phone"],
                  ["Company / Organization", "company"],
                  ["Job Title", "job_title"],
                ].map(([label, field]) => (
                  <label key={field} className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                      {label}
                    </span>
                    <input
                      value={String(identityDraft[field as keyof BusinessContact] || "")}
                      onChange={(event) =>
                        updateIdentityDraft(
                          field as keyof BusinessContact,
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
                    />
                  </label>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                  Location
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:gap-2">
                  <input
                    value={identityDraft.street_address || ""}
                    onChange={(event) =>
                      updateIdentityDraft("street_address", event.target.value)
                    }
                    placeholder="Street address"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
                  />
                  <input
                    value={identityDraft.city || ""}
                    onChange={(event) =>
                      updateIdentityDraft("city", event.target.value)
                    }
                    placeholder="City"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
                  />
                  <input
                    value={identityDraft.state || ""}
                    onChange={(event) =>
                      updateIdentityDraft("state", event.target.value)
                    }
                    placeholder="State"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
                  />
                  <input
                    value={identityDraft.zip || ""}
                    onChange={(event) =>
                      updateIdentityDraft("zip", event.target.value)
                    }
                    placeholder="ZIP"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 lg:text-[11px]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-4 lg:gap-3">
              {identityRows.map(([label, value, Icon]) => {
                const RowIcon = Icon as typeof UserRound;
                return (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <RowIcon className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] lg:text-[9px]">
                        {String(label)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700 lg:text-[11px]">
                      {String(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {identityMessage ? (
            <p className="mt-4 text-xs font-medium text-slate-600 lg:text-[9px]">
              {identityMessage}
            </p>
          ) : null}
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
            Relationship Snapshot
          </h2>
          <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
            CRM-level relationship state will summarize here once real contact
            activity is connected.
          </p>

          <div className="mt-5 space-y-3 lg:mt-4 lg:space-y-2">
            {[
              ["Relationship", "Not connected"],
              ["Owner", "Not connected"],
              ["Last Activity", lastActivityValue],
              ["Next Action", nextActionValue],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:rounded-xl lg:px-3 lg:py-2.5"
              >
                <span className="text-sm font-medium text-slate-500 lg:text-[10px]">
                  {label}
                </span>
                <span className="text-sm font-semibold text-slate-700 lg:text-[10px]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] lg:gap-4">
        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <MessageSquare className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Interaction History
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Calls, messages, notes, dispositions, and other customer interactions
                will accumulate on this record.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-4 lg:gap-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Department
              </span>
              <select
                value={interactionDepartment}
                onChange={(event) =>
                  setInteractionDepartment(
                    event.target.value as BusinessInteraction["department"],
                  )
                }
                disabled={!contact || interactionSaving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 lg:text-[11px]"
              >
                <option value="crm">CRM</option>
                <option value="dispatch">Dispatch</option>
                <option value="inventory">Inventory</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Disposition
              </span>
              <select
                value={interactionDisposition}
                onChange={(event) =>
                  setInteractionDisposition(
                    event.target.value as BusinessInteraction["disposition"],
                  )
                }
                disabled={!contact || interactionSaving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 lg:text-[11px]"
              >
                {interactionDispositions.map((disposition) => (
                  <option key={disposition} value={disposition}>
                    {disposition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveInteraction}
              disabled={!contact || interactionSaving}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[9px]"
            >
              {interactionSaving ? "Saving..." : "Save Interaction"}
            </button>

            {interactionMessage ? (
              <span className="text-xs font-medium text-slate-500 lg:text-[9px]">
                {interactionMessage}
              </span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                History
              </p>
              <span className="text-xs text-slate-400 lg:text-[9px]">
                {interactions.length} {interactions.length === 1 ? "interaction" : "interactions"}
              </span>
            </div>

            {interactionsLoading ? (
              <p className="text-sm text-slate-500 lg:text-[10px]">
                Loading interactions...
              </p>
            ) : interactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
                  No interactions yet.
                </p>
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 lg:text-[11px]">
                          {interaction.disposition}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 lg:text-[8px]">
                          {departmentLabels[interaction.department]}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 lg:text-[9px]">
                        {formatNoteTimestamp(interaction.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 lg:rounded-xl lg:p-2.5">
              <CalendarClock className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Follow-Up
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Future obligations created by real interactions will live here and
                eventually feed CRM Focus.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 lg:mt-4 lg:space-y-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Department
              </span>
              <select
                value={followUpDepartment}
                onChange={(event) =>
                  setFollowUpDepartment(
                    event.target.value as BusinessFollowUp["department"],
                  )
                }
                disabled={!contact || followUpSaving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 lg:text-[11px]"
              >
                <option value="crm">CRM</option>
                <option value="dispatch">Dispatch</option>
                <option value="inventory">Inventory</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Follow-Up Date
              </span>
              <input
                type="date"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
                disabled={!contact || followUpSaving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 lg:text-[11px]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Action
              </span>
              <select
                value={followUpAction}
                onChange={(event) =>
                  setFollowUpAction(
                    event.target.value as BusinessFollowUp["action"],
                  )
                }
                disabled={!contact || followUpSaving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 lg:text-[11px]"
              >
                {interactionDispositions.map((disposition) => (
                  <option key={disposition} value={disposition}>
                    {disposition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveFollowUp}
              disabled={!contact || !followUpDate || followUpSaving}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[9px]"
            >
              {followUpSaving ? "Saving..." : "Save Follow-Up"}
            </button>

            {followUpMessage ? (
              <span className="text-xs font-medium text-slate-500 lg:text-[9px]">
                {followUpMessage}
              </span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Scheduled Follow-Ups
              </p>
              <span className="text-xs text-slate-400 lg:text-[9px]">
                {followUps.length} {followUps.length === 1 ? "follow-up" : "follow-ups"}
              </span>
            </div>

            {followUpsLoading ? (
              <p className="text-sm text-slate-500 lg:text-[10px]">
                Loading follow-ups...
              </p>
            ) : followUps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
                  No follow-ups scheduled.
                </p>
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 lg:text-[11px]">
                          {followUp.action}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 lg:text-[8px]">
                            {departmentLabels[followUp.department]}
                          </span>
                          <span className="text-xs text-slate-500 lg:text-[9px]">
                            Due {formatListDate(followUp.follow_up_date)}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400 lg:text-[9px]">
                        {formatNoteTimestamp(followUp.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 lg:gap-4">
        <div className={card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Contact Notes
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Timestamped running notes preserve durable relationship context on
                the canonical contact record.
              </p>
            </div>
            <MessageSquare className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <textarea
            rows={4}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            disabled={!contact || noteSaving}
            placeholder="Add a relationship note..."
            className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 lg:mt-4 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px]"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveNote}
              disabled={!contact || !noteDraft.trim() || noteSaving}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[9px]"
            >
              {noteSaving ? "Saving..." : "Save Note"}
            </button>

            {noteMessage ? (
              <span className="text-xs font-medium text-slate-500 lg:text-[9px]">
                {noteMessage}
              </span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Running Notes
              </p>
              <span className="text-xs text-slate-400 lg:text-[9px]">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
            </div>

            {notesLoading ? (
              <p className="text-sm text-slate-500 lg:text-[10px]">Loading notes...</p>
            ) : notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
                  No contact notes yet.
                </p>
                <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                  Saved notes will appear here newest first with their original timestamp.
                </p>
              </div>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1 lg:space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 lg:text-[9px]">
                        {note.author_user_id ? "Team member" : "Aether user"}
                      </span>
                      <span className="text-xs text-slate-400 lg:text-[9px]">
                        {formatNoteTimestamp(note.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 lg:text-[11px] lg:leading-5">
                      {note.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                List Membership
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                See which work lists include this contact, open them, or change
                membership directly from the Contact Profile.
              </p>
            </div>
            <ListChecks className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          {listMessage ? (
            <p className="mt-4 text-xs font-medium text-slate-600 lg:text-[9px]">
              {listMessage}
            </p>
          ) : null}

          <div className="mt-5 lg:mt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Current Lists
              </p>
              <span className="text-xs text-slate-400 lg:text-[9px]">
                {joinedLists.length} {joinedLists.length === 1 ? "list" : "lists"}
              </span>
            </div>

            {listsLoading ? (
              <p className="mt-3 text-sm text-slate-500 lg:text-[10px]">
                Loading list memberships...
              </p>
            ) : joinedLists.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
                  This contact is not on a list yet.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {joinedLists.map((list) => (
                  <div
                    key={list.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 lg:text-[11px]">
                          {list.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                          {departmentLabels[list.department]} · Due {formatListDate(list.due_date)}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Link
                          href={`/business/lists/${list.id}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[9px]"
                        >
                          Open List
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeContactFromList(list.id)}
                          disabled={removingListId === list.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 lg:text-[9px]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {removingListId === list.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-slate-500 lg:h-3.5 lg:w-3.5" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Add to List
              </p>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:h-3.5 lg:w-3.5" />
              <input
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
                placeholder="Search available lists..."
                disabled={listsLoading || !contact}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 lg:text-[11px]"
              />
            </div>

            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {!listsLoading && matchingAvailableLists.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 lg:text-[10px]">
                  {availableLists.length === joinedLists.length
                    ? "This contact is already on every available list."
                    : "No available lists match this search."}
                </div>
              ) : (
                matchingAvailableLists.map((list) => (
                  <div
                    key={list.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 lg:text-[10px]">
                        {list.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                        {departmentLabels[list.department]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addContactToList(list.id)}
                      disabled={addingListId === list.id}
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 lg:text-[9px]"
                    >
                      {addingListId === list.id ? "Adding..." : "Add"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/business/lists"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[9px]"
          >
            <Users className="h-3.5 w-3.5" />
            Open List Management
          </Link>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
          Operational Context
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
          This is where other Business modules can eventually contribute customer
          context through deliberate product bridges without turning the Contact
          Profile into a duplicate operational system.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3 lg:mt-4 lg:gap-3">
          {[
            ["CRM", "Relationship state and next action"],
            ["Dispatch", "Service and delivery history"],
            ["Marketing", "Customer-level context when appropriate"],
          ].map(([label, detail]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
            >
              <p className="text-sm font-semibold text-slate-800 lg:text-[11px]">
                {label}
              </p>
              <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                {detail}
              </p>
              <p className="mt-3 text-xs font-medium text-slate-400 lg:text-[9px]">
                Not connected
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
