"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ContactRound,
  Headphones,
  ListChecks,
  ListFilter,
  Megaphone,
  MessageSquare,
  PhoneCall,
  RefreshCcw,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  buildContactIntelligence,
  callResults,
  createAutoTaskForOutcome,
  filterOutreachContacts,
  getListContacts,
  getOutreachLists,
  getOutreachLogs,
  getSortedWorkflowContacts,
  saveOutreachLog,
  textResults,
} from "@/lib/data/outreach";
import {
  CampaignList,
  Contact,
  ContactIntelligence,
  OutreachLog,
} from "@/lib/data/types";
import { fullName } from "@/lib/data/utils";
import { useDashboardOwner } from "../owner-context";
import {
  getOutreachSignals,
  getFinanceSignals,
} from "@/lib/intelligence/signals";
import { aggregateAetherIntelligence } from "@/lib/intelligence/aggregator";
import { getTopTriggerActions } from "@/lib/intelligence/action-triggers";
import { buildDraftTasksFromTriggers } from "@/lib/intelligence/task-drafts";
import {
  AbeDepartment,
  AbeGlobalMemory,
  AbePatternInsight,
  departmentLabel,
} from "@/lib/abe/abe-memory";
import { buildAbePatternInsights } from "@/lib/abe/abe-patterns";
import { filterPatternsForDepartment } from "@/lib/abe/abe-filters";
import { AbeBriefing } from "@/lib/abe/abe-briefing";
import { updateAbeMemory } from "@/lib/abe/update-abe-memory";
import { buildAbeOrgLayer, getOrgContextForDepartment } from "@/lib/abe/abe-org-layer";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type OutreachListTag = "outreach" | "field" | "finance" | "volunteer";

type OutreachCommandSignal = {
  title: string;
  detail: string;
  instruction: string;
  priority: "high" | "medium" | "low";
  category:
    | "conversion"
    | "retry"
    | "task"
    | "review"
    | "finance"
    | "execution";
  autoReady: boolean;
};

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

function normalizeOwner(value?: string | null) {
  return value?.trim() || "Unassigned";
}

function resolveListTag(list: CampaignList): OutreachListTag {
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

function listTagTone(tag: OutreachListTag) {
  switch (tag) {
    case "field":
      return "border border-sky-200 bg-sky-100 text-sky-700";
    case "finance":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "volunteer":
      return "border border-purple-200 bg-purple-100 text-purple-700";
    case "outreach":
    default:
      return "border border-violet-200 bg-violet-100 text-violet-800";
  }
}

function patternSeverityTone(severity: AbePatternInsight["severity"]) {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "important":
      return "border-amber-200 bg-amber-50 text-violet-900";
    case "watch":
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

function getRoleLabel(role: DemoRole) {
  if (role === "admin") return "Admin View";
  if (role === "director") return "Director View";
  return "Operator View";
}

function getDepartmentLabel(department: DemoDepartment) {
  switch (department) {
    case "finance":
      return "Finance";
    case "field":
      return "Field";
    case "digital":
      return "Digital";
    case "print":
      return "Print";
    case "outreach":
    default:
      return "Outreach";
  }
}

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

function getOutreachAbeBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  ownerScopedContacts: Contact[];
  ownerScopedLogs: OutreachLog[];
  visibleFilteredContactsLength: number;
  financeTriggeredDraftTasksLength: number;
  positiveEngagement: number;
  staleContacts: number;
  followUpPressure: number;
  outreachCommandSignal: OutreachCommandSignal;
}): AbeBriefing {
  const financeTriggeredActive = input.financeTriggeredDraftTasksLength > 0;
  const conversionReady = input.positiveEngagement >= Math.max(2, input.followUpPressure);
  const reactivationPressure =
    input.staleContacts + Math.max(0, input.visibleFilteredContactsLength - input.positiveEngagement);

  const strongest: AbeDepartment =
    financeTriggeredActive || conversionReady ? "outreach" : "finance";

  const weakest: AbeDepartment =
    input.followUpPressure + input.staleContacts > input.positiveEngagement + 1
      ? "outreach"
      : financeTriggeredActive
      ? "finance"
      : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? financeTriggeredActive
        ? "outreach"
        : "outreach"
      : input.demoDepartment === "outreach"
      ? "outreach"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    financeTriggeredActive ? "finance" : "outreach";

  let health = "Stable overall";
  if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    health = "Pressure is rising";
  } else if (conversionReady || financeTriggeredActive) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (financeTriggeredActive) {
    campaignStatus = "Stable with finance-triggered opportunity";
  } else if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    campaignStatus = "Follow-up pressure is building";
  } else if (conversionReady) {
    campaignStatus = "Stable with opportunity";
  }

  let whyNow =
    "Outreach has active engagement in motion, but queue discipline and conversion speed will determine whether momentum sticks.";

  if (financeTriggeredActive) {
    whyNow =
      "Finance is surfacing donor-related contacts into Outreach, which means this lane needs to absorb high-value follow-up before the opportunity cools.";
  } else if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    whyNow =
      "Follow-up demand is building faster than the lane is clearing it, which makes responsiveness the immediate risk.";
  } else if (conversionReady) {
    whyNow =
      "Positive engagement is active, so Outreach has a real conversion window right now if the warmest contacts get worked first.";
  } else if (reactivationPressure > 0) {
    whyNow =
      "Most available contacts need another attempt, retry, or reconnect before momentum can build again.";
  }

  const supportText =
    input.role === "admin"
      ? "Use Outreach Focus to clear pressure and work warm contacts first."
      : input.role === "director"
      ? "Use Outreach Focus to keep queue health tight and sequence warm contacts."
      : "Stay on the next contact and keep the lane moving.";

  const actions: string[] = [];

  if (financeTriggeredActive) {
    actions.push("Work the finance-triggered outreach contacts before they cool.");
  }

  if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    actions.push("Clear the oldest follow-ups before queue pressure spreads.");
  }

  if (conversionReady) {
    actions.push("Convert the warmest contacts while engagement is still active.");
  } else {
    actions.push("Reconnect stale contacts to rebuild lane momentum.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next outreach action tight and move to the next contact.");
  }

  return {
    health,
    strongest,
    weakest,
    primaryLane,
    opportunityLane,
    campaignStatus,
    whyNow,
    supportText,
    actions: actions.slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal: financeTriggeredActive
      ? "FINANCE is feeding high-value follow-up work directly into OUTREACH."
      : undefined,
  };
}

