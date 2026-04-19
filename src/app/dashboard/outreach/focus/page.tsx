"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ContactRound,
  List,
  ListChecks,
  Phone,
  Sparkles,
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
import { getTopTriggerActions } from "@/lib/intelligence/action-triggers";
import { buildDraftTasksFromTriggers } from "@/lib/intelligence/task-drafts";

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

type NextActionPlan = {
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  category: "conversion" | "retry" | "task" | "review";
  autoReady: boolean;
};

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

function nextActionTone(category: NextActionPlan["category"]) {
  switch (category) {
    case "conversion":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "retry":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "task":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "review":
    default:
      return "border-purple-200 bg-purple-50 text-purple-800";
  }
}

function buildOutreachNextAction(
  outcome: OutreachOutcome,
  contactName: string
): NextActionPlan {
  if (outcome === "connected_positive") {
    return {
      title: "Push to conversion",
      summary: `${contactName} engaged positively. Keep momentum high and route this contact into the strongest next-touch path now.`,
      priority: "high",
      category: "conversion",
      autoReady: true,
    };
  }

  if (outcome === "follow_up_needed") {
    return {
      title: "Schedule follow-up",
      summary: `${contactName} needs another touch. Preserve context and move this contact into the active follow-up lane.`,
      priority: "high",
      category: "task",
      autoReady: true,
    };
  }

  if (outcome === "wrong_time") {
    return {
      title: "Retry at better time",
      summary: `${contactName} was reached at a poor time. Requeue with timing context instead of dropping the thread.`,
      priority: "medium",
      category: "retry",
      autoReady: true,
    };
  }

  if (outcome === "no_answer") {
    return {
      title: "Requeue contact",
      summary: `${contactName} did not answer. Keep this contact active in the retry pool without losing attention.`,
      priority: "medium",
      category: "retry",
      autoReady: true,
    };
  }

  if (outcome === "connected_neutral") {
    return {
      title: "Review persuasion path",
      summary: `${contactName} connected but did not convert. Review whether the next move should be persuasion, education, or another touch.`,
      priority: "medium",
      category: "review",
      autoReady: false,
    };
  }

  return {
    title: "Close and review",
    summary: `${contactName} has a completed touch. Review whether this contact remains active, shifts lanes, or can be deprioritized.`,
    priority: "low",
    category: "review",
    autoReady: false,
  };
}

