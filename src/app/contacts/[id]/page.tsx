"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Landmark,
  ListChecks,
  MessageSquare,
  PhoneCall,
  Sparkles,
  Workflow,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  createAutoTaskForOutcome,
  saveOutreachLog,
} from "@/lib/data/outreach";
import {
  ContactDonorIntelligence,
  ContributionRecord,
  PledgeRecord,
} from "@/lib/data/types";
import {
  buildContactDonorIntelligence,
} from "@/lib/finance/donor-intelligence";

type Contact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  party?: string | null;
  contact_code?: string | null;
  owner_name?: string | null;
  donor_intelligence?: ContactDonorIntelligence | null;
  fec_match_status?: ContactDonorIntelligence["fec_match_status"];
  fec_confidence_score?: ContactDonorIntelligence["fec_confidence_score"];
  fec_total_given?: ContactDonorIntelligence["fec_total_given"];
  fec_last_donation_date?: ContactDonorIntelligence["fec_last_donation_date"];
  fec_recent_activity?: ContactDonorIntelligence["fec_recent_activity"];
  fec_donor_tier?: ContactDonorIntelligence["fec_donor_tier"];
  jackpot_candidate?: ContactDonorIntelligence["jackpot_candidate"];
  jackpot_anomaly_type?: ContactDonorIntelligence["jackpot_anomaly_type"];
  jackpot_reason?: ContactDonorIntelligence["jackpot_reason"];
};

type List = {
  id: string;
  name: string;
};

type ContactListMembership = {
  list_id: string;
  lists?: {
    id: string;
    name: string;
  } | null;
};

type OutreachLog = {
  id: string;
  contact_id: string;
  channel: "call" | "text";
  result: string;
  notes?: string | null;
  created_at?: string | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
};

type ContactPrioritySignal = {
  label: string;
  description: string;
  classes: string;
  actionLabel: string;
  actionHref: string;
};

type QuickActionChannel = "call" | "text";

type QuickActionDraft = {
  channel: QuickActionChannel;
  result: string;
  notes: string;
};

type ContactListTag = "outreach" | "finance" | "field" | "volunteer";

