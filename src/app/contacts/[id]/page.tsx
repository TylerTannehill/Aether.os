"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Landmark,
  ListChecks,
  MessageSquare,
  PhoneCall,
  Printer,
  Package,
  Sparkles,
  Workflow,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { createAutoTaskForOutcome, saveOutreachLog } from "@/lib/data/outreach";
import {
  ContactDonorIntelligence,
  ContributionRecord,
  PledgeRecord,
} from "@/lib/data/types";
import { buildContactDonorIntelligence } from "@/lib/finance/donor-intelligence";

type Contact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  zip?: string | null;
  employer?: string | null;
  occupation?: string | null;
  city?: string | null;
  state?: string | null;
  party?: string | null;
  contact_code?: string | null;
  owner_name?: string | null;
  organization_id?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  donation_total?: number | string | null;
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
  type?: ContactListTag | null;
};

type ContactListMembership = {
  list_id: string;
  lists?: {
    id: string;
    name: string;
    type?: ContactListTag | null;
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

type ContactNote = {
  id: string;
  contact_id: string;
  organization_id?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  note: string;
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

type ContributionDbRow = {
  id: string;
  contact_id: string;
  amount?: number | string | null;
  source?: string | null;
  date?: string | null;
  created_at?: string | null;
};

type PledgeDbRow = {
  id: string;
  contact_id: string;
  amount_pledged?: number | string | null;
  amount_fulfilled?: number | string | null;
  status?: string | null;
  next_follow_up?: string | null;
  created_at?: string | null;
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

type ContributionDraft = {
  amount: string;
  source: ContributionRecord["method"];
  date: string;
};

type PledgeDraft = {
  amount: string;
  status: "pledged" | "follow_up";
  nextFollowUp: string;
};

type ContactListTag = "outreach" | "finance" | "field" | "print" | "volunteer";

type ContactExecutionLink = {
  label: string;
  href: string;
  icon: "outreach" | "finance" | "print" | "lists";
};

type AetherTier = "t1" | "t2" | "t3";

function normalizeAetherTier(value?: string | null): AetherTier {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "t1") return "t1";
  if (normalized === "t2") return "t2";

  return "t3";
}

function canShowFinanceContactProfileSurfaces(tier: AetherTier) {
  return tier !== "t1";
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

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
  return (
    `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() ||
    "Unnamed Contact"
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalizeContributionMethod(
  value?: string | null,
): ContributionRecord["method"] {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("check")) return "check";
  if (normalized.includes("cash")) return "cash";

  return "online";
}

function normalizePledgeStatus(value?: string | null): PledgeRecord["status"] {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "converted" || normalized === "fulfilled") {
    return "converted";
  }

  if (
    normalized === "follow_up" ||
    normalized === "follow-up" ||
    normalized === "follow up"
  ) {
    return "follow_up";
  }

  return "pledged";
}

function mapContributionRow(row: ContributionDbRow): ContributionRecord {
  return {
    id: row.id,
    contact_id: row.contact_id,
    amount: Number(row.amount || 0),
    method: normalizeContributionMethod(row.source),
    date: row.date || row.created_at || "",
    compliant: true,
    employer: null,
    occupation: null,
    notes: row.source ? `Source: ${row.source}` : null,
  };
}

function mapPledgeRow(row: PledgeDbRow): PledgeRecord {
  return {
    id: row.id,
    contact_id: row.contact_id,
    amount: Number(row.amount_pledged || row.amount_fulfilled || 0),
    status: normalizePledgeStatus(row.status),
    created_at: row.created_at || row.next_follow_up || "",
    converted_at:
      normalizePledgeStatus(row.status) === "converted"
        ? row.next_follow_up || null
        : null,
    notes: row.next_follow_up ? `Next follow-up: ${row.next_follow_up}` : null,
  };
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
      nextActionClasses:
        "border border-purple-200 bg-purple-100 text-purple-700",
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

function normalizeOperationalText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCleanupListName(value: string) {
  const normalized = normalizeOperationalText(value);

  return (
    normalized.includes("missing email") ||
    normalized.includes("missing phone") ||
    normalized.includes("missing address") ||
    normalized.includes("cleanup") ||
    normalized.includes("clean up") ||
    normalized.includes("data issue") ||
    normalized.includes("data quality") ||
    normalized.includes("enrichment") ||
    normalized.includes("contact repair") ||
    normalized.includes("bad email") ||
    normalized.includes("bad phone") ||
    normalized.includes("no email") ||
    normalized.includes("no phone")
  );
}

function isPrintMaterialListName(value: string) {
  const normalized = normalizeOperationalText(value);

  if (isCleanupListName(normalized)) return false;

  return (
    normalized.includes("print") ||
    normalized.includes("palm card") ||
    normalized.includes("palmcard") ||
    normalized.includes("parm card") ||
    normalized.includes("door hanger") ||
    normalized.includes("doorhanger") ||
    normalized.includes("yard sign") ||
    normalized.includes("yardsign") ||
    normalized.includes("mailer") ||
    normalized.includes("mail piece") ||
    normalized.includes("direct mail") ||
    normalized.includes("postcard") ||
    normalized.includes("literature") ||
    normalized.includes("lit drop") ||
    normalized.includes("litdrop") ||
    normalized.includes("lit piece") ||
    normalized.includes("walk packet") ||
    normalized.includes("absentee chase")
  );
}

function resolvePrintUseCase(listName: string) {
  const normalized = normalizeOperationalText(listName);

  if (
    normalized.includes("palm card") ||
    normalized.includes("palmcard") ||
    normalized.includes("parm card")
  ) {
    return "Palm cards";
  }

  if (normalized.includes("door hanger") || normalized.includes("doorhanger")) {
    return "Door hangers";
  }

  if (normalized.includes("yard sign") || normalized.includes("yardsign")) {
    return "Yard signs";
  }

  if (
    normalized.includes("mailer") ||
    normalized.includes("direct mail") ||
    normalized.includes("mail piece") ||
    normalized.includes("postcard") ||
    normalized.includes("absentee chase")
  ) {
    return "Mailers";
  }

  if (
    normalized.includes("literature") ||
    normalized.includes("lit drop") ||
    normalized.includes("litdrop") ||
    normalized.includes("lit piece")
  ) {
    return "Literature drop";
  }

  if (normalized.includes("walk packet")) {
    return "Walk packet materials";
  }

  return "Print materials";
}

function isPrintOperationalList(list: List & { tag?: ContactListTag }) {
  const explicitType = String(list.type || "").toLowerCase();
  const normalized = `${list.name || ""} ${list.type || ""}`.toLowerCase();

  if (isCleanupListName(normalized)) return false;
  if (explicitType === "print") return true;

  return isPrintMaterialListName(normalized);
}

function resolveListTag(list: List | string): ContactListTag {
  if (typeof list !== "string") {
    const explicitType = String(list.type || "").toLowerCase();

    if (
      explicitType === "outreach" ||
      explicitType === "finance" ||
      explicitType === "field" ||
      explicitType === "print" ||
      explicitType === "volunteer"
    ) {
      return explicitType as ContactListTag;
    }
  }

  const normalized =
    typeof list === "string" ? list.toLowerCase() : list.name.toLowerCase();

  if (
    normalized.includes("finance") ||
    normalized.includes("donor") ||
    normalized.includes("fundraising")
  ) {
    return "finance";
  }

  if (isPrintMaterialListName(normalized)) {
    return "print";
  }

  if (
    normalized.includes("field") ||
    normalized.includes("turf") ||
    normalized.includes("canvass") ||
    normalized.includes("door") ||
    normalized.includes("walk") ||
    normalized.includes("packet")
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

function isFieldOperationalList(list: List & { tag?: ContactListTag }) {
  const normalized = `${list.name || ""} ${list.type || ""}`.toLowerCase();

  if (list.tag === "field") return true;

  if (
    normalized.includes("field") ||
    normalized.includes("turf") ||
    normalized.includes("canvass") ||
    normalized.includes("door") ||
    normalized.includes("walk") ||
    normalized.includes("packet") ||
    normalized.includes("persuasion") ||
    normalized.includes("turnout") ||
    normalized.includes("universe") ||
    normalized.includes("route") ||
    normalized.includes("lit drop") ||
    normalized.includes("lit-drop") ||
    normalized.includes("literature") ||
    normalized.includes("volunteer") ||
    normalized.includes("follow-up") ||
    normalized.includes("follow up")
  ) {
    return true;
  }

  return false;
}

function listTagClasses(tag: ContactListTag) {
  switch (tag) {
    case "finance":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "field":
      return "border border-sky-200 bg-sky-100 text-sky-700";
    case "print":
      return "border border-violet-200 bg-violet-100 text-violet-700";
    case "volunteer":
      return "border border-purple-200 bg-purple-100 text-purple-700";
    case "outreach":
    default:
      return "border border-amber-200 bg-amber-100 text-amber-800";
  }
}

function fecMatchClasses(
  status?: ContactDonorIntelligence["fec_match_status"] | null,
) {
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

function donorTierClasses(
  tier?: ContactDonorIntelligence["fec_donor_tier"] | null,
) {
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

function formatDonorTier(
  tier?: ContactDonorIntelligence["fec_donor_tier"] | null,
) {
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

function formatFecMatchStatus(
  status?: ContactDonorIntelligence["fec_match_status"] | null,
) {
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
  const matchStatus =
    args.contact?.fec_match_status ?? (directTotal > 0 ? "probable" : "none");
  const confidenceScore =
    args.contact?.fec_confidence_score ?? (directTotal > 0 ? 84 : null);

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
        activePledgeTotal,
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
        lifetimeContributionTotal,
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
        donorIntelligence?.fec_match_status &&
        donorIntelligence.fec_match_status !== "none"
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
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [pledges, setPledges] = useState<PledgeRecord[]>([]);
  const [message, setMessage] = useState("");
  const [contributionMessage, setContributionMessage] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [notesMessage, setNotesMessage] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickActionDraft, setQuickActionDraft] = useState<QuickActionDraft>({
    channel: "call",
    result: quickActionResultOptions.call[0],
    notes: "",
  });
  const [contributionDraft, setContributionDraft] = useState<ContributionDraft>({
    amount: "",
    source: "check",
    date: todayIsoDate(),
  });
  const [contributionSaving, setContributionSaving] = useState(false);
  const [pledgeDraft, setPledgeDraft] = useState<PledgeDraft>({
    amount: "",
    status: "pledged",
    nextFollowUp: todayIsoDate(),
  });
  const [pledgeSaving, setPledgeSaving] = useState(false);
  const [pledgeMessage, setPledgeMessage] = useState("");
  const [quickActionSaving, setQuickActionSaving] = useState(false);
  const [financeExpanded, setFinanceExpanded] = useState(true);
  const [fieldIntelExpanded, setFieldIntelExpanded] = useState(false);
  const [printIntelExpanded, setPrintIntelExpanded] = useState(false);
  const [aetherTier, setAetherTier] = useState<AetherTier>("t3");
  const [currentUserName, setCurrentUserName] = useState("Aether User");
  const [editingContact, setEditingContact] = useState(false);
  const [editForm, setEditForm] = useState<any>({});


  const outreachCallHref = `/dashboard/outreach?contactId=${contactId}&channel=call`;
  const outreachTextHref = `/dashboard/outreach?contactId=${contactId}&channel=text`;
  const outreachDefaultHref = `/dashboard/outreach?contactId=${contactId}`;
  const financeHref = `/dashboard/finance`;
  const financeFocusHref = `/dashboard/finance/focus`;
  const listsHref = `/dashboard/lists`;
  const showFinanceContactProfileSurfaces =
    canShowFinanceContactProfileSurfaces(aetherTier);

  useEffect(() => {
    if (!contactId) return;
    fetchData();
  }, [contactId]);

  useEffect(() => {
    async function loadAetherTierContext() {
      try {
        const response = await fetch("/api/auth/current-context", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) return;

        setAetherTier(
          normalizeAetherTier(data?.organization?.aether_tier)
        );

        setCurrentUserName(
          String(data?.user?.name || "").trim() || "Aether User"
        );
      } catch (error) {
        console.error("Failed to load Aether tier context", error);
      }
    }

    loadAetherTierContext();
  }, []);

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
      .select("id, name, type")
      .order("created_at", { ascending: false });

    const { data: membershipData, error: membershipError } = await supabase
      .from("list_contacts")
      .select("list_id, lists(id, name, type)")
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

    const { data: contributionData, error: contributionError } = await supabase
      .from("contributions")
      .select("id, contact_id, amount, source, date, created_at")
      .eq("contact_id", contactId)
      .order("date", { ascending: false });

    const { data: pledgeData, error: pledgeError } = await supabase
      .from("pledges")
      .select(
        "id, contact_id, amount_pledged, amount_fulfilled, status, next_follow_up, created_at",
      )
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    const { data: contactNoteData, error: contactNoteError } = await supabase
      .from("contact_notes")
      .select(
        "id, contact_id, organization_id, author_id, author_name, note, created_at",
      )
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    if (contactError) {
      setMessage(`Error loading contact: ${contactError.message}`);
    } else {
      setContact(contactData);
      setEditForm({
        first_name: contactData?.first_name || "",
        last_name: contactData?.last_name || "",
        email: contactData?.email || "",
        phone: contactData?.phone || "",
        secondary_phone: contactData?.secondary_phone || "",
        address: contactData?.address || "",
        city: contactData?.city || "",
        state: contactData?.state || "",
        zip: contactData?.zip || "",
        employer: contactData?.employer || "",
        occupation: contactData?.occupation || "",
        owner_name: contactData?.owner_name || "",
      });
      setNotesDraft(String(contactData?.notes || ""));
    }

    if (listError) {
      setMessage(`Error loading lists: ${listError.message}`);
    } else {
      setLists(listData || []);
    }

    if (membershipError) {
      setMessage(`Error loading list memberships: ${membershipError.message}`);
    } else {
      const mappedLists = ((membershipData ?? []) as any[]).flatMap((row) => {
        const linked = Array.isArray(row.lists) ? row.lists[0] : row.lists;
        return linked
          ? [{ id: linked.id, name: linked.name, type: linked.type }]
          : [];
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

    if (contributionError) {
      setMessage(`Error loading contributions: ${contributionError.message}`);
      setContributions([]);
    } else {
      setContributions(
        ((contributionData as ContributionDbRow[]) || []).map(
          mapContributionRow,
        ),
      );
    }

    if (pledgeError) {
      setMessage(`Error loading pledges: ${pledgeError.message}`);
      setPledges([]);
    } else {
      setPledges(((pledgeData as PledgeDbRow[]) || []).map(mapPledgeRow));
    }

    if (contactNoteError) {
      setNotesMessage(`Error loading contact notes: ${contactNoteError.message}`);
      setContactNotes([]);
    } else {
      setContactNotes((contactNoteData as ContactNote[]) || []);
    }

    setLoading(false);
  }

  
  async function saveContactProfileEdits() {
    const { error } = await supabase.from("contacts").update(editForm).eq("id", contactId);
    if (error) {
      setMessage(`Error saving contact: ${error.message}`);
      return;
    }
    setContact((c:any)=> c ? {...c, ...editForm} : c);
    setEditingContact(false);
    setMessage("Contact updated.");
  }

async function addToList() {
    setMessage("");

    if (!selectedListId) {
      setMessage("Please choose a list.");
      return;
    }

    const alreadyInList = contactLists.some(
      (list) => list.id === selectedListId,
    );

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
          contact,
        )}.`,
      );
      await fetchData();
    } catch (error: any) {
      setMessage(
        `Error logging quick action: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setQuickActionSaving(false);
    }
  }

  async function saveContactNotes() {
    if (!contact) return;

    const trimmedNote = notesDraft.trim();

    setNotesMessage("");
    setMessage("");

    if (!trimmedNote) {
      setNotesMessage("Add a note before saving.");
      return;
    }

    setNotesSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const notePayload = {
        contact_id: contactId,
        organization_id: contact.organization_id ?? null,
        author_id: user?.id ?? null,
        author_name: currentUserName,
        note: trimmedNote,
      };

      const { data: insertedNote, error } = await supabase
        .from("contact_notes")
        .insert([notePayload])
        .select(
          "id, contact_id, organization_id, author_id, author_name, note, created_at",
        )
        .single();

      if (error) {
        setNotesMessage(`Note did not save: ${error.message}`);
        return;
      }

      if (insertedNote) {
        setContactNotes((current) => [
          insertedNote as ContactNote,
          ...current,
        ]);
      }

      setNotesDraft("");
      setNotesMessage("Contact note saved.");
    } catch (error: any) {
      setNotesMessage(
        `Note did not save: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setNotesSaving(false);
    }
  }

  async function saveContribution() {
    if (!contact) return;

    const amount = Number(contributionDraft.amount);
    const date = contributionDraft.date || todayIsoDate();

    setMessage("");
    setContributionMessage("");

    if (!Number.isFinite(amount) || amount <= 0) {
      setContributionMessage("Enter a valid contribution amount.");
      return;
    }

    setContributionSaving(true);

    try {
      const contributionPayload = {
        contact_id: contactId,
        amount,
        source: contributionDraft.source,
        date,
        organization_id: contact.organization_id ?? null,
      };

      const { data: insertedContribution, error: insertError } = await supabase
        .from("contributions")
        .insert([contributionPayload])
        .select("id, contact_id, amount, source, date, created_at")
        .single();

      if (insertError) {
        setContributionMessage(
          `Contribution did not save: ${insertError.message}`,
        );
        return;
      }

      const currentDonationTotal = Number(contact.donation_total || 0);
      const nextDonationTotal = currentDonationTotal + amount;

      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          donation_total: nextDonationTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);

      if (updateError) {
        setContributionMessage(
          `Contribution saved, but contact total did not update: ${updateError.message}`,
        );
      } else {
        setContributionMessage(
          `${currency.format(amount)} ${contributionDraft.source} contribution saved.`,
        );
      }

      if (insertedContribution) {
        setContributions((current) => [
          mapContributionRow(insertedContribution as ContributionDbRow),
          ...current,
        ]);
      }

      setContact((current) =>
        current
          ? {
              ...current,
              donation_total: nextDonationTotal,
            }
          : current,
      );

      setContributionDraft({
        amount: "",
        source: "check",
        date: todayIsoDate(),
      });

      await fetchData();
    } catch (error: any) {
      setContributionMessage(
        `Contribution did not save: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setContributionSaving(false);
    }
  }

  
  async function savePledge() {
    if (!contact) return;

    const amount = Number(pledgeDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPledgeMessage("Enter a valid pledge amount.");
      return;
    }

    setPledgeSaving(true);
    setPledgeMessage("");

    try {
      const { error } = await supabase.from("pledges").insert([{
        contact_id: contactId,
        amount_pledged: amount,
        amount_fulfilled: 0,
        status: pledgeDraft.status,
        next_follow_up: pledgeDraft.nextFollowUp || null,
      }]);

      if (error) {
        setPledgeMessage(`Pledge did not save: ${error.message}`);
        return;
      }

      await supabase
        .from("contacts")
        .update({
          pledge_amount: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);

      setPledgeMessage(`Pledge for ${currency.format(amount)} saved.`);
      setPledgeDraft({
        amount: "",
        status: "pledged",
        nextFollowUp: todayIsoDate(),
      });

      await fetchData();
    } finally {
      setPledgeSaving(false);
    }
  }

const availableLists = lists.filter(
    (list) => !contactLists.some((assigned) => assigned.id === list.id),
  );

  const listMembershipSummary = useMemo(() => {
    return contactLists.map((list) => ({
      ...list,
      tag: resolveListTag(list),
    }));
  }, [contactLists]);

  const fieldListMemberships = useMemo(() => {
    return listMembershipSummary.filter((list) => isFieldOperationalList(list));
  }, [listMembershipSummary]);

  const primaryFieldList = useMemo(() => {
    return fieldListMemberships[0] || null;
  }, [fieldListMemberships]);

  const printListMemberships = useMemo(() => {
    return listMembershipSummary.filter((list) => isPrintOperationalList(list));
  }, [listMembershipSummary]);

  const primaryPrintList = useMemo(() => {
    return printListMemberships[0] || null;
  }, [printListMemberships]);

  const printSignal = useMemo(() => {
    const assignedOwner = contact?.owner_name || "Unassigned";
    const primaryUseCase = primaryPrintList
      ? resolvePrintUseCase(primaryPrintList.name)
      : "No print material route";

    if (printListMemberships.length > 0) {
      return {
        status: "Print routed",
        material: primaryUseCase,
        owner: assignedOwner,
        listName: primaryPrintList?.name || "Active print material list",
        note: "This contact is attached to physical print material routing through list membership. Use Print Focus to manage approvals, inventory, and delivery handoff.",
      };
    }

    return {
      status: "No print route",
      material: "Not assigned to a print material list",
      owner: assignedOwner,
      listName: "No print material list",
      note: "Add this contact to a palm card, door hanger, mailer, yard sign, literature drop, walk packet, or print universe list when physical materials apply.",
    };
  }, [
    contact?.owner_name,
    primaryPrintList?.name,
    printListMemberships.length,
  ]);

  const fieldSignal = useMemo(() => {
    const contactCode = contact?.contact_code || "No support code set";
    const assignedOwner = contact?.owner_name || "Unassigned";

    if (fieldListMemberships.length > 0) {
      return {
        status: "Field routed",
        turf: primaryFieldList?.name || "Active field list",
        owner: assignedOwner,
        support: contactCode,
        note: "This contact is attached to field routing through list membership. Use Field Focus to move turf execution and follow-up.",
      };
    }

    return {
      status: "No field route",
      turf: "Not assigned to a field list",
      owner: assignedOwner,
      support: contactCode,
      note: "Add this contact to a Field list when they belong in a turf, canvass packet, door program, or field follow-up lane.",
    };
  }, [
    contact?.contact_code,
    contact?.owner_name,
    fieldListMemberships.length,
    primaryFieldList?.name,
  ]);

  useEffect(() => {
    if (fieldListMemberships.length > 0) {
      setFieldIntelExpanded(true);
    }
  }, [fieldListMemberships.length]);

  useEffect(() => {
    if (printListMemberships.length > 0) {
      setPrintIntelExpanded(true);
    }
  }, [printListMemberships.length]);

  const latestLog = useMemo(() => (logs.length > 0 ? logs[0] : null), [logs]);
  const intelligence = deriveContactStatusAndNextAction(latestLog);

  const contributionHistory = useMemo<ContributionRecord[]>(() => {
    return contributions;
  }, [contributions]);

  const pledgeHistory = useMemo<PledgeRecord[]>(() => {
    return pledges;
  }, [pledges]);

  const financeSummary = useMemo(() => {
    const lifetimeContributionTotal = contributionHistory.reduce(
      (sum, contribution) => sum + contribution.amount,
      0,
    );

    const activePledgeTotal = pledgeHistory
      .filter((pledge) => pledge.status !== "converted")
      .reduce((sum, pledge) => sum + pledge.amount, 0);

    const nonCompliantContributionCount = contributionHistory.filter(
      (contribution) => !contribution.compliant,
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
        (task) => task.status !== "done" && task.status !== "cancelled",
      ).length,
    [tasks],
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
        label: "Open in Print",
        href: "/dashboard/print/focus",
        icon: "print",
      },
      {
        label: "Manage Lists",
        href: listsHref,
        icon: "lists",
      },
    ];

    if (!showFinanceContactProfileSurfaces) {
      return links.filter((link) => link.icon !== "finance");
    }

    return links;
  }, [
    financeHref,
    listsHref,
    outreachDefaultHref,
    showFinanceContactProfileSurfaces,
  ]);

  const prioritySignal = useMemo(
    () =>
      buildContactPrioritySignal({
        contactId,
        latestLog,
        activePledgeTotal: financeSummary.activePledgeTotal,
        lifetimeContributionTotal: financeSummary.lifetimeContributionTotal,
        nonCompliantContributionCount:
          financeSummary.nonCompliantContributionCount,
        openTasksCount,
        listCount: contactLists.length,
        donorIntelligence,
      }),
    [
      contactId,
      latestLog,
      financeSummary,
      openTasksCount,
      contactLists.length,
      donorIntelligence,
    ],
  );

  const signalBreakdown = useMemo(
    () => {
      const signals = buildSignalBreakdown({
        latestLog,
        activePledgeTotal: financeSummary.activePledgeTotal,
        nonCompliantContributionCount:
          financeSummary.nonCompliantContributionCount,
        openTasksCount,
        listCount: contactLists.length,
        donorIntelligence,
      });

      if (!showFinanceContactProfileSurfaces) {
        return signals.filter(
          (signal) => signal.label !== "Finance" && signal.label !== "FEC"
        );
      }

      return signals;
    },
    [
      latestLog,
      financeSummary.activePledgeTotal,
      financeSummary.nonCompliantContributionCount,
      openTasksCount,
      contactLists.length,
      donorIntelligence,
      showFinanceContactProfileSurfaces,
    ],
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
                    Operating profile for identity, outreach signal, list
                    placement, active tasks, finance context, and direct
                    execution on this person.
                  </p>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">Email</p>
                      <p className="mt-1 break-words font-semibold text-slate-900">
                        {contact?.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">Phone</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {contact?.phone || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">Location</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {[contact?.city, contact?.state].filter(Boolean).join(", ") ||
                          "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">Contact Code</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {contact?.contact_code || "—"}
                      </p>
                    </div>
                  </div>
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
                <button
                  onClick={() => setEditingContact((v) => !v)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {editingContact ? "Cancel Edit" : "Edit Contact"}
                </button>
</div>
            </div>

            
{editingContact && (
<div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
  <h3 className="mb-4 text-lg font-semibold">Edit Contact</h3>
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {["first_name","last_name","email","phone","secondary_phone","address","city","state","zip","employer","occupation","owner_name"].map((field)=>(
      <input key={field} value={editForm[field]||""} onChange={(e)=>setEditForm((c:any)=>({...c,[field]:e.target.value}))} placeholder={field.replace("_"," ")} className="rounded-xl border border-slate-300 bg-white px-3 py-2"/>
    ))}
  </div>
  <div className="mt-4">
    <button onClick={saveContactProfileEdits} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Save Contact</button>
  </div>
</div>
)}
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
                      <p className="mt-2 text-sm text-slate-700">
                        {signal.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                      ) : link.icon === "print" ? (
                        <Printer className="h-4 w-4" />
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

                  {showFinanceContactProfileSurfaces ? (
                  <Link
                    href={financeFocusHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Landmark className="h-4 w-4" />
                    Finance Focus
                  </Link>
                  ) : null}

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
                        const nextChannel = e.target
                          .value as QuickActionChannel;
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
                        ),
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
                    {quickActionSaving
                      ? "Logging Action..."
                      : "Log Quick Action"}
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
            <p className="mt-2 text-sm text-slate-500">
              {intelligence.description}
            </p>
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Contact Notes
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Internal notes for this contact
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add timestamped relationship notes, meeting context, donor
                details, local issues, family references, and anything the team
                should remember before working this contact.
              </p>
            </div>

            <button
              type="button"
              onClick={saveContactNotes}
              disabled={notesSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notesSaving ? "Saving Note..." : "Save Note"}
            </button>
          </div>

          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Add a new note for this contact..."
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          />

          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Notes are timestamped and added to this contact record.</p>

            {notesMessage ? (
              <p
                className={
                  notesMessage.includes("did not") ||
                  notesMessage.includes("Error") ||
                  notesMessage.includes("before saving")
                    ? "font-medium text-rose-600"
                    : "font-medium text-emerald-700"
                }
              >
                {notesMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            {contact?.notes ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Legacy Profile Note
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {contact.notes}
                </p>
              </div>
            ) : null}

            {contactNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No contact notes have been added yet.
              </div>
            ) : (
              contactNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {note.author_name || "Aether User"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(note.created_at)}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {note.note}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {showFinanceContactProfileSurfaces ? (
        <section
          id="finance-overview"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
        >
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Finance Intelligence
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Contributions, pledges, and compliance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This section reflects donor activity, pending pledges, and any
                compliance gaps tied to this contact.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={financeHref}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Finance Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setFinanceExpanded((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {financeExpanded ? "Collapse" : "Expand"}
                <ChevronDown
                  className={`h-4 w-4 transition ${
                    financeExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {financeExpanded ? (
            <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Lifetime Contributions
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currency.format(financeSummary.lifetimeContributionTotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Active Pledges
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {currency.format(financeSummary.activePledgeTotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Compliance Issues
              </p>
              <p className="mt-2 text-xl font-semibold text-rose-700">
                {financeSummary.nonCompliantContributionCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Total Records
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {financeSummary.contributionCount + financeSummary.pledgeCount}
              </p>
            
</div>
          </div>

          <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-800">Add Pledge</p>
            <h3 className="mt-1 text-xl font-semibold text-blue-950">
              Record a pledge on this contact
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <input
                type="number"
                placeholder="500.00"
                value={pledgeDraft.amount}
                onChange={(e)=>setPledgeDraft((c)=>({...c,amount:e.target.value}))}
                className="rounded-xl border border-blue-200 bg-white px-3 py-2"
              />
              <select
                value={pledgeDraft.status}
                onChange={(e)=>setPledgeDraft((c)=>({...c,status:e.target.value as any}))}
                className="rounded-xl border border-blue-200 bg-white px-3 py-2"
              >
                <option value="pledged">Pledged</option>
                <option value="follow_up">Follow Up</option>
              </select>
              <input
                type="date"
                value={pledgeDraft.nextFollowUp}
                onChange={(e)=>setPledgeDraft((c)=>({...c,nextFollowUp:e.target.value}))}
                className="rounded-xl border border-blue-200 bg-white px-3 py-2"
              />
              <button
                type="button"
                onClick={savePledge}
                disabled={pledgeSaving}
                className="rounded-xl bg-blue-700 px-4 py-2 text-white"
              >
                {pledgeSaving ? "Saving..." : "Save Pledge"}
              </button>
            </div>

            {pledgeMessage ? (
              <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 text-sm">
                {pledgeMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Add Contribution
                </p>
                <h3 className="mt-1 text-xl font-semibold text-emerald-950">
                  Record a payment on this contact
                </h3>
                <p className="mt-2 max-w-3xl text-sm text-emerald-900/80">
                  Add check, cash, or online contribution activity here. Employer
                  and occupation stay on the contact record, so compliance can
                  remain open until those fields are cleaned up.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={contributionDraft.amount}
                  onChange={(e) =>
                    setContributionDraft((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="250.00"
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Payment Type
                </label>
                <select
                  value={contributionDraft.source}
                  onChange={(e) =>
                    setContributionDraft((current) => ({
                      ...current,
                      source: e.target.value as ContributionRecord["method"],
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                >
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Contribution Date
                </label>
                <input
                  type="date"
                  value={contributionDraft.date}
                  onChange={(e) =>
                    setContributionDraft((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={saveContribution}
                  disabled={contributionSaving}
                  className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                >
                  {contributionSaving ? "Saving..." : "Save Contribution"}
                </button>
              </div>
            </div>

            {contributionMessage ? (
              <div
                className={`mt-4 rounded-2xl border p-4 text-sm font-medium ${
                  contributionMessage.includes("did not") ||
                  contributionMessage.includes("failed")
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-white text-emerald-900"
                }`}
              >
                {contributionMessage}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-xs text-emerald-900">
                This records the payment and updates the contact donation total.
                Compliance fields remain separate so missing employer or occupation
                details can still be handled intentionally.
              </div>
            )}
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
                  This is the first Phase 5 receiving surface. Matching and
                  ingestion will wire into these fields next.
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
                    donorIntelligence.fec_match_status,
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
                <p className="text-xs font-medium text-slate-500">
                  FEC Lifetime
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {currency.format(donorIntelligence.fec_total_given ?? 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">
                  Last FEC Gift
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {donorIntelligence.fec_last_donation_date || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Donor Tier</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${donorTierClasses(
                    donorIntelligence.fec_donor_tier,
                  )}`}
                >
                  {formatDonorTier(donorIntelligence.fec_donor_tier)}
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">
                  Opportunity
                </p>
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
                {contributionHistory.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No contributions are recorded for this contact yet.
                  </div>
                ) : null}

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
                {pledgeHistory.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No pledges are recorded for this contact yet.
                  </div>
                ) : null}

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
                    </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Finance details are collapsed. Expand to view contribution history,
              pledge history, FEC intelligence, and finance entry tools.
            </div>
          )}
</section>

        ) : null}



        <section
          id="field-intelligence"
          className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm lg:p-8"
        >
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-700">
                Field Intelligence
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Turf placement, canvass context, and field follow-up
              </h2>
              <p className="mt-1 text-sm text-sky-900/70">
                Field context is derived from Field-tagged lists, operational
                list names, contact ownership, contact code, and recent
                execution activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/field/focus"
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
              >
                Open Field Focus
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setFieldIntelExpanded((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
              >
                {fieldIntelExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {!fieldIntelExpanded ? (
            <div className="rounded-2xl border border-sky-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {fieldSignal.status}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    fieldListMemberships.length field list
                    {fieldListMemberships.length === 1 ? "" : "s"} attached ·
                    Primary: {fieldSignal.turf}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFieldIntelExpanded(true)}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  Show details
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Field Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {fieldSignal.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {fieldListMemberships.length} field list
                    {fieldListMemberships.length === 1 ? "" : "s"} attached
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Current Turf / List
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {fieldSignal.turf}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Primary field routing surface
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Assigned Canvasser / Owner
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {fieldSignal.owner}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Uses contact owner until dedicated field assignment exists
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Support / Contact Code
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {fieldSignal.support}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Can become support ID / field result later
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-sky-200 bg-white p-4 text-sm text-sky-950">
                {fieldSignal.note}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Field List Memberships
                </p>

                {fieldListMemberships.length === 0 ? (
                  <div className="rounded-2xl border border-sky-200 bg-white p-4 text-sm text-slate-500">
                    No Field or field-adjacent operational lists are currently
                    attached to this contact. Add the contact to a turf, walk
                    packet, persuasion, volunteer, route, universe, or follow-up
                    list below to make the field route visible here.
                  </div>
                ) : null}

                {fieldListMemberships.map((list) => (
                  <div
                    key={`field-${list.id}`}
                    className="flex items-center justify-between rounded-2xl border border-sky-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                        field
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {list.name}
                      </span>
                    </div>

                    <Link
                      href="/dashboard/field/focus"
                      className="text-xs font-medium text-sky-700 hover:underline"
                    >
                      Work in Field Focus
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section
          id="print-intelligence"
          className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm lg:p-8"
        >
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-violet-700">
                Print Intelligence
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Physical materials, print routing, and delivery handoff
              </h2>
              <p className="mt-1 text-sm text-violet-900/70">
                Print context is derived only from physical material lists: palm
                cards, door hangers, mailers, yard signs, postcards, literature
                drops, walk packets, and print universes. Cleanup lists like
                missing email or missing phone are ignored here.
              </p>
            </div>

            <div className="flex shrink-0 flex-row flex-nowrap gap-2">
              <Link
                href="/dashboard/print/focus"
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
              >
                Open Print Focus
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setPrintIntelExpanded((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
              >
                {printIntelExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {!printIntelExpanded ? (
            <div className="rounded-2xl border border-violet-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {printSignal.status}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    printListMemberships.length print material list
                    {printListMemberships.length === 1 ? "" : "s"} attached ·
                    Primary: {printSignal.material}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintIntelExpanded(true)}
                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  Show details
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-violet-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                    Print Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {printSignal.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {printListMemberships.length} print material list
                    {printListMemberships.length === 1 ? "" : "s"} attached
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                    Primary Material
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {printSignal.material}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Physical print use case
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                    Owner / Handoff
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {printSignal.owner}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Uses contact owner until print assignment exists
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                    Primary Print List
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {printSignal.listName}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Main material routing surface
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-4 text-sm text-violet-950">
                {printSignal.note}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Print Material List Memberships
                </p>

                {printListMemberships.length === 0 ? (
                  <div className="rounded-2xl border border-violet-200 bg-white p-4 text-sm text-slate-500">
                    No physical print material lists are currently attached to
                    this contact. Add the contact to a palm card, door hanger,
                    mailer, yard sign, postcard, literature drop, walk packet,
                    or print universe list below to make the print route visible
                    here.
                  </div>
                ) : null}

                {printListMemberships.map((list) => (
                  <div
                    key={`print-${list.id}`}
                    className="flex items-center justify-between rounded-2xl border border-violet-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        print
                      </span>
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {resolvePrintUseCase(list.name)}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {list.name}
                      </span>
                    </div>

                    <Link
                      href="/dashboard/print/focus"
                      className="text-xs font-medium text-violet-700 hover:underline"
                    >
                      Work in Print Focus
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>


        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lists</p>
              <h2 className="text-xl font-semibold text-slate-900">
                List membership and routing
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lists determine how this contact flows through outreach,
                finance, field, and print execution.
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
                        list.tag,
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
                    {list.name} ({resolveListTag(list)})
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

        <section
          id="contact-tasks"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
        >
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
                      task.priority,
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

      </div>
    </div>
  );
}
