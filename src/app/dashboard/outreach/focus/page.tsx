"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ContactRound,
  List,
  ListChecks,
  Phone,
  User,
  Users,
  Zap,
} from "lucide-react";
import {
  buildContactIntelligence,
  createAutoTaskForOutcome,
  getListContacts,
  getOutreachLists,
  getOutreachLogs,
  getSortedWorkflowContacts,
  saveOutreachLog,
} from "@/lib/data/outreach";
import {
  CampaignList,
  Contact,
  ContactIntelligence,
  OutreachLog,
} from "@/lib/data/types";
import { fullName } from "@/lib/data/utils";
import { useDashboardOwner } from "../../owner-context";
import {
  getOutreachSignals,
  getFinanceSignals,
} from "@/lib/intelligence/signals";
import { aggregateAetherIntelligence } from "@/lib/intelligence/aggregator";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type ListTag = "outreach" | "field" | "finance" | "volunteer";

type FocusLaneItem = {
  id: string;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  type: "contact" | "follow_up" | "list";
  contactId?: string;
  listId?: string;
  tag?: ListTag;
  size?: number;
};

type ActiveContact = {
  id: string;
  name: string;
  phone: string;
};

type ActiveFollowUp = {
  id: string;
  name: string;
  note: string;
};

type ActiveList = {
  id: string;
  name: string;
  tag: ListTag;
  size: number;
};

type OutreachOutcome =
  | "connected_positive"
  | "connected_neutral"
  | "follow_up_needed"
  | "no_answer"
  | "wrong_time"
  | "completed";

type OrgMemberRole = {
  id?: string;
  organization_member_id: string;
  organization_id?: string | null;
  department: string;
  role_level: string;
  is_primary?: boolean | null;
};

type OrgMemberRecord = {
  id: string;
  user_id?: string | null;
  role?: string | null;
  department?: string | null;
  title?: string | null;
  organization_id?: string | null;
};