type ContactExecutionLink = {
  label: string;
  href: string;
  icon: "outreach" | "finance" | "lists";
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const quickActionResultOptions: Record<QuickActionChannel, string[]> = {
  call: [
    "positive - pledge",
    "follow up",
    "callback requested",
    "no answer",
    "completed",
  ],
  text: ["positive", "follow up", "responded", "opt out", "completed"],
};

function fullName(contact: Contact | null) {
  if (!contact) return "Contact";
  return `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "Unnamed Contact";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function deriveContactStatusAndNextAction(latestLog: OutreachLog | null) {
  if (!latestLog) {
    return {
      label: "Unreached",
      classes: "border border-slate-200 bg-slate-100 text-slate-700",
      description: "No outreach activity logged yet.",
      nextAction: "Call",
      nextActionClasses: "border border-blue-200 bg-blue-100 text-blue-700",
    };
  }

  const result = latestLog.result.toLowerCase();

  if (
    result.includes("answered") ||
    result.includes("responded") ||
    result.includes("callback") ||
    result.includes("follow up") ||
    result.includes("positive") ||
    result.includes("pledge")
  ) {
    return {
      label: "Engaged",
      classes: "border border-emerald-200 bg-emerald-100 text-emerald-700",
      description: "Recent outreach shows real engagement.",
      nextAction: "Follow Up",
      nextActionClasses: "border border-purple-200 bg-purple-100 text-purple-700",
    };
  }

  if (result.includes("opt out")) {
    return {
      label: "Do Not Contact",
      classes: "border border-rose-200 bg-rose-100 text-rose-700",
      description: "Recent outreach indicates opt-out behavior.",
      nextAction: "Skip",
      nextActionClasses: "border border-slate-200 bg-slate-100 text-slate-500",
    };
  }

  return {
    label: "Attempted",
    classes: "border border-amber-200 bg-amber-100 text-amber-700",
    description: "Outreach has been attempted, but engagement is limited.",
    nextAction: "Retry",
    nextActionClasses: "border border-orange-200 bg-orange-100 text-orange-700",
  };
}

function priorityClasses(priority: Task["priority"]) {
  switch (priority) {
    case "urgent":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    case "high":
      return "bg-orange-100 text-orange-700 border border-orange-200";
    case "medium":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "low":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function resolveListTag(name: string): ContactListTag {
  const normalized = name.toLowerCase();

  if (
    normalized.includes("finance") ||
    normalized.includes("donor") ||
    normalized.includes("fundraising")
  ) {
    return "finance";
  }

  if (
    normalized.includes("field") ||
    normalized.includes("turf") ||
    normalized.includes("canvass") ||
    normalized.includes("door")
  ) {
    return "field";
  }

  if (
    normalized.includes("volunteer") ||
    normalized.includes("phone bank") ||
    normalized.includes("phonebank")
  ) {
    return "volunteer";
  }

  return "outreach";
}

function listTagClasses(tag: ContactListTag) {
  switch (tag) {
    case "finance":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "field":
      return "border border-sky-200 bg-sky-100 text-sky-700";
    case "volunteer":
      return "border border-purple-200 bg-purple-100 text-purple-700";
    case "outreach":
    default:
      return "border border-amber-200 bg-amber-100 text-amber-800";
  }
}

function fecMatchClasses(status?: ContactDonorIntelligence["fec_match_status"] | null) {
  switch (status) {
    case "matched":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "probable":
      return "border border-amber-200 bg-amber-100 text-amber-800";
    case "unresolved":
      return "border border-rose-200 bg-rose-100 text-rose-700";
    case "none":
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function donorTierClasses(tier?: ContactDonorIntelligence["fec_donor_tier"] | null) {
  switch (tier) {
    case "maxed":
      return "border border-purple-200 bg-purple-100 text-purple-700";
    case "major":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "mid":
      return "border border-blue-200 bg-blue-100 text-blue-700";
    case "base":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    case "none":
    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatDonorTier(tier?: ContactDonorIntelligence["fec_donor_tier"] | null) {
  switch (tier) {
    case "maxed":
      return "Maxed";
    case "major":
      return "Major";
    case "mid":
      return "Mid-Level";
    case "base":
      return "Base";
    case "none":
    default:
      return "None";
  }
}

function formatFecMatchStatus(status?: ContactDonorIntelligence["fec_match_status"] | null) {
  switch (status) {
    case "matched":
      return "Matched";
    case "probable":
      return "Probable";
    case "unresolved":
      return "Unresolved";
    case "none":
    default:
      return "No Match";
  }
}

function buildDemoDonorIntelligence(args: {
  contact: Contact | null;
  lifetimeContributionTotal: number;
  activePledgeTotal: number;
  nonCompliantContributionCount: number;
  latestLog: OutreachLog | null;
}): ContactDonorIntelligence {
  const contactIntelligence = args.contact?.donor_intelligence;

  if (contactIntelligence) {
    return contactIntelligence;
  }

  const directTotal = args.lifetimeContributionTotal;
  const fecTotal = Number(args.contact?.fec_total_given ?? directTotal + 2500);
  const lastDonationDate =
    args.contact?.fec_last_donation_date ??
    (directTotal > 0 ? "2026-04-08" : null);
  const matchStatus = args.contact?.fec_match_status ?? (directTotal > 0 ? "probable" : "none");
  const confidenceScore = args.contact?.fec_confidence_score ?? (directTotal > 0 ? 84 : null);

  const donorTier =
    args.contact?.fec_donor_tier ??
    (fecTotal >= 6600
      ? "maxed"
      : fecTotal >= 2500
      ? "major"
      : fecTotal >= 500
      ? "mid"
      : fecTotal > 0
      ? "base"
      : "none");

  const jackpotCandidate =
    Boolean(args.contact?.jackpot_candidate) ||
    (fecTotal >= 2500 && !args.latestLog) ||
    (args.activePledgeTotal > 0 && args.nonCompliantContributionCount > 0);

  const jackpotType =
    args.contact?.jackpot_anomaly_type ??
    (jackpotCandidate
      ? args.activePledgeTotal > 0
        ? "pledge_gap"
        : "high_value_unworked"
      : "none");

  const jackpotReason =
    args.contact?.jackpot_reason ??
    (jackpotCandidate
      ? args.activePledgeTotal > 0
        ? "Active pledge and compliance pressure make this contact worth working now."
        : "High giving capacity is visible, but recent outreach is not."
      : null);

  return {
    fec_match_status: matchStatus,
    fec_confidence_score: confidenceScore,
    fec_total_given: fecTotal,
    fec_last_donation_date: lastDonationDate,
    fec_recent_activity: Boolean(lastDonationDate),
    fec_donor_tier: donorTier,
    jackpot_candidate: jackpotCandidate,
    jackpot_anomaly_type: jackpotType,
    jackpot_reason: jackpotReason,
  };
}

function buildContactPrioritySignal(args: {
  contactId: string;
  latestLog: OutreachLog | null;
  activePledgeTotal: number;
  lifetimeContributionTotal: number;
  nonCompliantContributionCount: number;
  openTasksCount: number;
  listCount: number;
  donorIntelligence?: ContactDonorIntelligence | null;
}) {
  const {
    contactId,
    latestLog,
    activePledgeTotal,
    lifetimeContributionTotal,
    nonCompliantContributionCount,
    openTasksCount,
    listCount,
    donorIntelligence,
  } = args;

  if (donorIntelligence?.jackpot_candidate) {
    return {
      label: "Jackpot Anomaly",
      description:
        donorIntelligence.jackpot_reason ||
        "A high-value donor signal needs attention before the opportunity cools.",
      classes: "border border-yellow-300 bg-yellow-100 text-yellow-900",
      actionLabel: "Open Finance Context",
      actionHref: `#finance-overview`,
    } satisfies ContactPrioritySignal;
  }

  if (activePledgeTotal > 0) {
    return {
      label: "High Priority Donor",
      description: `${currency.format(
        activePledgeTotal
      )} in active pledges requires finance follow-up now.`,
      classes: "border border-amber-200 bg-amber-100 text-amber-800",
      actionLabel: "Open in Finance",
      actionHref: `/dashboard/finance`,
    } satisfies ContactPrioritySignal;
  }

  if (nonCompliantContributionCount > 0) {
    return {
      label: "Compliance Review Needed",
      description: `${nonCompliantContributionCount} finance record${
        nonCompliantContributionCount === 1 ? "" : "s"
      } still need cleanup before this profile is fully clean.`,
      classes: "border border-rose-200 bg-rose-100 text-rose-700",
      actionLabel: "Review Finance Context",
      actionHref: `#finance-overview`,
    } satisfies ContactPrioritySignal;
  }

  if (openTasksCount > 0) {
    return {
      label: "Active Work In Queue",
      description: `${openTasksCount} open task${
        openTasksCount === 1 ? "" : "s"
      } are tied to this contact right now.`,
      classes: "border border-blue-200 bg-blue-100 text-blue-700",
      actionLabel: "Review Tasks",
      actionHref: `#contact-tasks`,
    } satisfies ContactPrioritySignal;
  }

  if (!latestLog) {
    return {
      label: "Needs First Touch",
      description:
        "No outreach activity is logged yet, so this contact still needs a first pass.",
      classes: "border border-slate-200 bg-slate-100 text-slate-700",
      actionLabel: "Call from Outreach",
      actionHref: `/dashboard/outreach?contactId=${contactId}&channel=call`,
    } satisfies ContactPrioritySignal;
  }

  if (lifetimeContributionTotal >= 1000) {
    return {
      label: "Known Donor",
      description: `${currency.format(
        lifetimeContributionTotal
      )} lifetime contribution total makes this contact worth preserving carefully.`,
      classes: "border border-emerald-200 bg-emerald-100 text-emerald-700",
      actionLabel: "Open in Finance",
      actionHref: `/dashboard/finance`,
    } satisfies ContactPrioritySignal;
  }

  if (listCount > 0) {
    return {
      label: "In Active Segments",
      description: `This contact is already placed in ${listCount} list${
        listCount === 1 ? "" : "s"
      }, so list routing should stay aligned with execution.`,
      classes: "border border-purple-200 bg-purple-100 text-purple-700",
      actionLabel: "View Lists",
      actionHref: "/dashboard/lists",
    } satisfies ContactPrioritySignal;
  }

  return {
    label: "Stable Contact Record",
    description:
      "The profile is usable and current, but there is no urgent pressure on this contact right now.",
    classes: "border border-slate-200 bg-slate-100 text-slate-700",
    actionLabel: "Back to Contacts",
    actionHref: "/dashboard/contacts",
  } satisfies ContactPrioritySignal;
}