function OutreachPageContent() {
  const searchParams = useSearchParams();
  const preselectedContactId = searchParams.get("contactId") || "";
  const preferredChannel = searchParams.get("channel");
  const preferredListId = searchParams.get("listId") || "";

  const initialChannel: "call" | "text" =
    preferredChannel === "text" ? "text" : "call";

  const [lists, setLists] = useState<CampaignList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [selectedListName, setSelectedListName] = useState("All Contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<OutreachLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [selectedContactId, setSelectedContactId] = useState("");
  const [channel, setChannel] = useState<"call" | "text">(initialChannel);
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [defaultTaskOwner, setDefaultTaskOwner] = useState("");

  const [completedCount, setCompletedCount] = useState(0);
  const [callStreak, setCallStreak] = useState(0);

  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("outreach");
  const [contextMode, setContextMode] = useState("default");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const { ownerFilter } = useDashboardOwner();
  const focusSectionRef = useRef<HTMLElement | null>(null);
  const selectedContactRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    async function loadOrgContext() {
      try {
        const response = await fetch("/api/auth/current-context");

        if (!response.ok) return;

        const data = await response.json();

        setContextMode(
          data?.organization?.context_mode || "default"
        );
      } catch (error) {
        console.error("Failed to load org context", error);
      }
    }

    loadOrgContext();
  }, []);

  useEffect(() => {
    if (
      preferredListId &&
      lists.some((list) => list.id === preferredListId) &&
      !selectedListId
    ) {
      setSelectedListId(preferredListId);
      return;
    }

    if (!selectedListId) {
      loadAllContacts();
      setLogs([]);
      setSelectedListName("All Contacts");
      setDefaultTaskOwner("");
      return;
    }

    const match = lists.find((list) => list.id === selectedListId);
    setSelectedListName(match?.name || "Selected List");
    setDefaultTaskOwner(match?.default_owner_name || "");

    loadListContacts(selectedListId);
    loadLogs(selectedListId);
  }, [selectedListId, lists, preferredListId]);

  useEffect(() => {
    setResult("");
  }, [channel]);

  useEffect(() => {
    if (preferredChannel === "call" || preferredChannel === "text") {
      setChannel(preferredChannel);
    }
  }, [preferredChannel]);

  async function loadLists() {
    try {
      setLoading(true);
      setMessage("");

      const loadedLists = await getOutreachLists();
      setLists(loadedLists);

      if (
        preferredListId &&
        loadedLists.some((list) => list.id === preferredListId) &&
        !selectedListId
      ) {
        setSelectedListId(preferredListId);
      }
    } catch (err: any) {
      setMessage(`Error loading lists: ${err?.message || "Unknown error"}`);
      setLists([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllContacts() {
    try {
      setContactsLoading(true);
      setMessage("");

      const allLists = await getOutreachLists();

      let allContacts: Contact[] = [];

      for (const list of allLists) {
        const listContacts = await getListContacts(list.id);
        allContacts = [...allContacts, ...listContacts];
      }

      const uniqueContacts = Array.from(
        new Map(allContacts.map((contact) => [contact.id, contact])).values()
      );

      setContacts(uniqueContacts);

      if (
        preselectedContactId &&
        uniqueContacts.some((contact) => contact.id === preselectedContactId)
      ) {
        setSelectedContactId(preselectedContactId);
        setFocusMode(true);
      } else if (
        uniqueContacts.length > 0 &&
        !uniqueContacts.some((contact) => contact.id === selectedContactId)
      ) {
        setSelectedContactId(uniqueContacts[0].id);
      }

      if (uniqueContacts.length === 0) {
        setSelectedContactId("");
      }
    } catch (err: any) {
      setMessage(`Error loading all contacts: ${err?.message || "Unknown error"}`);
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }
    async function loadListContacts(listId: string) {
    try {
      setContactsLoading(true);
      setMessage("");

      const mappedContacts = await getListContacts(listId);
      setContacts(mappedContacts);

      if (
        preselectedContactId &&
        mappedContacts.some((contact) => contact.id === preselectedContactId)
      ) {
        setSelectedContactId(preselectedContactId);
        setFocusMode(true);
      } else if (
        mappedContacts.length > 0 &&
        !mappedContacts.some((contact) => contact.id === selectedContactId)
      ) {
        setSelectedContactId(mappedContacts[0].id);
      }

      if (mappedContacts.length === 0) {
        setSelectedContactId("");
      }
    } catch (err: any) {
      setMessage(
        `Error loading outreach contacts: ${err?.message || "Unknown error"}`
      );
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }

  async function loadLogs(listId: string) {
    try {
      setLogsLoading(true);

      const data = await getOutreachLogs(listId);
      setLogs(data);
    } catch (err: any) {
      setMessage(`Error loading outreach logs: ${err?.message || "Unknown error"}`);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

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
      const result = String(log.result || "").toLowerCase();
      return result.includes("follow") || result.includes("callback");
    }).length;

    const positiveContacts = ownerScopedLogs.filter((log) => {
      const result = String(log.result || "").toLowerCase();
      return (
        result.includes("positive") ||
        result.includes("support") ||
        result.includes("interested") ||
        result.includes("pledge")
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

    const cashOnHandPressure = highValueDonorsPending > 3 ? 7 : 4;

    return getFinanceSignals({
      missingComplianceRecords,
      overduePledges,
      highValueDonorsPending,
      cashOnHandPressure,
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

  const financeTriggerActions = useMemo(() => {
    return getTopTriggerActions(financeTriggerSnapshot, 5, {
      highValueContacts,
    }).filter(
      (action) =>
        action.sourceDomain === "finance" && action.targetDomain === "outreach"
    );
  }, [financeTriggerSnapshot, highValueContacts]);

  const financeTriggeredDraftTasks = useMemo(() => {
    return buildDraftTasksFromTriggers(financeTriggerActions);
  }, [financeTriggerActions]);

  const financeTriggeredContactIds = useMemo(() => {
    return new Set(
      financeTriggeredDraftTasks
        .map((task) => task.contactId)
        .filter((value): value is string => Boolean(value))
    );
  }, [financeTriggeredDraftTasks]);

  const sortedFocusContacts = useMemo(() => {
    return getSortedWorkflowContacts(ownerScopedContacts, intelligenceByContact);
  }, [ownerScopedContacts, intelligenceByContact]);

  const financePrioritizedFocusContacts = useMemo(() => {
    const financeTriggered = sortedFocusContacts.filter((contact) =>
      financeTriggeredContactIds.has(contact.id)
    );

    const remaining = sortedFocusContacts.filter(
      (contact) => !financeTriggeredContactIds.has(contact.id)
    );

    return [...financeTriggered, ...remaining];
  }, [sortedFocusContacts, financeTriggeredContactIds]);

  const currentFocusIndex = useMemo(() => {
    return financePrioritizedFocusContacts.findIndex(
      (contact) => contact.id === selectedContactId
    );
  }, [financePrioritizedFocusContacts, selectedContactId]);

  const currentFocusContact =
    currentFocusIndex >= 0
      ? financePrioritizedFocusContacts[currentFocusIndex]
      : null;

  const filteredContacts = useMemo(() => {
    return filterOutreachContacts(
      ownerScopedContacts,
      search,
      intelligenceByContact
    );
  }, [ownerScopedContacts, search, intelligenceByContact]);

  const taggedLists = useMemo(() => {
    return lists.map((list) => ({
      ...list,
      tag: resolveListTag(list),
    }));
  }, [lists]);

  const selectedList = useMemo(() => {
    return lists.find((list) => list.id === selectedListId) || null;
  }, [lists, selectedListId]);

  const outreachCommandSignal = useMemo<OutreachCommandSignal>(() => {
    const topPriorityContact = financePrioritizedFocusContacts[0];

    const followUpPressure = ownerScopedLogs.filter((log) => {
      const result = String(log.result || "").toLowerCase();
      return result.includes("follow") || result.includes("callback");
    }).length;

    const staleContacts = ownerScopedContacts.filter((contact: any) =>
      Boolean(contact.is_stale)
    ).length;

    const positiveEngagement = ownerScopedLogs.filter((log) => {
      const result = String(log.result || "").toLowerCase();
      return (
        result.includes("positive") ||
        result.includes("support") ||
        result.includes("interested") ||
        result.includes("pledge")
      );
    }).length;

    const financeTriggeredCount = financeTriggeredContactIds.size;
    const activeQueue = filteredContacts.length;
    const reactivationLoad =
      staleContacts + Math.max(0, activeQueue - positiveEngagement);

    if (financeTriggeredCount > 0) {
      return {
        title: "Finance-triggered outreach is active",
        detail:
          "Donor-related contacts have been surfaced into Outreach and need immediate follow-up.",
        instruction: "Prioritize finance-triggered contacts first.",
        priority: "high",
        category: "finance",
        autoReady: true,
      };
    }

    if (followUpPressure + staleContacts > positiveEngagement + 1) {
      return {
        title: "Follow-up pressure is building",
        detail:
          "Active conversations are not being closed fast enough, and stale contacts are accumulating.",
        instruction: "Clear follow-ups before momentum drops.",
        priority: "high",
        category: "task",
        autoReady: true,
      };
    }

    if (positiveEngagement >= Math.max(2, followUpPressure)) {
      return {
        title: "Conversion window is open",
        detail:
          "Positive engagement is active, so this lane has a stronger opportunity to convert right now.",
        instruction: "Work conversion-ready contacts first.",
        priority: "high",
        category: "conversion",
        autoReady: true,
      };
    }

    if (reactivationLoad > 0 && positiveEngagement === 0) {
      return {
        title: "Reactivation lane is active",
        detail:
          "Most available contacts need another attempt, retry, or reconnect before momentum can build.",
        instruction: "Focus on reconnecting stale contacts.",
        priority: "medium",
        category: "retry",
        autoReady: true,
      };
    }

    if (topPriorityContact) {
      return {
        title: "Outreach lane is stable",
        detail: `${fullName(
          topPriorityContact
        )} is ready to keep the queue moving without major pressure building.`,
        instruction: "Continue working the active queue.",
        priority: "medium",
        category: "execution",
        autoReady: true,
      };
    }

    return {
      title: "Outreach lane is stable",
      detail: "No immediate outreach pressure is rising right now.",
      instruction: "Maintain cadence and continue working the active queue.",
      priority: "low",
      category: "review",
      autoReady: false,
    };
  }, [
    financePrioritizedFocusContacts,
    financeTriggeredContactIds,
    ownerScopedLogs,
    ownerScopedContacts,
    filteredContacts.length,
  ]);

  const outreachCommandTone = useMemo(() => {
    switch (outreachCommandSignal.title) {
      case "Finance-triggered outreach is active":
        return {
          card: "border-emerald-200 bg-emerald-50",
          eyebrow: "text-emerald-800",
          title: "text-emerald-900",
          body: "text-emerald-900/80",
          instruction: "text-emerald-950",
          chip: "border-emerald-300 bg-white text-emerald-800",
          button: "bg-emerald-600 hover:bg-emerald-700 text-white",
          Icon: Sparkles,
        };

      case "Follow-up pressure is building":
        return {
          card: "border-rose-200 bg-rose-50",
          eyebrow: "text-rose-800",
          title: "text-rose-900",
          body: "text-rose-900/80",
          instruction: "text-rose-950",
          chip: "border-rose-300 bg-white text-rose-800",
          button: "bg-rose-600 hover:bg-rose-700 text-white",
          Icon: AlertTriangle,
        };

      case "Conversion window is open":
        return {
          card: "border-amber-200 bg-amber-50",
          eyebrow: "text-amber-800",
          title: "text-violet-900",
          body: "text-violet-900/80",
          instruction: "text-amber-950",
          chip: "border-amber-300 bg-white text-amber-800",
          button: "bg-amber-600 hover:bg-amber-700 text-white",
          Icon: Zap,
        };

      case "Reactivation lane is active":
        return {
          card: "border-slate-300 bg-slate-50",
          eyebrow: "text-slate-700",
          title: "text-slate-900",
          body: "text-slate-700",
          instruction: "text-slate-950",
          chip: "border-slate-300 bg-white text-slate-700",
          button: "bg-slate-700 hover:bg-slate-800 text-white",
          Icon: RefreshCcw,
        };

      case "Outreach lane is stable":
      default:
        return {
          card: "border-sky-200 bg-sky-50",
          eyebrow: "text-sky-800",
          title: "text-sky-900",
          body: "text-sky-900/80",
          instruction: "text-sky-950",
          chip: "border-sky-300 bg-white text-sky-800",
          button: "bg-sky-600 hover:bg-sky-700 text-white",
          Icon: Megaphone,
        };
    }
  }, [outreachCommandSignal]);
    const visibleTaggedLists = useMemo(() => {
    if (demoRole === "admin") {
      return taggedLists;
    }

    if (demoRole === "director") {
      return taggedLists.filter((list) => {
        if (demoDepartment === "outreach") {
          return list.tag === "outreach" || list.tag === "finance";
        }
        return list.tag === demoDepartment;
      });
    }

    return taggedLists.filter((list) => {
      if (demoDepartment === "outreach") {
        return list.tag === "outreach";
      }
      return list.tag === demoDepartment;
    });
  }, [taggedLists, demoRole, demoDepartment]);

  const visibleFilteredContacts = useMemo(() => {
    if (demoRole === "admin") {
      return filteredContacts;
    }

    const scoped = filteredContacts.filter((contact: any) => {
      const pledgeAmount = Number(contact.pledge_amount ?? 0);
      const donationTotal = Number(contact.donation_total ?? 0);
      const ownerName = String(contact.owner_name ?? "").toLowerCase();

      if (demoDepartment === "finance") {
        return pledgeAmount > 0 || donationTotal > 0;
      }

      if (demoDepartment === "field") {
        return ownerName.includes("field");
      }

      if (demoDepartment === "digital") {
        return ownerName.includes("digital");
      }

      if (demoDepartment === "print") {
        return ownerName.includes("print");
      }

      return true;
    });

    return scoped.slice(0, demoRole === "director" ? 10 : 6);
  }, [filteredContacts, demoRole, demoDepartment]);

  const visibleFinanceTriggeredDraftTasks = useMemo(() => {
    if (demoRole === "admin") {
      return financeTriggeredDraftTasks;
    }

    if (demoDepartment === "finance" || demoDepartment === "outreach") {
      return financeTriggeredDraftTasks.slice(0, demoRole === "director" ? 4 : 2);
    }

    return [];
  }, [financeTriggeredDraftTasks, demoRole, demoDepartment]);

  const perspectiveHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Outreach Command Center";
    }

    if (demoRole === "director") {
      return "Outreach Director View";
    }

    return "Outreach Work Lane";
  }, [demoRole]);

  const perspectiveSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Manage engagement, follow-up pressure, and conversion signals from one surface.";
    }

    if (demoRole === "director") {
      return "Lead the outreach lane with cleaner visibility into pressure and conversion.";
    }

    return "Stay focused on the next outreach actions that need to move right now.";
  }, [demoRole]);

  const commandSignalCtaLabel = useMemo(() => {
    if (demoRole === "general_user") {
      return "Open Outreach Work";
    }

    return "Enter Focus Mode";
  }, [demoRole]);

  const visibleStats = useMemo(() => {
    const stats = [
      {
        id: "contacts",
        label: "Contacts",
        value: ownerScopedContacts.length,
      },
      {
        id: "filtered",
        label: "Filtered",
        value: visibleFilteredContacts.length,
      },
      {
        id: "completed",
        label: "Completed",
        value: completedCount,
      },
      {
        id: "streak",
        label: "Streak",
        value: callStreak,
      },
    ];

    if (demoRole === "admin") return stats;
    if (demoRole === "director") return stats.slice(0, 3);
    return stats.filter((item) => item.id === "filtered" || item.id === "streak");
  }, [
    ownerScopedContacts.length,
    visibleFilteredContacts.length,
    completedCount,
    callStreak,
    demoRole,
  ]);

  const outreachPositiveEngagement = useMemo(() => {
    return ownerScopedLogs.filter((log) => {
      const result = String(log.result || "").toLowerCase();
      return (
        result.includes("positive") ||
        result.includes("support") ||
        result.includes("interested") ||
        result.includes("pledge")
      );
    }).length;
  }, [ownerScopedLogs]);

  const outreachFollowUpPressure = useMemo(() => {
    return ownerScopedLogs.filter((log) => {
      const result = String(log.result || "").toLowerCase();
      return result.includes("follow") || result.includes("callback");
    }).length;
  }, [ownerScopedLogs]);

  const outreachStaleContacts = useMemo(() => {
    return ownerScopedContacts.filter((contact: any) => Boolean(contact.is_stale))
      .length;
  }, [ownerScopedContacts]);

  const outreachAbeBriefing = useMemo(() => {
    return getOutreachAbeBriefing({
      role: demoRole,
      demoDepartment,
      ownerScopedContacts,
      ownerScopedLogs,
      visibleFilteredContactsLength: visibleFilteredContacts.length,
      financeTriggeredDraftTasksLength: financeTriggeredDraftTasks.length,
      positiveEngagement: outreachPositiveEngagement,
      staleContacts: outreachStaleContacts,
      followUpPressure: outreachFollowUpPressure,
      outreachCommandSignal,
    });
  }, [
    demoRole,
    demoDepartment,
    ownerScopedContacts,
    ownerScopedLogs,
    visibleFilteredContacts.length,
    financeTriggeredDraftTasks.length,
    outreachPositiveEngagement,
    outreachStaleContacts,
    outreachFollowUpPressure,
    outreachCommandSignal,
  ]);

  const outreachOrgLayer = useMemo(() => {
    return buildAbeOrgLayer({
      lanes: [
        {
          department: "outreach",
          strongest: outreachAbeBriefing.strongest,
          weakest: outreachAbeBriefing.weakest,
          primaryLane: outreachAbeBriefing.primaryLane,
          opportunityLane: outreachAbeBriefing.opportunityLane,
          health: outreachAbeBriefing.health,
          campaignStatus: outreachAbeBriefing.campaignStatus,
          whyNow: outreachAbeBriefing.whyNow,
          crossDomainSignal: outreachAbeBriefing.crossDomainSignal,
        },
        {
          department: "finance",
          strongest: financeTriggeredDraftTasks.length > 0 ? "finance" : "outreach",
          weakest:
            financeTriggeredDraftTasks.length > 0 || outreachFollowUpPressure > outreachPositiveEngagement
              ? "finance"
              : "outreach",
          primaryLane: financeTriggeredDraftTasks.length > 0 ? "finance" : "outreach",
          opportunityLane: financeTriggeredDraftTasks.length > 0 ? "outreach" : "finance",
          health:
            financeTriggeredDraftTasks.length > 0
              ? "Pressure is rising"
              : "Stable overall",
          campaignStatus:
            financeTriggeredDraftTasks.length > 0
              ? "Finance-triggered follow-up is active"
              : "Stable overall",
          crossDomainSignal:
            financeTriggeredDraftTasks.length > 0
              ? "FINANCE is feeding high-value follow-up work directly into OUTREACH."
              : undefined,
        },
      ],
    });
  }, [
    outreachAbeBriefing,
    financeTriggeredDraftTasks.length,
    outreachFollowUpPressure,
    outreachPositiveEngagement,
  ]);

  const outreachOrgContext = useMemo(() => {
    return getOrgContextForDepartment(outreachOrgLayer, "outreach");
  }, [outreachOrgLayer]);

  const outreachAbeDisplayBriefing = useMemo(() => {
    let whyNow = outreachAbeBriefing.whyNow;

    const whyNowModifiers:string[] = [];
    if (outreachOrgContext.departmentIsPressureLeader && outreachOrgContext.imbalanceDetected) {
      whyNowModifiers.push("Outreach is shaping more of the broader campaign pressure picture.");
    } else if (
      outreachOrgContext.departmentIsMomentumLeader &&
      !outreachOrgContext.departmentIsPressureLeader
    ) {
      whyNowModifiers.push("Outreach is carrying cleaner momentum in the broader campaign read.");
    }
    whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

    const supportText = `${outreachAbeBriefing.supportText} ${outreachOrgContext.orgSupportLine}`.trim();

    return {
      ...outreachAbeBriefing,
      whyNow,
      supportText,
      crossDomainSignal:
        outreachAbeBriefing.crossDomainSignal ??
        (outreachOrgContext.crossLaneTension ? outreachOrgContext.orgNarrative : undefined),
    };
  }, [outreachAbeBriefing, outreachOrgContext]);

  useEffect(() => {
    setAbeMemory((current) => updateAbeMemory(current, outreachAbeDisplayBriefing));
  }, [
    outreachAbeDisplayBriefing.health,
    outreachAbeDisplayBriefing.campaignStatus,
    outreachAbeDisplayBriefing.primaryLane,
    outreachAbeDisplayBriefing.strongest,
    outreachAbeDisplayBriefing.weakest,
    outreachAbeDisplayBriefing.opportunityLane,
    outreachAbeDisplayBriefing.crossDomainSignal,
  ]);

  const outreachPatternWatch = useMemo(() => {
    const patterns = buildAbePatternInsights({
      role: demoRole,
      demoDepartment: "outreach",
      briefing: outreachAbeDisplayBriefing,
      memory: abeMemory,
    });

    return filterPatternsForDepartment(patterns, "outreach");
  }, [demoRole, outreachAbeDisplayBriefing, abeMemory]);

  const outreachAbeInsight = useMemo(() => {
    if (outreachPatternWatch.length > 0) {
      return outreachPatternWatch[0].detail;
    }

    return outreachAbeDisplayBriefing.whyNow;
  }, [outreachPatternWatch, outreachAbeDisplayBriefing.whyNow]);

  const selectedContactPatternHint = useMemo(() => {
    if (!currentFocusContact) return null;

    if (financeTriggeredContactIds.has(currentFocusContact.id)) {
      return "Pattern: finance-triggered outreach keeps surfacing high-value follow-up work.";
    }

    if (outreachFollowUpPressure + outreachStaleContacts > outreachPositiveEngagement + 1) {
      return "Pattern: follow-up pressure is staying ahead of conversion speed.";
    }

    if (outreachPositiveEngagement >= Math.max(2, outreachFollowUpPressure)) {
      return "Pattern: conversion-ready engagement is appearing consistently in the lane.";
    }

    return null;
  }, [
    currentFocusContact,
    financeTriggeredContactIds,
    outreachFollowUpPressure,
    outreachStaleContacts,
    outreachPositiveEngagement,
  ]);

  const orgTheme = getOrgContextTheme(contextMode);

  async function handleLog() {
    if (!selectedContactId) {
      setMessage("Select a contact first.");
      return;
    }

    if (!result) {
      setMessage("Select a result.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await saveOutreachLog({
        contactId: selectedContactId,
        listId: selectedListId || null,
        channel,
        result,
        notes,
      });

      await createAutoTaskForOutcome({
        contactId: selectedContactId,
        listId: selectedListId || null,
        channel,
        result,
        contactName:
          fullName(
            ownerScopedContacts.find((c) => c.id === selectedContactId) || null
          ) || "Contact",
        listName: selectedListName,
        ownerName: defaultTaskOwner || "Team",
      });

      setCompletedCount((value) => value + 1);
      setCallStreak((value) => value + 1);

      setNotes("");
      setResult("");

      if (selectedListId) {
        await loadLogs(selectedListId);
      } else {
        setLogs((current) => [
          {
            id: `temp-${Date.now()}`,
            contact_id: selectedContactId,
            list_id: null,
            channel,
            result,
            notes,
            created_at: new Date().toISOString(),
          } as any,
          ...current,
        ]);
      }

      const nextContact =
        currentFocusIndex >= 0
          ? financePrioritizedFocusContacts[currentFocusIndex + 1]
          : null;

      if (nextContact) {
        setSelectedContactId(nextContact.id);
      }

      setMessage("Logged successfully.");
    } catch (err: any) {
      setMessage(`Error logging outreach: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-slate-800 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Megaphone className="h-4 w-4" />
                Voter + contact engagement engine
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  {perspectiveHeadline}
                </h1>
                <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                  {perspectiveSubheadline}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/dashboard/contacts"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <ContactRound className="h-4 w-4" />
                Contacts
              </Link>

              {demoRole !== "general_user" ? (
                <Link
                  href="/dashboard/lists"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <ListChecks className="h-4 w-4" />
                  Lists
                </Link>
              ) : null}

              {demoRole === "admin" ? (
                <Link
                  href="/dashboard/ingest?source=outreach"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Users className="h-4 w-4" />
                  Import Contacts
                </Link>
              ) : null}

              <Link
                href="/dashboard/outreach/focus"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-200"
              >
                <Zap className="h-4 w-4 text-slate-950" />
                <span className="text-slate-950">Open Focus Mode</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Demo role perspective
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["admin", "director", "general_user"] as DemoRole[]).map(
                    (role) => (
                      <button
                        key={role}
                        onClick={() => setDemoRole(role)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          demoRole === role
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {role}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Demo department perspective
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["outreach", "finance", "field", "digital", "print"] as DemoDepartment[]
                  ).map((department) => (
                    <button
                      key={department}
                      onClick={() => setDemoDepartment(department)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        demoDepartment === department
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-medium text-slate-900">
                {getRoleLabel(demoRole)}:
              </span>{" "}
              This outreach surface narrows around who is using Aether and how
              much of the engagement lane they should see.
            </div>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-violet-800">
                  <Sparkles className="h-4 w-4" />
                  Honest Abe
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-700/80">
                    {getRoleLabel(demoRole)}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-violet-900">
                    <div>
                      <span className="font-medium text-violet-700">Health:</span>{" "}
                      {outreachAbeDisplayBriefing.health}
                    </div>
                    <div>
                      <span className="font-medium text-violet-700">Strongest:</span>{" "}
                      {departmentLabel(outreachAbeDisplayBriefing.strongest)}
                    </div>
                    <div>
                      <span className="font-medium text-violet-700">Weakest:</span>{" "}
                      {departmentLabel(outreachAbeDisplayBriefing.weakest)}
                    </div>
                    <div>
                      <span className="font-medium text-violet-700">Status:</span>{" "}
                      {outreachAbeDisplayBriefing.campaignStatus}
                    </div>
                  </div>

                  <h2 className="text-2xl font-semibold text-violet-900">
                    {outreachAbeDisplayBriefing.primaryLane === "outreach"
                      ? "Outreach is the lane that needs tight execution right now."
                      : `${departmentLabel(
                          outreachAbeDisplayBriefing.primaryLane
                        )} is shaping what outreach should do next.`}
                  </h2>

                  <p className="max-w-3xl text-sm text-slate-700 lg:text-base">
                    {outreachCommandSignal.detail}
                  </p>

                  <p className="max-w-3xl text-sm italic text-slate-600">
                    Why now: {outreachAbeInsight}
                  </p>

                  {outreachAbeDisplayBriefing.crossDomainSignal ? (
                    <p className="max-w-3xl text-sm text-violet-900/80">
                      {outreachAbeDisplayBriefing.crossDomainSignal}
                    </p>
                  ) : null}

                  <p className="max-w-3xl text-sm text-slate-600">
                    {outreachAbeDisplayBriefing.supportText}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-violet-100 bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                What Abe Would Do
              </p>

              <div className="mt-3 space-y-3">
                {outreachAbeDisplayBriefing.actions.map((move, index) => (
                  <div
                    key={`${move}-${index}`}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800">
                      {index + 1}
                    </div>
                    <p>{move}</p>
                  </div>
                ))}
              </div>
            </div>

            {outreachPatternWatch.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-violet-100 bg-white/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                  Pattern Watch
                </p>
                                <div className="mt-3 space-y-3">
                  {outreachPatternWatch.map((insight, index) => (
                    <div
                      key={`${insight.label}-${index}`}
                      className={`rounded-2xl border p-4 ${patternSeverityTone(
                        insight.severity
                      )}`}
                    >
                      <p className="text-sm font-semibold">{insight.label}</p>
                      <p className="mt-1 text-sm opacity-90">{insight.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <div
            className={`rounded-3xl border p-5 shadow-sm ${outreachCommandTone.card}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${outreachCommandTone.eyebrow}`}
                >
                  <outreachCommandTone.Icon className="h-4 w-4" />
                  Aether Command Signal
                </div>

                <h2 className={`text-xl font-semibold ${outreachCommandTone.title}`}>
                  {outreachCommandSignal.title}
                </h2>

                <p className={`mt-1 text-sm ${outreachCommandTone.body}`}>
                  {outreachCommandSignal.detail}
                </p>

                <p
                  className={`mt-3 text-sm font-medium ${outreachCommandTone.instruction}`}
                >
                  {outreachCommandSignal.instruction}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${outreachCommandTone.chip}`}
                  >
                    {outreachCommandSignal.priority} priority
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${outreachCommandTone.chip}`}
                  >
                    {outreachCommandSignal.category}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${outreachCommandTone.chip}`}
                  >
                    {outreachCommandSignal.autoReady
                      ? "auto-ready"
                      : "manual review"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(demoRole === "admin" ||
            demoDepartment === "outreach" ||
            demoDepartment === "finance") && (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Finance-Triggered Follow-Up Queue
                  </p>
                  <h2 className="text-2xl font-semibold text-emerald-900">
                    Donor Follow-Ups Surfaced by Aether
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-emerald-900/80">
                    These contacts were surfaced by finance intelligence because they
                    are high-value and appear stale for outreach follow-up.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900">
                    {visibleFinanceTriggeredDraftTasks.length} signal
                    {visibleFinanceTriggeredDraftTasks.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {visibleFinanceTriggeredDraftTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-emerald-200 bg-white p-4"
                  >
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {task.description}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={`/dashboard/outreach?contactId=${task.contactId}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View Contact
                      </Link>
                    </div>
                  </div>
                ))}

                {visibleFinanceTriggeredDraftTasks.length === 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-emerald-900">
                    No finance-triggered follow-ups right now.
                  </div>
                )}
              </div>
            </section>
          )}

      <section
        className={`grid gap-4 ${
          visibleStats.length === 2
            ? "md:grid-cols-2"
            : visibleStats.length === 3
            ? "md:grid-cols-3"
            : "md:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {visibleStats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center gap-3">
            <ListFilter className="h-4 w-4 text-slate-500" />
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">All Contacts</option>
              {visibleTaggedLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </div>

        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Engagement Workspace
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Contact View
              </h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-500">
              {visibleFilteredContacts.length} contacts
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {visibleFilteredContacts.map((contact) => {
              const intel = intelligenceByContact.get(contact.id);
              const isSelected = contact.id === selectedContactId;

              return (
                <div
                  key={contact.id}
                  ref={isSelected ? selectedContactRef : null}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">
                    {fullName(contact)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        intel?.statusClasses || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {intel?.statusLabel || "Unknown"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        intel?.nextActionClasses ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {intel?.nextAction || "—"}
                    </span>
                  </div>

                  {financeTriggeredContactIds.has(contact.id) ? (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Finance-triggered outreach priority
                    </p>
                  ) : null}

                  {selectedContactId === contact.id && selectedContactPatternHint ? (
                    <p className="mt-2 text-xs font-medium text-violet-700">
                      {selectedContactPatternHint}
                    </p>
                  ) : null}
                </div>
              );
            })}

            {visibleFilteredContacts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                No contacts available.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Lists + Segments
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Outreach Universes
              </h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-500">
              {visibleTaggedLists.length} lists
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {visibleTaggedLists.slice(0, 12).map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setSelectedListId(list.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedListId === list.id
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{list.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Owner: {list.default_owner_name || "Unassigned"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${listTagTone(
                      list.tag
                    )}`}
                  >
                    {list.tag}
                  </span>
                </div>
              </button>
            ))}

            {visibleTaggedLists.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                No lists available for this view.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="hidden" aria-hidden="true">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Headphones className="h-4 w-4 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              {demoRole === "general_user" ? "Work Panel" : "Action Panel"}
            </h2>
          </div>

          {!currentFocusContact ? (
            <div className="text-sm text-slate-500">
              Select a contact to begin.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-medium text-slate-900">
                {fullName(currentFocusContact)}
              </p>
              <p className="text-sm text-slate-500">
                {currentFocusContact.phone || "No phone"} ·{" "}
                {currentFocusContact.owner_name || "Unassigned"}
              </p>

              {selectedContactPatternHint ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-violet-900">
                  {selectedContactPatternHint}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChannel("call")}
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    channel === "call"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200"
                  }`}
                >
                  Call
                </button>

                <button
                  onClick={() => setChannel("text")}
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    channel === "text"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200"
                  }`}
                >
                  Text
                </button>
              </div>

              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select result</option>
                {(channel === "call" ? callResults : textResults).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes..."
                rows={5}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />

              <button
                onClick={handleLog}
                disabled={saving}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : demoRole === "general_user"
                  ? "Save & Continue"
                  : "Save & Next"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="hidden" aria-hidden="true">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active Owner Lane
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Viewing outreach for{" "}
              <span className="font-semibold">{ownerFilter || "All Owners"}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {ownerScopedContacts.length} contact
            {ownerScopedContacts.length === 1 ? "" : "s"} in current lane
          </div>
        </div>
      </section>

      {focusMode && (
        <section
          ref={focusSectionRef}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {demoRole === "general_user" ? "Active Work Lane" : "Focus Mode"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {demoRole === "general_user"
                ? "Stay in execution with the currently selected contact."
                : "Stay in execution with the currently selected contact."}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Active Contact</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">
                {currentFocusContact
                  ? fullName(currentFocusContact)
                  : "No contact selected"}
              </p>

              {currentFocusContact &&
              financeTriggeredContactIds.has(currentFocusContact.id) ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Finance Trigger
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-slate-600">
              {currentFocusContact?.phone || "No phone"} ·{" "}
              {currentFocusContact?.owner_name || "Unassigned"}
            </p>

            {selectedContactPatternHint ? (
              <p className="mt-2 text-xs font-medium text-violet-700">
                {selectedContactPatternHint}
              </p>
            ) : null}
          </div>

          <div
            className={`mt-4 grid gap-4 ${
              demoRole === "general_user" ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Zap className="h-4 w-4" />
                Call Streak
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {callStreak}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Completed This Session
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {completedCount}
              </p>
            </div>

            {demoRole !== "general_user" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Focus Progress
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {currentFocusIndex >= 0 ? currentFocusIndex + 1 : 0}
                  <span className="text-base font-medium text-slate-500">
                    {" "}
                    / {financePrioritizedFocusContacts.length}
                  </span>
                </p>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading outreach...</div>}>
      <OutreachPageContent />
    </Suspense>
  );
}