function normalizeRoleText(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatRoleText(value?: string | null) {
  const normalized = normalizeRoleText(value);

  if (!normalized) return "Member";

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


function normalizeOwner(value?: string | null) {
  return value?.trim() || "Unassigned";
}

function resolveListTag(list: CampaignList): ListTag {
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

function tagTone(tag: ListTag) {
  switch (tag) {
    case "field":
      return "bg-sky-100 text-sky-700";
    case "finance":
      return "bg-emerald-100 text-emerald-700";
    case "volunteer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityTone(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "border border-rose-200 bg-rose-100 text-rose-700";
    case "medium":
      return "border border-amber-200 bg-amber-100 text-amber-800";
    case "low":
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}



function OutreachFocusContent() {
  const searchParams = useSearchParams();
  const preselectedContactId = searchParams.get("contactId") || "";
  const preferredChannel = searchParams.get("channel");
  const preferredListId = searchParams.get("listId") || "";

  const { ownerFilter } = useDashboardOwner();

  const [lists, setLists] = useState<CampaignList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedListId, setSelectedListId] = useState(preferredListId);
  const [channel, setChannel] = useState<"call" | "text">(
    preferredChannel === "text" ? "text" : "call"
  );
  const [activeContact, setActiveContact] = useState<ActiveContact | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<ActiveFollowUp | null>(
    null
  );
  const [activeList, setActiveList] = useState<ActiveList | null>(null);

  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);
  const [hasOutreachAccess, setHasOutreachAccess] = useState(false);
  const [hasOutreachDirector, setHasOutreachDirector] = useState(false);
  const [outreachAccessLabel, setOutreachAccessLabel] =
    useState("Checking access");
  const [contextMode, setContextMode] = useState("default");

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRoleContext() {
      try {
        const response = await fetch("/api/admin/org-members");
        const payload = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          setHasOutreachAccess(false);
          setHasOutreachDirector(false);
          setOutreachAccessLabel("No org role detected");
          return;
        }

        const currentMember = payload.currentMember as OrgMemberRecord | null;
        const roles = Array.isArray(payload.roles)
          ? (payload.roles as OrgMemberRole[])
          : [];

        try {
          const contextResponse = await fetch("/api/auth/current-context");

          if (contextResponse.ok) {
            const contextData = await contextResponse.json();

            setContextMode(
              contextData?.organization?.context_mode || "default"
            );
          }
        } catch (contextError) {
          console.error(
            "Failed to load outreach focus org context mode:",
            contextError
          );
        }

        if (!currentMember?.id) {
          setHasOutreachAccess(false);
          setHasOutreachDirector(false);
          setOutreachAccessLabel("No org role detected");
          return;
        }

        const myRoles = roles.filter(
          (role) => role.organization_member_id === currentMember.id
        );

        const normalizedBaseRole = normalizeRoleText(currentMember.role);
        const isAdmin = normalizedBaseRole === "admin";
        const isDirector = normalizedBaseRole === "director";
        const hasAssignedRoles = myRoles.length > 0;
        const hasOutreachRole = myRoles.some(
          (role) => normalizeRoleText(role.department) === "outreach"
        );
        const hasDirectorRole = myRoles.some((role) => {
          const department = normalizeRoleText(role.department);
          const level = normalizeRoleText(role.role_level);

          return (
            department === "outreach" &&
            ["director", "admin", "campaign_manager"].includes(level)
          );
        });

        // Outreach is the shared contact/list/call execution hub, so any
        // real org member or assigned operating role should be allowed in.
        const accessAllowed = Boolean(
          isAdmin || isDirector || hasAssignedRoles || hasOutreachRole
        );

        setHasOutreachAccess(accessAllowed);
        setHasOutreachDirector(Boolean(isAdmin || isDirector || hasDirectorRole));

        if (isAdmin) {
          setOutreachAccessLabel("Admin Access");
        } else if (hasDirectorRole || isDirector) {
          setOutreachAccessLabel("Outreach Director Access");
        } else if (hasOutreachRole) {
          setOutreachAccessLabel("Outreach Role Access");
        } else if (hasAssignedRoles) {
          const primaryRole =
            myRoles.find((role) => role.is_primary) || myRoles[0];
          setOutreachAccessLabel(
            `${formatRoleText(primaryRole.department)} ${formatRoleText(
              primaryRole.role_level
            )} Access`
          );
        } else {
          setOutreachAccessLabel(`${formatRoleText(currentMember.role)} Access`);
        }
      } catch (error) {
        console.error("Failed to load outreach role context:", error);

        if (!mounted) return;

        setHasOutreachAccess(false);
        setHasOutreachDirector(false);
        setOutreachAccessLabel("Access unavailable");
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadRoleContext();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadWorkspace() {
    try {
      setLoading(true);
      setMessage("");

      const loadedLists = await getOutreachLists();
      setLists(loadedLists);

      const matchedPreferredList =
        preferredListId && loadedLists.find((list) => list.id === preferredListId);

      const listsToLoad =
        matchedPreferredList ? [matchedPreferredList] : loadedLists;

      let allContacts: Contact[] = [];
      let allLogs: OutreachLog[] = [];

      for (const list of listsToLoad) {
        const listContacts = await getListContacts(list.id);
        const listLogs = await getOutreachLogs(list.id);
        allContacts = [...allContacts, ...listContacts];
        allLogs = [...allLogs, ...listLogs];
      }

      const uniqueContacts = Array.from(
        new Map(allContacts.map((contact) => [contact.id, contact])).values()
      );

      const uniqueLogs = Array.from(
        new Map(allLogs.map((log) => [log.id, log])).values()
      );

      setContacts(uniqueContacts);
      setLogs(uniqueLogs);

      if (matchedPreferredList) {
        setSelectedListId(matchedPreferredList.id);
        setActiveList({
          id: matchedPreferredList.id,
          name: matchedPreferredList.name,
          tag: resolveListTag(matchedPreferredList),
          size: (matchedPreferredList as any).size || uniqueContacts.length,
        });
      }

      if (
        preselectedContactId &&
        uniqueContacts.some((contact) => contact.id === preselectedContactId)
      ) {
        setSelectedContactId(preselectedContactId);
      } else {
        setSelectedContactId(uniqueContacts[0]?.id || "");
      }
    } catch (err: any) {
      setMessage(
        `Error loading outreach focus workspace: ${err?.message || "Unknown error"}`
      );
      setLists([]);
      setContacts([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const visibleLists = useMemo(() => {
    if (!selectedListId) return lists;
    return lists.filter((list) => list.id === selectedListId);
  }, [lists, selectedListId]);

  const selectedList = useMemo(() => {
    return lists.find((list) => list.id === selectedListId) || null;
  }, [lists, selectedListId]);

  const ownerScopedContacts = useMemo(() => {
    if (!ownerFilter.trim()) return contacts;

    const normalizedFilter = ownerFilter.trim().toLowerCase();

    return contacts.filter(
      (contact) =>
        normalizeOwner(contact.owner_name).toLowerCase() === normalizedFilter
    );
  }, [contacts, ownerFilter]);

  const ownerScopedLogs = useMemo(() => {
    if (!ownerFilter.trim()) return logs;

    const normalizedFilter = ownerFilter.trim().toLowerCase();

    return logs.filter((log) => {
      const contactOwner = normalizeOwner(log.contacts?.owner_name).toLowerCase();
      const listOwner = normalizeOwner(log.lists?.default_owner_name).toLowerCase();
      return contactOwner === normalizedFilter || listOwner === normalizedFilter;
    });
  }, [logs, ownerFilter]);

  const intelligenceByContact = useMemo<Map<string, ContactIntelligence>>(() => {
    return buildContactIntelligence(ownerScopedContacts, ownerScopedLogs);
  }, [ownerScopedContacts, ownerScopedLogs]);


  const outreachBundle = useMemo(() => {
    const staleContacts = ownerScopedContacts.filter((contact: any) =>
      Boolean(contact.is_stale)
    ).length;

    const pendingFollowUps = ownerScopedLogs.filter((log) => {
      const value = String(log.result || "").toLowerCase();
      return value.includes("follow") || value.includes("callback");
    }).length;

    const positiveContacts = ownerScopedLogs.filter((log) => {
      const value = String(log.result || "").toLowerCase();
      return (
        value.includes("positive") ||
        value.includes("support") ||
        value.includes("interested") ||
        value.includes("pledge")
      );
    }).length;

    const uncontactedContacts = Math.max(
      0,
      ownerScopedContacts.length - ownerScopedLogs.length
    );

    return getOutreachSignals({
      staleContacts,
      pendingFollowUps,
      positiveContacts,
      uncontactedContacts,
    });
  }, [ownerScopedContacts, ownerScopedLogs]);

  const financeBundle = useMemo(() => {
    const missingComplianceRecords = ownerScopedContacts.filter((contact: any) => {
      const donationTotal = Number(contact.donation_total ?? 0);
      return donationTotal > 0 && (!contact.employer || !contact.occupation);
    }).length;

    const overduePledges = ownerScopedContacts.filter((contact: any) => {
      const pledgeAmount = Number(contact.pledge_amount ?? 0);
      const donationTotal = Number(contact.donation_total ?? 0);
      return pledgeAmount > donationTotal;
    }).length;

    const highValueDonorsPending = ownerScopedContacts.filter((contact: any) => {
      return (
        Number(contact.donation_total ?? 0) >= 250 ||
        Number(contact.pledge_amount ?? 0) >= 250
      );
    }).length;

    return getFinanceSignals({
      missingComplianceRecords,
      overduePledges,
      highValueDonorsPending,
      cashOnHandPressure: highValueDonorsPending > 3 ? 7 : 4,
    });
  }, [ownerScopedContacts]);


  const outreachContextItems = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      summary: string;
      tone: "rose" | "emerald" | "sky";
    }> = [];

    const pendingFollowUps =
      (outreachBundle.risks.find(
        (item) => item.id === "outreach-pending-followups"
      )?.metadata?.pendingFollowUps as number) || 0;

    const positiveContacts =
      (outreachBundle.opportunities.find(
        (item) => item.id === "outreach-positive-contacts"
      )?.metadata?.positiveContacts as number) || 0;

    const staleContacts =
      (outreachBundle.risks.find(
        (item) => item.id === "outreach-stale-contacts"
      )?.metadata?.staleContacts as number) || 0;

    const overduePledges =
      (financeBundle.risks.find(
        (item) => item.id === "finance-overdue-pledges"
      )?.metadata?.overduePledges as number) || 0;

    const highValueDonorsPending =
      (financeBundle.opportunities.find(
        (item) => item.id === "finance-high-value-donors"
      )?.metadata?.highValueDonorsPending as number) || 0;

    if (pendingFollowUps > 0) {
      items.push({
        id: "follow-up-pressure",
        label: "Follow-up pressure",
        summary: `${pendingFollowUps} active follow-up ${pendingFollowUps === 1 ? "thread is" : "threads are"} sitting in outreach right now.`,
        tone: "rose",
      });
    }

    if (positiveContacts > 0) {
      items.push({
        id: "conversion-opportunity",
        label: "Conversion opportunity",
        summary: `${positiveContacts} recent positive ${positiveContacts === 1 ? "contact is" : "contacts are"} ready for tighter follow-through.`,
        tone: "emerald",
      });
    }

    if (overduePledges > 0 || highValueDonorsPending > 0) {
      const donorPressure = Math.max(overduePledges, highValueDonorsPending);
      items.push({
        id: "finance-linked-demand",
        label: "Finance-linked demand",
        summary: `${donorPressure} donor ${donorPressure === 1 ? "record is" : "records are"} creating outreach-adjacent follow-up demand.`,
        tone: "sky",
      });
    }

    if (staleContacts > 0 && items.length < 3) {
      items.push({
        id: "re-engagement-window",
        label: "Re-engagement window",
        summary: `${staleContacts} stale ${staleContacts === 1 ? "contact remains" : "contacts remain"} available for reactivation without disrupting live flow.`,
        tone: "sky",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "steady-cadence",
        label: "Stable cadence",
        summary: "Outreach is currently in a steady state with room to continue contact and follow-up work cleanly.",
        tone: "emerald",
      });
    }

    return items.slice(0, 3);
  }, [financeBundle, outreachBundle]);



  const prioritizedFocusContacts = useMemo(() => {
    return getSortedWorkflowContacts(ownerScopedContacts, ownerScopedLogs).slice(
      0,
      8
    );
  }, [ownerScopedContacts, ownerScopedLogs]);



  const contactLaneItems = useMemo<FocusLaneItem[]>(() => {
    return prioritizedFocusContacts.map((contact, index) => ({
      id: `contact-${contact.id}`,
      title: fullName(contact),
      summary:
  intelligenceByContact.get(contact.id)?.nextAction ||
  "Engage contact",
      priority: index < 2 ? "high" : index < 5 ? "medium" : "low",
      type: "contact",
      contactId: contact.id,
    }));
  }, [prioritizedFocusContacts, intelligenceByContact]);

  const followUpLaneItems = useMemo<FocusLaneItem[]>(() => {
    return prioritizedFocusContacts
      .filter((contact) => {
        const intel = intelligenceByContact.get(contact.id);
        return intel?.nextAction?.toLowerCase().includes("follow");
      })
      .slice(0, 5)
      .map((contact, index) => ({
        id: `follow-${contact.id}`,
        title: `Follow up: ${fullName(contact)}`,
        summary:
          intelligenceByContact.get(contact.id)?.nextAction ||
          "Follow-up required",
        priority: index < 2 ? "high" : "medium",
        type: "follow_up",
        contactId: contact.id,
      }));
  }, [prioritizedFocusContacts, intelligenceByContact]);

  const listLaneItems = useMemo<FocusLaneItem[]>(() => {
    return visibleLists.slice(0, 6).map((list, index) => ({
      id: `list-${list.id}`,
      title: list.name,
      summary:
        selectedListId && list.id === selectedListId
          ? "Active focus list"
          : "Active outreach segment",
      priority: index < 2 ? "high" : "medium",
      type: "list",
      listId: list.id,
      tag: resolveListTag(list),
      size: (list as any).size || 0,
    }));
  }, [visibleLists, selectedListId]);

  const orgTheme = getOrgContextTheme(contextMode);

  const visibleContactLaneItems = useMemo(
    () => contactLaneItems.slice(0, 3),
    [contactLaneItems]
  );

  const visibleFollowUpLaneItems = useMemo(
    () => followUpLaneItems.slice(0, 3),
    [followUpLaneItems]
  );

  const visibleListLaneItems = useMemo(
    () => listLaneItems.slice(0, 3),
    [listLaneItems]
  );

  function clearPanels() {
    setActiveContact(null);
    setActiveFollowUp(null);
    setActiveList(null);
  }

  function activateContact(contact: Contact) {
    setActiveFollowUp(null);
    setActiveList(null);
    setActiveContact({
      id: contact.id,
      name: fullName(contact),
      phone: contact.phone || "",
    });
  }

  function activateFollowUp(contact: Contact, note: string) {
    setActiveContact(null);
    setActiveList(null);
    setActiveFollowUp({
      id: contact.id,
      name: fullName(contact),
      note,
    });
  }

  function activateList(listId: string, name: string, tag: ListTag, size: number) {
    setActiveContact(null);
    setActiveFollowUp(null);
    setActiveList({
      id: listId,
      name,
      tag,
      size,
    });
  }

  function getNextContactFromQueue(currentContactId?: string | null) {
    const nextContact = prioritizedFocusContacts.find(
      (contact) => contact.id !== currentContactId
    );

    return nextContact || null;
  }

  async function logFocusedOutreach(
    outcome: OutreachOutcome,
    contact: Contact,
    channelOverride?: "call" | "text"
  ) {
    try {
      setSaving(true);
      setMessage("");

      const resolvedChannel = channelOverride || channel;

      await saveOutreachLog({
        contactId: contact.id,
        listId: selectedListId || null,
        channel: resolvedChannel,
        result: outcome,
        notes,
      });

      await createAutoTaskForOutcome({
        contactId: contact.id,
        listId: selectedListId || null,
        channel: resolvedChannel,
        result: outcome,
        contactName: fullName(contact),
        listName:
          lists.find((list) => list.id === selectedListId)?.name ||
          "Outreach Focus",
        ownerName: contact.owner_name || "Outreach Team",
      });

      setNotes("");

      const nextContact = getNextContactFromQueue(contact.id);

      if (nextContact) {
        activateContact(nextContact);
        setMessage(
          `${fullName(contact)} logged as ${outcome
            .replaceAll("_", " ")
            .toLowerCase()}. Next contact is ready.`
        );
      } else {
        clearPanels();
        setMessage(
          `${fullName(contact)} logged as ${outcome
            .replaceAll("_", " ")
            .toLowerCase()}. Queue cleared for now.`
        );
      }
    } catch (err: any) {
      setMessage(
        `Error loading outreach focus workspace: ${err?.message || "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || roleLoading) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading outreach focus workspace...</p>
        </section>
      </div>
    );
  }

  if (!hasOutreachAccess) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto max-w-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              No Outreach Access Available
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Outreach is the shared contact, list, and call execution hub. You
              need an active organization role before this workspace can route
              work to you.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Zap className="h-3.5 w-3.5" />
              Outreach Focus Mode
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Stay in outreach flow.
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Contacts first. Follow-ups stay active. Lists stay within reach.
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedList ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                    <ListChecks className="h-4 w-4" />
                    Focusing list: {selectedList.name}
                  </div>
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-slate-100">
                  <Users className="h-4 w-4" />
                  {outreachAccessLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/outreach"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to Outreach
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              <ListChecks className="h-4 w-4" />
              Lists
            </Link>

            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              <ContactRound className="h-4 w-4" />
              Contacts
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Outreach Context
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Outreach Context
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Contact flow is steady. Follow-up demand is manageable.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {hasOutreachDirector
                ? "Director-level outreach context is available for this operator."
                : "Shared outreach execution is scoped through this operator’s assigned roles."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {outreachContextItems.map((item) => {
            const tone =
              item.tone === "rose"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : item.tone === "sky"
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 ${tone}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6">{item.summary}</p>
              </div>
            );
          })}
        </div>
      </section>



      {message ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr_0.9fr]">
        {/* CONTACT LANE */}
        <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Contact Lane
              </h2>
              <p className="text-xs text-slate-500">
                Active contact work
              </p>
            </div>
            <Users className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleContactLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active contacts right now.
              </div>
            )}

            {visibleContactLaneItems.map((item) => {
              const contact = ownerScopedContacts.find(
                (c) => c.id === item.contactId
              );

              const isActive = activeContact?.id === item.contactId;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-100 shadow-md"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => contact && activateContact(contact)}
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Call
                    </button>

                    <Link
                      href={`/dashboard/contacts/${item.contactId}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOLLOW-UP LANE */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Follow-Up Lane
              </h2>
              <p className="text-xs text-slate-500">
                Ongoing conversations
              </p>
            </div>
            <User className="h-4 w-4 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleFollowUpLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active follow-ups right now.
              </div>
            )}

            {visibleFollowUpLaneItems.map((item) => {
              const contact = ownerScopedContacts.find(
                (c) => c.id === item.contactId
              );

              const isActive = activeFollowUp?.id === item.contactId;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-100 shadow-md"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        contact && activateFollowUp(contact, item.summary)
                      }
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Continue
                    </button>

                    <Link
                      href={`/dashboard/contacts/${item.contactId}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LIST LANE */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                List Lane
              </h2>
              <p className="text-xs text-slate-500">
                Source lists
              </p>
            </div>
            <List className="h-4 w-4 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleListLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active list routing right now.
              </div>
            )}

            {visibleListLaneItems.map((item) => {
              const isActive = activeList?.id === item.listId;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-100 shadow-md"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>

                    {item.tag ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagTone(
                          item.tag
                        )}`}
                      >
                        {item.tag}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        item.listId &&
                        activateList(
                          item.listId,
                          item.title,
                          item.tag || "outreach",
                          item.size || 0
                        )
                      }
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Activate
                    </button>

                    <Link
                      href="/dashboard/lists"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Lists
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACTIVE PANEL */}
      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg">
        <div className="mb-4 flex flex-col gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Active Panel
            </h2>
            <p className="text-xs text-slate-500">
              Execute the selected item
            </p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            Work happens here. Select a contact, follow-up, or list to begin.
          </p>
        </div>

        {!activeContact && !activeFollowUp && !activeList ? (
          <p className="text-sm text-slate-500">
            
          </p>
        ) : null}

        {activeContact ? (
          <div className="space-y-4">
            <p className="font-semibold text-slate-900">
              Working contact: {activeContact.name}
            </p>
            <p className="text-sm text-slate-500">
              {activeContact.phone}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setChannel("call")}
                className={`rounded-xl px-3 py-2 text-sm ${
                  channel === "call"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200"
                }`}
              >
                Call
              </button>

              <button
                onClick={() => setChannel("text")}
                className={`rounded-xl px-3 py-2 text-sm ${
                  channel === "text"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200"
                }`}
              >
                Text
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />

            <button
              onClick={() =>
                logFocusedOutreach("connected_positive", {
                  id: activeContact.id,
                  first_name: activeContact.name,
                } as any)
              }
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm text-white"
            >
              Log Positive & Continue
            </button>
          </div>
        ) : null}
                {activeFollowUp ? (
          <div className="space-y-4">
            <p className="font-semibold text-slate-900">
              Follow-up in progress: {activeFollowUp.name}
            </p>
            <p className="text-sm text-slate-500">
              {activeFollowUp.note}
            </p>

            <button
              onClick={() =>
                logFocusedOutreach("follow_up_needed", {
                  id: activeFollowUp.id,
                  first_name: activeFollowUp.name,
                } as any)
              }
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm text-white"
            >
              Log Follow-Up & Continue
            </button>
          </div>
        ) : null}

        {activeList ? (
          <div className="space-y-4">
            <p className="font-semibold text-slate-900">
              Active list: {activeList.name}
            </p>

            <p className="text-sm text-slate-500">
              {activeList.size} contacts in this list
            </p>

            <Link
              href={`/dashboard/outreach?listId=${activeList.id}`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm text-white"
            >
              Open List in Outreach
            </Link>
          </div>
        ) : null}
      </section>

    </div>
  );
}

export default function OutreachFocusPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading focus...</div>}>
      <OutreachFocusContent />
    </Suspense>
  );
}