function buildSignalBreakdown(args: {
  latestLog: OutreachLog | null;
  activePledgeTotal: number;
  nonCompliantContributionCount: number;
  openTasksCount: number;
  listCount: number;
  donorIntelligence?: ContactDonorIntelligence | null;
}) {
  const {
    latestLog,
    activePledgeTotal,
    nonCompliantContributionCount,
    openTasksCount,
    listCount,
    donorIntelligence,
  } = args;

  return [
    {
      label: "Outreach",
      value: latestLog
        ? `Latest result: ${latestLog.result}`
        : "No outreach activity logged yet",
    },
    {
      label: "Finance",
      value:
        activePledgeTotal > 0
          ? `${currency.format(activePledgeTotal)} active pledges`
          : nonCompliantContributionCount > 0
            ? `${nonCompliantContributionCount} compliance issue${
                nonCompliantContributionCount === 1 ? "" : "s"
              }`
            : "No urgent finance pressure",
    },
    {
      label: "Tasks",
      value:
        openTasksCount > 0
          ? `${openTasksCount} open task${openTasksCount === 1 ? "" : "s"}`
          : "No open tasks on this contact",
    },
    {
      label: "Lists",
      value:
        listCount > 0
          ? `Present in ${listCount} active list${listCount === 1 ? "" : "s"}`
          : "No list memberships yet",
    },
    {
      label: "FEC",
      value:
        donorIntelligence?.fec_match_status && donorIntelligence.fec_match_status !== "none"
          ? `${formatFecMatchStatus(donorIntelligence.fec_match_status)}${
              donorIntelligence.fec_confidence_score
                ? ` · ${donorIntelligence.fec_confidence_score}%`
                : ""
            }`
          : "No FEC match yet",
    },
  ];
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params?.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [contactLists, setContactLists] = useState<List[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickActionDraft, setQuickActionDraft] = useState<QuickActionDraft>({
    channel: "call",
    result: quickActionResultOptions.call[0],
    notes: "",
  });
  const [quickActionSaving, setQuickActionSaving] = useState(false);

  const outreachCallHref = `/dashboard/outreach?contactId=${contactId}&channel=call`;
  const outreachTextHref = `/dashboard/outreach?contactId=${contactId}&channel=text`;
  const outreachDefaultHref = `/dashboard/outreach?contactId=${contactId}`;
  const financeHref = `/dashboard/finance`;
  const financeFocusHref = `/dashboard/finance/focus`;
  const listsHref = `/dashboard/lists`;
    useEffect(() => {
    if (!contactId) return;
    fetchData();
  }, [contactId]);

  async function fetchData() {
    setLoading(true);
    setMessage("");

    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    const { data: listData, error: listError } = await supabase
      .from("lists")
      .select("id, name")
      .order("created_at", { ascending: false });

    const { data: membershipData, error: membershipError } = await supabase
      .from("list_contacts")
      .select("list_id, lists(id, name)")
      .eq("contact_id", contactId);

    const { data: logData, error: logError } = await supabase
      .from("outreach_logs")
      .select("id, contact_id, channel, result, notes, created_at")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, due_date")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    if (contactError) {
      setMessage(`Error loading contact: ${contactError.message}`);
    } else {
      setContact(contactData);
    }

    if (listError) {
      setMessage(`Error loading lists: ${listError.message}`);
    } else {
      setLists(listData || []);
    }

    if (membershipError) {
      setMessage(`Error loading list memberships: ${membershipError.message}`);
    } else {
   const mappedLists =
  ((membershipData ?? []) as any[]).flatMap((row) => {
    const linked = Array.isArray(row.lists) ? row.lists[0] : row.lists;
    return linked ? [{ id: linked.id, name: linked.name }] : [];
  });

      setContactLists(mappedLists);
    }

    if (logError) {
      setMessage(`Error loading outreach history: ${logError.message}`);
    } else {
      setLogs((logData as OutreachLog[]) || []);
    }

    if (taskError) {
      setMessage(`Error loading tasks: ${taskError.message}`);
    } else {
      setTasks((taskData as Task[]) || []);
    }

    setLoading(false);
  }

  async function addToList() {
    setMessage("");

    if (!selectedListId) {
      setMessage("Please choose a list.");
      return;
    }

    const alreadyInList = contactLists.some((list) => list.id === selectedListId);

    if (alreadyInList) {
      setMessage("This contact is already in that list.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("list_contacts").insert([
      {
        list_id: selectedListId,
        contact_id: contactId,
      },
    ]);

    setSaving(false);

    if (error) {
      setMessage(`Error adding to list: ${error.message}`);
      return;
    }

    setSelectedListId("");
    setMessage("Contact added to list.");
    fetchData();
  }

  async function removeFromList(listId: string) {
    setMessage("");
    setSaving(true);

    const { error } = await supabase
      .from("list_contacts")
      .delete()
      .eq("contact_id", contactId)
      .eq("list_id", listId);

    setSaving(false);

    if (error) {
      setMessage(`Error removing from list: ${error.message}`);
      return;
    }

    setMessage("Contact removed from list.");
    fetchData();
  }

  async function completeTask(taskId: string) {
    setMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      setMessage(`Error completing task: ${error.message}`);
      return;
    }

    setMessage("Task marked complete.");
    fetchData();
  }

  async function runQuickAction() {
    if (!contact) return;

    setMessage("");
    setQuickActionSaving(true);

    try {
      await saveOutreachLog({
        contactId,
        listId: null,
        channel: quickActionDraft.channel,
        result: quickActionDraft.result,
        notes: quickActionDraft.notes.trim() || null,
      });

      await createAutoTaskForOutcome({
        contactId,
        listId: null,
        channel: quickActionDraft.channel,
        result: quickActionDraft.result,
        contactName: fullName(contact),
        listName: "Contact Quick Action",
        ownerName: contact.owner_name || null,
      });

      setQuickActionDraft((current) => ({
        ...current,
        notes: "",
      }));
      setMessage(
        `${quickActionDraft.channel === "call" ? "Call" : "Text"} outcome logged for ${fullName(
          contact
        )}.`
      );
      await fetchData();
    } catch (error: any) {
      setMessage(
        `Error logging quick action: ${error?.message || "Unknown error"}`
      );
    } finally {
      setQuickActionSaving(false);
    }
  }

  const availableLists = lists.filter(
    (list) => !contactLists.some((assigned) => assigned.id === list.id)
  );

  const listMembershipSummary = useMemo(() => {
    return contactLists.map((list) => ({
      ...list,
      tag: resolveListTag(list.name),
    }));
  }, [contactLists]);

  const latestLog = useMemo(() => (logs.length > 0 ? logs[0] : null), [logs]);
  const intelligence = deriveContactStatusAndNextAction(latestLog);

  const contributionHistory = useMemo<ContributionRecord[]>(() => {
    if (!contact?.id) return [];

    return [
      {
        id: "ctrb-1",
        contact_id: contact.id,
        amount: 2500,
        method: "online",
        date: "2026-04-01",
        compliant: true,
        employer: "Mitchell Advisory",
        occupation: "Consultant",
        notes: "High-capacity contribution",
      },
      {
        id: "ctrb-2",
        contact_id: contact.id,
        amount: 1000,
        method: "check",
        date: "2026-04-08",
        compliant: false,
        employer: null,
        occupation: null,
        notes: "Missing employer / occupation",
      },
    ];
  }, [contact?.id]);

  const pledgeHistory = useMemo<PledgeRecord[]>(() => {
    if (!contact?.id) return [];

    return [
      {
        id: "plg-1",
        contact_id: contact.id,
        amount: 3200,
        status: "pledged",
        created_at: "2026-04-04",
        converted_at: null,
        notes: "Needs follow-up to collect pledge",
      },
    ];
  }, [contact?.id]);

  const financeSummary = useMemo(() => {
    const lifetimeContributionTotal = contributionHistory.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );

    const activePledgeTotal = pledgeHistory
      .filter((pledge) => pledge.status !== "converted")
      .reduce((sum, pledge) => sum + pledge.amount, 0);

    const nonCompliantContributionCount = contributionHistory.filter(
      (contribution) => !contribution.compliant
    ).length;

    return {
      lifetimeContributionTotal,
      activePledgeTotal,
      contributionCount: contributionHistory.length,
      pledgeCount: pledgeHistory.length,
      nonCompliantContributionCount,
    };
  }, [contributionHistory, pledgeHistory]);

  const donorIntelligence = useMemo(() => {
    return buildContactDonorIntelligence({
      contact,
      contributionHistory,
      pledgeHistory,
      latestLog,
    });
  }, [contact, contributionHistory, pledgeHistory, latestLog]);

  const openTasksCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== "done" && task.status !== "cancelled"
      ).length,
    [tasks]
  );

  const executionLinks = useMemo<ContactExecutionLink[]>(() => {
    const links: ContactExecutionLink[] = [
      {
        label: "Open in Outreach",
        href: outreachDefaultHref,
        icon: "outreach",
      },
      {
        label: "Open in Finance",
        href: financeHref,
        icon: "finance",
      },
      {
        label: "Manage Lists",
        href: listsHref,
        icon: "lists",
      },
    ];

    return links;
  }, [financeHref, listsHref, outreachDefaultHref]);

  const prioritySignal = useMemo(
    () =>
      buildContactPrioritySignal({
        contactId,
        latestLog,
        activePledgeTotal: financeSummary.activePledgeTotal,
        lifetimeContributionTotal: financeSummary.lifetimeContributionTotal,
        nonCompliantContributionCount: financeSummary.nonCompliantContributionCount,
        openTasksCount,
        listCount: contactLists.length,
        donorIntelligence,
      }),
    [contactId, latestLog, financeSummary, openTasksCount, contactLists.length, donorIntelligence]
  );

  const signalBreakdown = useMemo(
    () =>
      buildSignalBreakdown({
        latestLog,
        activePledgeTotal: financeSummary.activePledgeTotal,
        nonCompliantContributionCount: financeSummary.nonCompliantContributionCount,
        openTasksCount,
        listCount: contactLists.length,
        donorIntelligence,
      }),
    [
      latestLog,
      financeSummary.activePledgeTotal,
      financeSummary.nonCompliantContributionCount,
      openTasksCount,
      contactLists.length,
      donorIntelligence,
    ]
  );

  useEffect(() => {
    setQuickActionDraft((current) => {
      const nextResult = quickActionResultOptions[current.channel][0];

      if (quickActionResultOptions[current.channel].includes(current.result)) {
        return current;
      }

      return {
        ...current,
        result: nextResult,
      };
    });
  }, []);
    if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Loading contact...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Contact Profile
                </p>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                    {fullName(contact)}
                  </h1>
                  <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                    Operating profile for identity, outreach signal, list placement,
                    active tasks, finance context, and direct execution on this person.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/outreach"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Outreach
                </Link>

                <Link
                  href="/dashboard/contacts"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Contacts
                </Link>

                <Link
                  href={outreachDefaultHref}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Open in Outreach
                </Link>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                      <Sparkles className="h-3.5 w-3.5" />
                      Why This Contact Matters
                    </div>

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${prioritySignal.classes}`}
                      >
                        {prioritySignal.label}
                      </span>
                    </div>

                    <p className="mt-3 max-w-2xl text-sm text-amber-900/80">
                      {prioritySignal.description}
                    </p>
                  </div>

                  <Link
                    href={prioritySignal.actionHref}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-700"
                  >
                    {prioritySignal.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {signalBreakdown.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-2xl border border-amber-200 bg-white p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {signal.label}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">{signal.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {executionLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-amber-50"
                    >
                      {link.icon === "outreach" ? (
                        <PhoneCall className="h-4 w-4" />
                      ) : link.icon === "finance" ? (
                        <Landmark className="h-4 w-4" />
                      ) : (
                        <ListChecks className="h-4 w-4" />
                      )}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-500">
                    Quick Execution
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    href={outreachCallHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Call
                  </Link>

                  <Link
                    href={outreachTextHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Text
                  </Link>

                  <Link
                    href={financeFocusHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Landmark className="h-4 w-4" />
                    Finance Focus
                  </Link>

                  <a
                    href="#contact-tasks"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Review Tasks
                  </a>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-900">
                    Log Action Here
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={quickActionDraft.channel}
                      onChange={(e) => {
                        const nextChannel = e.target.value as QuickActionChannel;
                        setQuickActionDraft({
                          channel: nextChannel,
                          result: quickActionResultOptions[nextChannel][0],
                          notes: quickActionDraft.notes,
                        });
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                    >
                      <option value="call">Call</option>
                      <option value="text">Text</option>
                    </select>

                    <select
                      value={quickActionDraft.result}
                      onChange={(e) =>
                        setQuickActionDraft((current) => ({
                          ...current,
                          result: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                    >
                      {quickActionResultOptions[quickActionDraft.channel].map(
                        (option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <textarea
                    value={quickActionDraft.notes}
                    onChange={(e) =>
                      setQuickActionDraft((current) => ({
                        ...current,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add note for this outreach action..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                  />

                  <button
                    onClick={runQuickAction}
                    disabled={quickActionSaving}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {quickActionSaving ? "Logging Action..." : "Log Quick Action"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Current Status</p>
            <div className="mt-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${intelligence.classes}`}
              >
                {intelligence.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{intelligence.description}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Next Action</p>
            <div className="mt-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${intelligence.nextActionClasses}`}
              >
                {intelligence.nextAction}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Derived from latest outreach signal
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Last Contact</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {formatDateTime(latestLog?.created_at)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {latestLog?.result || "No outreach logged yet"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Open Tasks</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {openTasksCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Outstanding work tied to this contact
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Lists Assigned</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {contactLists.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Current list memberships
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Email</p>
            <p className="mt-3 break-words text-lg font-semibold text-slate-900">
              {contact?.email || "—"}
            </p>
            <p className="mt-2 text-sm text-slate-500">Primary email record</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Phone</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {contact?.phone || "—"}
            </p>
            <p className="mt-2 text-sm text-slate-500">Primary phone record</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Location</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {[contact?.city, contact?.state].filter(Boolean).join(", ") || "—"}
            </p>
            <p className="mt-2 text-sm text-slate-500">Geographic reference</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Contact Code</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {contact?.contact_code || "—"}
            </p>
            <p className="mt-2 text-sm text-slate-500">Internal contact identity</p>
          </div>
        </section>
                <section id="finance-overview" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Finance Context</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Contributions, pledges, and compliance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This section reflects donor activity, pending pledges, and any compliance gaps tied to this contact.
              </p>
            </div>

            <Link
              href={financeHref}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Open Finance Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Lifetime Contributions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currency.format(financeSummary.lifetimeContributionTotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Active Pledges</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currency.format(financeSummary.activePledgeTotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Compliance Issues</p>
              <p className="mt-2 text-xl font-semibold text-rose-700">
                {financeSummary.nonCompliantContributionCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Total Records</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {financeSummary.contributionCount + financeSummary.pledgeCount}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  FEC Intelligence
                </p>
                <h3 className="mt-1 text-xl font-semibold text-emerald-950">
                  External donor signal attached to this contact
                </h3>
                <p className="mt-2 max-w-3xl text-sm text-emerald-900/80">
                  This is the first Phase 5 receiving surface. Matching and ingestion
                  will wire into these fields next.
                </p>
              </div>

              {donorIntelligence.jackpot_candidate ? (
                <span className="inline-flex rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-900">
                  Jackpot Anomaly
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">FEC Match</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${fecMatchClasses(
                    donorIntelligence.fec_match_status
                  )}`}
                >
                  {formatFecMatchStatus(donorIntelligence.fec_match_status)}
                </span>
                <p className="mt-2 text-xs text-slate-500">
                  {donorIntelligence.fec_confidence_score
                    ? `${donorIntelligence.fec_confidence_score}% confidence`
                    : "Awaiting match"}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">FEC Lifetime</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {currency.format(donorIntelligence.fec_total_given ?? 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Last FEC Gift</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {donorIntelligence.fec_last_donation_date || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Donor Tier</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${donorTierClasses(
                    donorIntelligence.fec_donor_tier
                  )}`}
                >
                  {formatDonorTier(donorIntelligence.fec_donor_tier)}
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Opportunity</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {donorIntelligence.jackpot_candidate
                    ? "Review now"
                    : donorIntelligence.fec_recent_activity
                    ? "Recently active"
                    : "No active anomaly"}
                </p>
              </div>
            </div>

            {donorIntelligence.jackpot_reason ? (
              <div className="mt-4 rounded-2xl border border-yellow-300 bg-yellow-100 p-4 text-sm text-yellow-950">
                <span className="font-semibold">Jackpot read:</span>{" "}
                {donorIntelligence.jackpot_reason}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Contribution History
              </h3>

              <div className="mt-3 space-y-2">
                {contributionHistory.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">
                        {currency.format(c.amount)}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          c.compliant
                            ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                            : "border border-rose-200 bg-rose-100 text-rose-700"
                        }`}
                      >
                        {c.compliant ? "Compliant" : "Missing Info"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {c.method} · {c.date}
                    </p>

                    {!c.compliant && (
                      <p className="mt-1 text-xs text-rose-600">
                        Employer and occupation required for compliance
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Pledge History
              </h3>

              <div className="mt-3 space-y-2">
                {pledgeHistory.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">
                        {currency.format(p.amount)}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          p.status === "converted"
                            ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                            : "border border-amber-200 bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Created: {p.created_at}
                    </p>

                    {p.status !== "converted" && (
                      <p className="mt-1 text-xs text-amber-700">
                        Needs follow-up to convert pledge
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact-tasks" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tasks</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Work tied to this contact
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track tasks and close out work as it gets completed.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {task.description}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {task.due_date ? `Due: ${task.due_date}` : "No due date"}
                  </p>

                  {task.status !== "done" && task.status !== "cancelled" ? (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600">Completed</span>
                  )}
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No tasks assigned to this contact.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lists</p>
              <h2 className="text-xl font-semibold text-slate-900">
                List membership and routing
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lists determine how this contact flows through outreach, finance, and field execution.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 space-y-2">
              {listMembershipSummary.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${listTagClasses(
                        list.tag
                      )}`}
                    >
                      {list.tag}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {list.name}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromList(list.id)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {contactLists.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  This contact is not assigned to any lists.
                </div>
              )}
            </div>

            <div className="w-full max-w-xs space-y-2">
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select list</option>
                {availableLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>

              <button
                onClick={addToList}
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Add to List
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}