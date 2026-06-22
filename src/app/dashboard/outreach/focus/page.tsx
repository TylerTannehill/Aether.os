"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ContactRound,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  Users,
  X,
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
  getFinanceSignals,
  getOutreachSignals,
} from "@/lib/intelligence/signals";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type ListTag = "outreach" | "field" | "finance" | "print";

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
  email?: string | null;
  city?: string | null;
  state?: string | null;
  priority: "high" | "medium" | "low";
  summary: string;
};

type ActiveFollowUp = {
  id: string;
  name: string;
  note: string;
  priority: "high" | "medium" | "low";
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

type OutreachAction = "call" | "text" | "email" | "note" | "meeting";

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
  const explicitType = String((list as any).type || "").toLowerCase();

  if (
    explicitType === "outreach" ||
    explicitType === "field" ||
    explicitType === "finance" ||
    explicitType === "print"
  ) {
    return explicitType as ListTag;
  }

  const name = (list.name || "").toLowerCase();
  const owner = (list.default_owner_name || "").toLowerCase();
  const combined = `${name} ${owner}`;

  if (
    combined.includes("print") ||
    combined.includes("mailer") ||
    combined.includes("mail") ||
    combined.includes("yard sign") ||
    combined.includes("palm card") ||
    combined.includes("literature")
  ) {
    return "print";
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

function isOutreachWorkList(list: CampaignList) {
  return resolveListTag(list) === "outreach";
}

function tagTone(tag: ListTag) {
  switch (tag) {
    case "field":
      return "bg-sky-100 text-sky-700";
    case "finance":
      return "bg-emerald-100 text-emerald-700";
    case "print":
      return "bg-purple-100 text-purple-700";
    case "outreach":
    default:
      return "bg-violet-100 text-violet-700";
  }
}

function priorityTone(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "medium":
      return "border border-amber-200 bg-amber-50 text-amber-800";
    case "low":
    default:
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function priorityLabel(priority: "high" | "medium" | "low") {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function outcomeLabel(outcome: OutreachOutcome) {
  return outcome.replaceAll("_", " ").toLowerCase();
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "OC";
}

function actionToChannel(action: OutreachAction): "call" | "text" {
  return action === "text" ? "text" : "call";
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
  const [activeAction, setActiveAction] = useState<OutreachAction>(
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
            setContextMode(contextData?.organization?.context_mode || "default");
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
      const matchedPreferredList =
        preferredListId && loadedLists.find((list) => list.id === preferredListId);

      const outreachLists = loadedLists.filter(isOutreachWorkList);
      const workspaceLists = matchedPreferredList
        ? [matchedPreferredList]
        : outreachLists;

      setLists(
        matchedPreferredList
          ? [
              matchedPreferredList,
              ...outreachLists.filter((list) => list.id !== matchedPreferredList.id),
            ]
          : outreachLists
      );

      const listPayloads = await Promise.all(
        workspaceLists.map(async (list) => {
          const [listContacts, listLogs] = await Promise.all([
            getListContacts(list.id),
            getOutreachLogs(list.id),
          ]);

          return {
            list,
            contacts: listContacts,
            logs: listLogs,
          };
        })
      );

      const allContacts = listPayloads.flatMap((payload) => payload.contacts);
      const allLogs = listPayloads.flatMap((payload) => payload.logs);

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
          size: uniqueContacts.length,
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

    return {
      pendingFollowUps,
      positiveContacts,
      staleContacts,
      financeLinkedDemand: Math.max(overduePledges, highValueDonorsPending),
    };
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
        intelligenceByContact.get(contact.id)?.nextAction || "Engage contact",
      priority: index < 2 ? "high" : index < 5 ? "medium" : "low",
      type: "contact",
      contactId: contact.id,
    }));
  }, [prioritizedFocusContacts, intelligenceByContact]);

  const followUpLaneItems = useMemo<FocusLaneItem[]>(() => {
    const followUpLogs = ownerScopedLogs
      .filter((log) => {
        const value = String(log.result || "").toLowerCase();
        return (
          value.includes("follow") ||
          value.includes("callback") ||
          value.includes("wrong_time") ||
          value.includes("wrong time")
        );
      })
      .slice(0, 8);

    const fromLogs = followUpLogs
      .map((log, index): FocusLaneItem | null => {
        const contact =
          ownerScopedContacts.find((item) => item.id === log.contact_id) ||
          log.contacts ||
          null;

        if (!contact?.id) return null;

        return {
          id: `follow-log-${log.id}`,
          title: `Follow up: ${fullName(contact)}`,
          summary:
            log.notes ||
            `Previous ${log.channel || "outreach"} result: ${String(
              log.result || "follow-up"
            ).replaceAll("_", " ")}`,
          priority: index < 2 ? "high" : "medium",
          type: "follow_up",
          contactId: contact.id,
        };
      })
      .filter((item): item is FocusLaneItem => Boolean(item));

    const fromIntel = prioritizedFocusContacts
      .filter((contact) => {
        const intel = intelligenceByContact.get(contact.id);
        return intel?.nextAction?.toLowerCase().includes("follow");
      })
      .map((contact, index): FocusLaneItem => ({
        id: `follow-intel-${contact.id}`,
        title: `Follow up: ${fullName(contact)}`,
        summary:
          intelligenceByContact.get(contact.id)?.nextAction ||
          "Follow-up required",
        priority: index < 2 ? "high" : "medium",
        type: "follow_up",
        contactId: contact.id,
      }));

    const merged = new Map<string, FocusLaneItem>();

    [...fromLogs, ...fromIntel].forEach((item) => {
      if (!item.contactId) return;
      if (!merged.has(item.contactId)) {
        merged.set(item.contactId, item);
      }
    });

    return Array.from(merged.values()).slice(0, 5);
  }, [
    ownerScopedContacts,
    ownerScopedLogs,
    prioritizedFocusContacts,
    intelligenceByContact,
  ]);

  const listLaneItems = useMemo<FocusLaneItem[]>(() => {
    return visibleLists.slice(0, 6).map((list, index) => ({
      id: `list-${list.id}`,
      title: list.name,
      summary:
        selectedListId && list.id === selectedListId
          ? "Active outreach focus list"
          : "Relationship outreach segment",
      priority: index < 2 ? "high" : "medium",
      type: "list",
      listId: list.id,
      tag: resolveListTag(list),
      size: (list as any).size || 0,
    }));
  }, [visibleLists, selectedListId]);

  const orgTheme = getOrgContextTheme(contextMode);

  const visibleContactLaneItems = useMemo(
    () => contactLaneItems.slice(0, 5),
    [contactLaneItems]
  );

  const visibleFollowUpLaneItems = useMemo(
    () => followUpLaneItems.slice(0, 6),
    [followUpLaneItems]
  );

  const visibleListLaneItems = useMemo(
    () => listLaneItems.slice(0, 5),
    [listLaneItems]
  );

  function clearPanels() {
    setActiveContact(null);
    setActiveFollowUp(null);
    setActiveList(null);
  }

  function activateContact(contact: Contact, item?: FocusLaneItem) {
    setActiveFollowUp(null);
    setActiveList(null);
    setSelectedContactId(contact.id);

    const nextAction =
      item?.summary ||
      intelligenceByContact.get(contact.id)?.nextAction ||
      "Engage contact";

    setActiveContact({
      id: contact.id,
      name: fullName(contact),
      phone: contact.phone || "",
      email: contact.email,
      city: contact.city,
      state: contact.state,
      priority: item?.priority || "medium",
      summary: nextAction,
    });
  }

  function activateFollowUp(contact: Contact, item: FocusLaneItem) {
    setActiveContact(null);
    setActiveList(null);
    setSelectedContactId(contact.id);

    setActiveFollowUp({
      id: contact.id,
      name: fullName(contact),
      note: item.summary,
      priority: item.priority,
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
        ownerName: contact.owner_name || fullName(contact),
      });

      setNotes("");

      const nextContact = getNextContactFromQueue(contact.id);

      if (nextContact) {
        activateContact(nextContact);
        setMessage(
          `${fullName(contact)} logged as ${outcomeLabel(
            outcome
          )}. Next contact is ready.`
        );
      } else {
        clearPanels();
        setMessage(
          `${fullName(contact)} logged as ${outcomeLabel(
            outcome
          )}. Queue cleared for now.`
        );
      }
    } catch (err: any) {
      setMessage(
        `Error logging outreach: ${err?.message || "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function logActiveContactOutcome(outcome: OutreachOutcome) {
    const source = activeContact || activeFollowUp;

    if (!source) return;

    const contact =
      ownerScopedContacts.find((item) => item.id === source.id) ||
      ({
        id: source.id,
        first_name: source.name,
      } as Contact);

    await logFocusedOutreach(outcome, contact, actionToChannel(activeAction));
  }

  const totalOutreachContacts = ownerScopedContacts.length;
  const followUpsDue = visibleFollowUpLaneItems.length;
  const activeOutreachListCount = lists.length;
  const contactsToWork = visibleContactLaneItems.length;

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
              Outreach is the shared contact, list, and relationship execution
              hub. You need an active organization role before this workspace can
              route work to you.
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

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Outreach Focus
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Stay in outreach flow. Work contacts, complete follow-ups, and
                keep relationship lists moving.
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

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Today&apos;s Outreach Snapshot
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {contactsToWork}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  Contacts to work
                </p>
                <p className="text-xs text-slate-500">Prioritized queue</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {followUpsDue}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  Follow-ups due
                </p>
                <p className="text-xs text-slate-500">Callbacks and replies</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {activeOutreachListCount}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  Outreach lists
                </p>
                <p className="text-xs text-slate-500">Only outreach tagged</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {totalOutreachContacts}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  Total contacts
                </p>
                <p className="text-xs text-slate-500">Across outreach lists</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
          Only outreach-tagged lists and contacts are shown here. Use Lists to
          manage Field, Finance, and Print routing.
        </div>
      </section>

      {message ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Contact Lane
              </h2>
              <p className="text-xs text-slate-500">
                Prioritized outreach contacts
              </p>
            </div>
            <Users className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleContactLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No outreach contacts are available from outreach-tagged lists.
              </div>
            )}

            {visibleContactLaneItems.map((item) => {
              const contact = ownerScopedContacts.find(
                (candidate) => candidate.id === item.contactId
              );

              const isActive = activeContact?.id === item.contactId;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-50 shadow-md"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {contact?.phone || contact?.email || "No contact method"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {priorityLabel(item.priority)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">{item.summary}</p>

                  <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <button
                      onClick={() => contact && activateContact(contact, item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Call
                    </button>

                    <button
                      onClick={() => {
                        if (!contact) return;
                        activateContact(contact, item);
                        setActiveAction("text");
                        setChannel("text");
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Text
                    </button>

                    <Link
                      href={`/contacts/${item.contactId}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <UserRound className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard/outreach"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View outreach dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Follow-Up Lane
              </h2>
              <p className="text-xs text-slate-500">
                Callbacks and unresolved conversations
              </p>
            </div>
            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleFollowUpLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active follow-ups right now.
              </div>
            )}

            {visibleFollowUpLaneItems.map((item) => {
              const contact = ownerScopedContacts.find(
                (candidate) => candidate.id === item.contactId
              );

              const isActive = activeFollowUp?.id === item.contactId;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-50 shadow-md"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {contact?.phone || contact?.email || "No contact method"}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        contact && activateFollowUp(contact, item)
                      }
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Continue
                    </button>

                    <Link
                      href={`/contacts/${item.contactId}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard/outreach"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View all follow-ups
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                List Lane
              </h2>
              <p className="text-xs text-slate-500">Active outreach lists</p>
            </div>
            <ListChecks className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleListLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No outreach-tagged lists are available right now.
              </div>
            )}

            {visibleListLaneItems.map((item) => {
              const isActive = activeList?.id === item.listId;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-50 shadow-md"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.summary}
                      </p>
                    </div>

                    {item.tag ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tagTone(
                          item.tag
                        )}`}
                      >
                        {item.tag}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {item.size || 0} known contacts
                  </p>

                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
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
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Review List
                    </button>

                    <Link
                      href="/dashboard/lists"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Lists
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard/lists"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View all outreach lists
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Active Work Panel
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Work a contact, log the outcome, and move forward.
            </p>
          </div>

          {(activeContact || activeFollowUp || activeList) ? (
            <button
              onClick={clearPanels}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close Active Panel
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {!activeContact && !activeFollowUp && !activeList ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Select a contact, follow-up, or list to begin.
          </div>
        ) : null}

        {(activeContact || activeFollowUp) ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-semibold text-violet-700">
                    {initials(activeContact?.name || activeFollowUp?.name || "OC")}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-900">
                        {activeContact?.name || activeFollowUp?.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityTone(
                          activeContact?.priority || activeFollowUp?.priority || "medium"
                        )}`}
                      >
                        {priorityLabel(
                          activeContact?.priority || activeFollowUp?.priority || "medium"
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeContact?.phone ||
                        activeContact?.email ||
                        activeFollowUp?.note ||
                        "Relationship outreach item"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/contacts/${activeContact?.id || activeFollowUp?.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    View Profile
                  </Link>

                  <Link
                    href="/dashboard/outreach"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    View Activity
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.75fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {([
                    ["call", Phone, "Call"],
                    ["text", MessageSquare, "Text"],
                    ["email", Mail, "Email"],
                    ["note", ListChecks, "Note"],
                    ["meeting", CalendarDays, "Meeting"],
                  ] as const).map(([value, Icon, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setActiveAction(value);
                        setChannel(actionToChannel(value));
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        activeAction === value
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Log {activeAction === "text" ? "Text" : activeAction === "email" ? "Email" : activeAction === "meeting" ? "Meeting" : activeAction === "note" ? "Note" : "Call"} Outcome
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    How did this outreach action go?
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <button
                      onClick={() => logActiveContactOutcome("connected_positive")}
                      disabled={saving}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                    >
                      <CheckCircle2 className="mb-2 h-4 w-4" />
                      Positive
                      <span className="mt-1 block font-normal text-emerald-700">
                        Supporter / interested
                      </span>
                    </button>

                    <button
                      onClick={() => logActiveContactOutcome("follow_up_needed")}
                      disabled={saving}
                      className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-left text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50"
                    >
                      <CalendarDays className="mb-2 h-4 w-4" />
                      Follow-Up
                      <span className="mt-1 block font-normal text-sky-700">
                        Needs another touch
                      </span>
                    </button>

                    <button
                      onClick={() => logActiveContactOutcome("wrong_time")}
                      disabled={saving}
                      className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      <Clock3 className="mb-2 h-4 w-4" />
                      Wrong Time
                      <span className="mt-1 block font-normal text-amber-700">
                        Try later
                      </span>
                    </button>

                    <button
                      onClick={() => logActiveContactOutcome("no_answer")}
                      disabled={saving}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Phone className="mb-2 h-4 w-4" />
                      No Answer
                      <span className="mt-1 block font-normal text-slate-500">
                        No response
                      </span>
                    </button>

                    <button
                      onClick={() => logActiveContactOutcome("completed")}
                      disabled={saving}
                      className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-left text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"
                    >
                      <CheckCircle2 className="mb-2 h-4 w-4" />
                      Completed
                      <span className="mt-1 block font-normal text-violet-700">
                        Done for now
                      </span>
                    </button>
                  </div>

                  <label className="mt-4 block text-sm font-medium text-slate-900">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add notes about this interaction..."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>

                <button
                  onClick={() => logActiveContactOutcome("completed")}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Outcome & Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Context</p>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">List</span>
                    <span className="font-medium text-slate-900">
                      {selectedList?.name || "Outreach Focus"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Owner</span>
                    <span className="font-medium text-slate-900">
                      {ownerFilter || "Team"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Follow-up pressure</span>
                    <span className="font-medium text-slate-900">
                      {outreachContextItems.pendingFollowUps}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Positive contacts</span>
                    <span className="font-medium text-slate-900">
                      {outreachContextItems.positiveContacts}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Stale contacts</span>
                    <span className="font-medium text-slate-900">
                      {outreachContextItems.staleContacts}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Finance-linked</span>
                    <span className="font-medium text-slate-900">
                      {outreachContextItems.financeLinkedDemand}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeList ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Reviewing list: {activeList.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeList.size > 0
                      ? `${activeList.size} contact${activeList.size === 1 ? "" : "s"} loaded for this outreach list.`
                      : "Open this list in Outreach to load and review its contacts."}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${tagTone(
                    activeList.tag
                  )}`}
                >
                  {activeList.tag}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/outreach?listId=${activeList.id}`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open List in Outreach
              </Link>

              <Link
                href="/dashboard/lists"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Manage Lists
              </Link>
            </div>
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