export default function OutreachFocusPage() {
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

  const [completedCount, setCompletedCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [message, setMessage] = useState("");
  const [nextAction, setNextAction] = useState<NextActionPlan | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadWorkspace();
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

  const highValueContacts = useMemo(() => {
    return ownerScopedContacts.map((contact) => ({
      id: String(contact.id),
      full_name: fullName(contact),
      donation_total: Number((contact as any).donation_total ?? 0),
      pledge_amount: Number((contact as any).pledge_amount ?? 0),
      last_contacted_at:
        (contact as any).last_contacted_at ??
        (contact as any).last_outreach_at ??
        null,
    }));
  }, [ownerScopedContacts]);

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
    const financeTriggerSnapshot = useMemo(() => {
    return aggregateAetherIntelligence([outreachBundle, financeBundle], {
      finance: {
        overduePledges:
          (financeBundle.risks.find(
            (item) => item.id === "finance-overdue-pledges"
          )?.metadata?.overduePledges as number) || 0,
        highValueDonorsPending:
          (financeBundle.opportunities.find(
            (item) => item.id === "finance-high-value-donors"
          )?.metadata?.highValueDonorsPending as number) || 0,
      },
      outreach: {
        pendingFollowUps:
          (outreachBundle.risks.find(
            (item) => item.id === "outreach-pending-followups"
          )?.metadata?.pendingFollowUps as number) || 0,
        positiveContacts:
          (outreachBundle.opportunities.find(
            (item) => item.id === "outreach-positive-contacts"
          )?.metadata?.positiveContacts as number) || 0,
      },
      field: {
        strongIdRateZones: 0,
        incompleteTurfs: 0,
      },
      digital: {
        strongPerformingPlatforms: 0,
        negativeSentimentThreads: 0,
      },
      print: {
        readyAssets: 0,
        deliveryRisks: 0,
      },
    });
  }, [outreachBundle, financeBundle]);

  const triggerActions = useMemo(() => {
    return getTopTriggerActions(financeTriggerSnapshot, {
      highValueContacts,
      lastContacted: ownerScopedContacts.reduce<Record<string, string | null>>(
        (acc, contact: any) => {
          acc[String(contact.id)] =
            contact.last_contacted_at ??
            contact.last_outreach_at ??
            null;
          return acc;
        },
        {}
      ),
    });
  }, [financeTriggerSnapshot, highValueContacts, ownerScopedContacts]);

  const draftedTasks = useMemo(() => {
    return buildDraftTasksFromTriggers(triggerActions);
  }, [triggerActions]);

  const prioritizedFocusContacts = useMemo(() => {
    return getSortedWorkflowContacts(ownerScopedContacts, ownerScopedLogs).slice(
      0,
      8
    );
  }, [ownerScopedContacts, ownerScopedLogs]);

  const financeTriggeredContactIds = useMemo(() => {
    const ids = new Set<string>();

    triggerActions.forEach((action) => {
      const targetId = action.targetContactId;
      if (targetId) {
        ids.add(String(targetId));
      }
    });

    return ids;
  }, [triggerActions]);

  const suggestedNext = useMemo(() => {
    if (triggerActions.length > 0) {
      const top = triggerActions[0];
      return {
        title: top.title,
        summary: top.description,
        priority: top.priority,
        category: top.category,
        autoReady: top.autoReady,
      } as NextActionPlan;
    }

    if (draftedTasks.length > 0) {
      const task = draftedTasks[0];
      return {
        title: task.title,
        summary: task.description,
        priority: task.priority,
        category: task.category,
        autoReady: false,
      } as NextActionPlan;
    }

    return {
      title: "Maintain outreach cadence",
      summary:
        "Continue working through the outreach queue, keeping follow-ups tight and engagement consistent.",
      priority: "medium",
      category: "review",
      autoReady: false,
    } as NextActionPlan;
  }, [triggerActions, draftedTasks]);

  const contactLaneItems = useMemo<FocusLaneItem[]>(() => {
    return prioritizedFocusContacts.map((contact, index) => ({
      id: `contact-${contact.id}`,
      title: fullName(contact),
      summary: intelligenceByContact.get(contact.id)?.summary || "Engage contact",
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

      setCompletedCount((prev) => prev + 1);
      setStreakCount((prev) => prev + 1);
      setNotes("");

      const next = buildOutreachNextAction(outcome, fullName(contact));
      setNextAction(next);

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

  if (loading) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading outreach focus workspace...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Zap className="h-3.5 w-3.5" />
              Outreach Focus Mode
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Execute outreach, follow signals, and keep momentum high.
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Work through contacts, follow-up pressure, and list routing without
                breaking flow.
              </p>
              <p className="text-sm font-medium text-slate-200">
                Contacts first. Follow-up second. List routing third.
              </p>

              {selectedList ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                  <ListChecks className="h-4 w-4" />
                  Focusing list: {selectedList.name}
                </div>
              ) : null}
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

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Execution Streak</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {streakCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Completed This Session</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Current Operating Mode</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {selectedList ? "List Focus" : "Hybrid Guidance"}
          </p>
        </div>
      </section>

      <section
        className={`rounded-2xl border p-4 ${nextActionTone(
          suggestedNext.category
        )}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">
              Aether Suggested Next Move
            </p>
            <p className="mt-2 text-lg font-semibold">{suggestedNext.title}</p>
            <p className="mt-1 text-sm">{suggestedNext.summary}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                  suggestedNext.priority
                )}`}
              >
                {suggestedNext.priority}
              </span>
              <span className="inline-flex rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold">
                {suggestedNext.category}
              </span>
              <span className="inline-flex rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold">
                {suggestedNext.autoReady ? "auto-ready" : "manual review"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-current/20 bg-white/70 px-4 py-3 text-sm">
            Live queue, follow-up pressure, contacts, and lists stay connected in
            one execution workspace.
          </div>
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
                Primary execution lane · top 3 active contacts
              </p>
            </div>
            <Users className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleContactLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active contacts right now. New contacts will route in automatically.
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
                Secondary lane · top 3 follow-ups in queue
              </p>
            </div>
            <User className="h-4 w-4 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleFollowUpLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active follow-ups right now. Follow-ups will surface here when needed.
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
                Tertiary lane · top 3 active list routes
              </p>
            </div>
            <List className="h-4 w-4 text-slate-500" />
          </div>

          <div className="space-y-3">
            {visibleListLaneItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No active list routing right now. Lists will appear here when routing is active.
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
              Execute the currently selected item
            </p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            This is the live execution surface. Cards route work here. The next action happens here.
          </p>
        </div>

        {!activeContact && !activeFollowUp && !activeList ? (
          <p className="text-sm text-slate-500">
            Select a card to begin execution. Your active work will appear here.
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

      <section className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Outreach rule: contacts first, follow-up second, list routing third. Follow the signal, but stay in control.
        </div>
      </section>
    </div>
  );
}