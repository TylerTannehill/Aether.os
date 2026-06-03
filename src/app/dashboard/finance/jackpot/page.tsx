"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Crown,
  FileSpreadsheet,
  HandCoins,
  PhoneCall,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type JackpotCategory =
  | "pledge_conversion"
  | "underworked_major"
  | "hidden_capacity"
  | "reengagement";

type PaymentMethod = "check" | "cash" | "online";

type JackpotOpportunity = {
  id: string;
  contactName: string;
  opportunityScore: number;
  latentValue: number;
  contributionTotal: number;
  pledgeTotal: number;
  category: JackpotCategory;
  headline: string;
  whySurfaced: string[];
  recommendedAction: string;
  suggestedAsk: string;
  contactHref: string;
  contact: JackpotDbContact;
};

type JackpotDbContact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  organization_id?: string | null;
  fec_match_status?: "matched" | "probable" | "unresolved" | "none" | null;
  fec_confidence_score?: number | null;
  fec_total_given?: number | string | null;
  fec_last_donation_date?: string | null;
  fec_recent_activity?: boolean | null;
  fec_donor_tier?: "none" | "base" | "mid" | "major" | "maxed" | null;
  jackpot_candidate?: boolean | null;
  jackpot_anomaly_type?:
    | "dormant_high_value_donor"
    | "recent_external_giving"
    | "high_value_unworked"
    | "pledge_gap"
    | "compliance_blocked"
    | "none"
    | null;
  jackpot_reason?: string | null;
  pledge_amount?: number | string | null;
  donation_total?: number | string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type ContributionRow = {
  id: string;
  contact_id?: string | null;
  amount?: number | string | null;
  source?: string | null;
  date?: string | null;
  created_at?: string | null;
};

type PledgeRow = {
  id: string;
  contact_id?: string | null;
  amount_pledged?: number | string | null;
  amount_fulfilled?: number | string | null;
  status?: string | null;
  next_follow_up?: string | null;
  created_at?: string | null;
};

type JackpotActionRow = {
  id: string;
  contact_id?: string | null;
  organization_id?: string | null;
  action_type?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function getActiveOrganizationId() {
  const response = await fetch("/api/auth/current-context", {
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Unable to resolve active campaign context.");
  }

  const organizationId =
    payload?.organization?.id ||
    payload?.membership?.organization_id ||
    null;

  if (!organizationId) {
    throw new Error("No active campaign selected.");
  }

  return organizationId;
}

function contactName(contact: JackpotDbContact) {
  const name =
    contact.full_name ||
    `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();

  return name || contact.email || "Unnamed Contact";
}

function getContributionTotal(
  contact: JackpotDbContact,
  contributionsByContact: Map<string, number>,
) {
  return Math.max(
    toNumber(contact.donation_total),
    contributionsByContact.get(contact.id) ?? 0,
  );
}

function getPledgeTotal(contact: JackpotDbContact, pledgesByContact: Map<string, number>) {
  return Math.max(toNumber(contact.pledge_amount), pledgesByContact.get(contact.id) ?? 0);
}

function getLatentValue(input: {
  contact: JackpotDbContact;
  contributionTotal: number;
  pledgeTotal: number;
}) {
  const fecTotal = toNumber(input.contact.fec_total_given);

  const bestKnownValue = Math.max(
    input.contributionTotal,
    input.pledgeTotal,
    fecTotal,
    0,
  );

  if (input.pledgeTotal > 0) return Math.max(bestKnownValue, input.pledgeTotal);

  if (input.contact.fec_donor_tier === "maxed") return Math.max(bestKnownValue, 6600);
  if (input.contact.fec_donor_tier === "major") return Math.max(bestKnownValue, 2500);
  if (input.contact.fec_donor_tier === "mid") return Math.max(bestKnownValue, 1000);
  if (input.contact.fec_donor_tier === "base") return Math.max(bestKnownValue, 500);

  if (input.contributionTotal > 0) return Math.max(bestKnownValue, input.contributionTotal);

  return bestKnownValue;
}

function getJackpotCategory(input: {
  contact: JackpotDbContact;
  contributionTotal: number;
  pledgeTotal: number;
}): JackpotCategory {
  if (
    input.pledgeTotal > 0 ||
    input.contact.jackpot_anomaly_type === "pledge_gap"
  ) {
    return "pledge_conversion";
  }

  if (
    input.contact.jackpot_anomaly_type === "high_value_unworked" ||
    input.contact.fec_donor_tier === "major" ||
    input.contact.fec_donor_tier === "maxed" ||
    input.contributionTotal >= 1000
  ) {
    return "underworked_major";
  }

  if (
    input.contact.jackpot_anomaly_type === "recent_external_giving" ||
    input.contact.fec_recent_activity
  ) {
    return "hidden_capacity";
  }

  return "reengagement";
}

function getOpportunityScore(input: {
  contact: JackpotDbContact;
  latentValue: number;
  contributionTotal: number;
  pledgeTotal: number;
  workedRecently: boolean;
}) {
  let score = 40;

  if (input.pledgeTotal > 0) score += 25;
  if (input.contributionTotal > 0) score += 15;
  if (input.contact.jackpot_candidate) score += 15;
  if (input.contact.fec_recent_activity) score += 5;
  if (input.contact.fec_match_status === "matched") score += 5;
  if (input.contact.fec_match_status === "probable") score += 3;

  if (input.latentValue >= 6600) score += 12;
  else if (input.latentValue >= 2500) score += 9;
  else if (input.latentValue >= 1000) score += 6;
  else if (input.latentValue >= 500) score += 3;

  const confidence = toNumber(input.contact.fec_confidence_score);
  if (confidence > 0) {
    score += Math.min(5, Math.round(confidence / 20));
  }

  if (input.workedRecently) score -= 20;

  return Math.min(99, Math.max(1, score));
}

function getHeadline(category: JackpotCategory) {
  if (category === "pledge_conversion") {
    return "Open pledge value is sitting close enough to work now.";
  }

  if (category === "underworked_major") {
    return "Major donor capacity is visible and should not wait in normal volume.";
  }

  if (category === "hidden_capacity") {
    return "External donor signal suggests this contact may be warmer than the list shows.";
  }

  return "Dormant or underworked donor relationship may be ready for reactivation.";
}

function getSuggestedAsk(input: {
  contact: JackpotDbContact;
  latentValue: number;
  contributionTotal: number;
  pledgeTotal: number;
}) {
  if (input.pledgeTotal > 0) {
    return `Confirm ${currency.format(input.pledgeTotal)} pledge`;
  }

  if (input.contact.fec_donor_tier === "maxed") {
    return "Protect max-out relationship";
  }

  if (input.latentValue >= 6600) return "Test $6,600 max-out path";
  if (input.latentValue >= 2500) return `Prepare ${currency.format(input.latentValue)} ask`;
  if (input.latentValue >= 500) {
    return `Reopen with ${currency.format(Math.max(input.latentValue, 1000))} ask`;
  }

  return "Prepare starter finance ask";
}

function buildWhySurfaced(input: {
  contact: JackpotDbContact;
  contributionTotal: number;
  pledgeTotal: number;
}) {
  const reasons: string[] = [];

  if (input.pledgeTotal > 0) {
    reasons.push(`${currency.format(input.pledgeTotal)} open pledge is still available.`);
  }

  if (input.contributionTotal > 0) {
    reasons.push(`${currency.format(input.contributionTotal)} in campaign contributions is already recorded.`);
  }

  if (input.contact.jackpot_reason) {
    reasons.push(input.contact.jackpot_reason);
  }

  if (input.contact.fec_donor_tier && input.contact.fec_donor_tier !== "none") {
    reasons.push(`${input.contact.fec_donor_tier.replace("_", " ")} donor tier is visible.`);
  }

  if (input.contact.fec_recent_activity) {
    reasons.push("Recent FEC activity suggests the donor is warm.");
  }

  if (input.contact.fec_match_status === "matched" || input.contact.fec_match_status === "probable") {
    reasons.push(`FEC match status is ${input.contact.fec_match_status}.`);
  }

  if (toNumber(input.contact.fec_total_given) > 0) {
    reasons.push(`${currency.format(toNumber(input.contact.fec_total_given))} in FEC giving is visible.`);
  }

  if (!reasons.length) {
    reasons.push("Contact has finance signal fields available for review.");
  }

  return reasons.slice(0, 4);
}

function buildRecommendedAction(category: JackpotCategory) {
  if (category === "pledge_conversion") {
    return "Call now, collect what is available, and record the contribution or pledge outcome.";
  }

  if (category === "underworked_major") {
    return "Work this contact directly from Jackpot or add them into the finance call queue.";
  }

  if (category === "hidden_capacity") {
    return "Open contact context, prepare a higher ask, and log the outcome.";
  }

  return "Reopen the relationship, test a starter ask, and decide whether to keep them in finance rotation.";
}

function categoryLabel(category: JackpotCategory) {
  switch (category) {
    case "pledge_conversion":
      return "Pledge Conversion";
    case "underworked_major":
      return "Underworked Major";
    case "hidden_capacity":
      return "Hidden Capacity";
    case "reengagement":
    default:
      return "Re-Engagement";
  }
}

function categoryTone(category: JackpotCategory) {
  switch (category) {
    case "pledge_conversion":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "underworked_major":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "hidden_capacity":
      return "border-purple-200 bg-purple-100 text-purple-700";
    case "reengagement":
    default:
      return "border-sky-200 bg-sky-100 text-sky-700";
  }
}

function scoreTone(score: number) {
  if (score >= 90) return "text-rose-700";
  if (score >= 80) return "text-amber-700";
  return "text-slate-700";
}

function actionStatusForContact(actions: JackpotActionRow[], contactId: string) {
  return actions
    .filter((action) => action.contact_id === contactId)
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))[0] ?? null;
}

function wasWorkedRecently(action?: JackpotActionRow | null) {
  if (!action) return false;
  if (action.status !== "worked") return false;

  const value = action.updated_at || action.created_at;
  if (!value) return false;

  const workedAt = new Date(value).getTime();
  if (Number.isNaN(workedAt)) return false;

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - workedAt < sevenDays;
}

function buildOpportunity(input: {
  contact: JackpotDbContact;
  contributionTotal: number;
  pledgeTotal: number;
  workedRecently: boolean;
}): JackpotOpportunity {
  const category = getJackpotCategory(input);
  const latentValue = getLatentValue(input);

  return {
    id: input.contact.id,
    contactName: contactName(input.contact),
    opportunityScore: getOpportunityScore({
      contact: input.contact,
      latentValue,
      contributionTotal: input.contributionTotal,
      pledgeTotal: input.pledgeTotal,
      workedRecently: input.workedRecently,
    }),
    latentValue,
    contributionTotal: input.contributionTotal,
    pledgeTotal: input.pledgeTotal,
    category,
    headline: getHeadline(category),
    whySurfaced: buildWhySurfaced(input),
    recommendedAction: buildRecommendedAction(category),
    suggestedAsk: getSuggestedAsk({
      contact: input.contact,
      latentValue,
      contributionTotal: input.contributionTotal,
      pledgeTotal: input.pledgeTotal,
    }),
    contactHref: `/dashboard/contacts/${input.contact.id}`,
    contact: input.contact,
  };
}

export default function FinanceJackpotQueuePage() {
  const [jackpotOpportunities, setJackpotOpportunities] = useState<
    JackpotOpportunity[]
  >([]);
  const [actions, setActions] = useState<JackpotActionRow[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [activeOpportunityId, setActiveOpportunityId] = useState<string | null>(
    null,
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  const [paymentDate, setPaymentDate] = useState(todayIsoDate());
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [pledgeFollowUp, setPledgeFollowUp] = useState(todayIsoDate());
  const [actionNotes, setActionNotes] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function loadJackpotOpportunities() {
    try {
      setLoading(true);
      setMessage("");

      const activeOrganizationId = await getActiveOrganizationId();
      setOrganizationId(activeOrganizationId);

      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select(
          "id, first_name, last_name, full_name, email, phone, city, state, organization_id, fec_match_status, fec_confidence_score, fec_total_given, fec_last_donation_date, fec_recent_activity, fec_donor_tier, jackpot_candidate, jackpot_anomaly_type, jackpot_reason, pledge_amount, donation_total, updated_at, created_at",
        )
        .eq("organization_id", activeOrganizationId)
        .or(
          "jackpot_candidate.eq.true,jackpot_anomaly_type.neq.none,fec_recent_activity.eq.true,fec_total_given.gt.0,pledge_amount.gt.0,donation_total.gt.0",
        )
        .limit(150);

      if (contactsError) throw contactsError;

      const contacts = (contactsData as JackpotDbContact[] | null) ?? [];
      const contactIds = contacts.map((contact) => contact.id);

      if (contactIds.length === 0) {
        setJackpotOpportunities([]);
        setActions([]);
        return;
      }

      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from("contributions")
          .select("id, contact_id, amount, source, date, created_at")
          .in("contact_id", contactIds);

      if (contributionsError) throw contributionsError;

      const { data: pledgesData, error: pledgesError } = await supabase
        .from("pledges")
        .select("id, contact_id, amount_pledged, amount_fulfilled, status, next_follow_up, created_at")
        .in("contact_id", contactIds);

      if (pledgesError) throw pledgesError;

      const { data: actionData, error: actionError } = await supabase
        .from("jackpot_actions")
        .select("id, contact_id, organization_id, action_type, status, notes, created_at, updated_at")
        .in("contact_id", contactIds)
        .order("updated_at", { ascending: false });

      if (actionError) throw actionError;

      const contributionTotals = new Map<string, number>();
      for (const contribution of (contributionsData as ContributionRow[] | null) ?? []) {
        if (!contribution.contact_id) continue;
        contributionTotals.set(
          contribution.contact_id,
          (contributionTotals.get(contribution.contact_id) ?? 0) + toNumber(contribution.amount),
        );
      }

      const pledgeTotals = new Map<string, number>();
      for (const pledge of (pledgesData as PledgeRow[] | null) ?? []) {
        if (!pledge.contact_id) continue;
        const status = String(pledge.status || "pledged").toLowerCase();
        if (status === "converted") continue;

        const remaining = Math.max(
          toNumber(pledge.amount_pledged) - toNumber(pledge.amount_fulfilled),
          0,
        );

        pledgeTotals.set(
          pledge.contact_id,
          (pledgeTotals.get(pledge.contact_id) ?? 0) + remaining,
        );
      }

      const safeActions = (actionData as JackpotActionRow[] | null) ?? [];

      const opportunities = contacts
        .map((contact) =>
          buildOpportunity({
            contact,
            contributionTotal: getContributionTotal(contact, contributionTotals),
            pledgeTotal: getPledgeTotal(contact, pledgeTotals),
            workedRecently: wasWorkedRecently(
              actionStatusForContact(safeActions, contact.id),
            ),
          }),
        )
        .filter(
          (opportunity) =>
            opportunity.latentValue > 0 ||
            opportunity.opportunityScore >= 55 ||
            opportunity.contact.jackpot_candidate,
        )
        .sort((a, b) => {
          const scoreDifference = b.opportunityScore - a.opportunityScore;
          if (scoreDifference !== 0) return scoreDifference;
          return b.latentValue - a.latentValue;
        });

      setJackpotOpportunities(opportunities);
      setActions(safeActions);
    } catch (error: any) {
      console.error("Failed to load jackpot opportunities:", error);

      setJackpotOpportunities([]);
      setActions([]);
      setMessage(error?.message || "Failed to load jackpot opportunities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJackpotOpportunities();
  }, []);

  const activeOpportunity =
    jackpotOpportunities.find((item) => item.id === activeOpportunityId) ?? null;

  const totalLatentValue = useMemo(() => {
    return jackpotOpportunities.reduce(
      (sum, opportunity) => sum + opportunity.latentValue,
      0,
    );
  }, [jackpotOpportunities]);

  const totalOpenPledgeValue = useMemo(() => {
    return jackpotOpportunities.reduce(
      (sum, opportunity) => sum + opportunity.pledgeTotal,
      0,
    );
  }, [jackpotOpportunities]);

  const topOpportunity = jackpotOpportunities[0] ?? null;

  const highPriorityCount = useMemo(() => {
    return jackpotOpportunities.filter(
      (opportunity) => opportunity.opportunityScore >= 85,
    ).length;
  }, [jackpotOpportunities]);

  function openActionPanel(opportunity: JackpotOpportunity) {
    setActiveOpportunityId(opportunity.id);
    setPaymentAmount(String(opportunity.latentValue || ""));
    setPaymentMethod("check");
    setPaymentDate(todayIsoDate());
    setPledgeAmount(String(opportunity.pledgeTotal || opportunity.latentValue || ""));
    setPledgeFollowUp(todayIsoDate());
    setActionNotes("");
    setActionMessage("");
  }

  async function saveJackpotAction(input: {
    contactId: string;
    actionType: string;
    status?: string;
    notes?: string;
  }) {
    const contact = jackpotOpportunities.find((item) => item.id === input.contactId)?.contact;

    const { error } = await supabase.from("jackpot_actions").insert([
      {
        contact_id: input.contactId,
        organization_id: contact?.organization_id || organizationId,
        action_type: input.actionType,
        status: input.status || "open",
        notes: input.notes || null,
      },
    ]);

    if (error) throw error;
  }

  async function recordContribution(opportunity: JackpotOpportunity) {
    const amount = toNumber(paymentAmount);

    setActionMessage("");

    if (amount <= 0) {
      setActionMessage("Enter a valid contribution amount.");
      return;
    }

    try {
      const { error: insertError } = await supabase.from("contributions").insert([
        {
          contact_id: opportunity.id,
          amount,
          source: paymentMethod,
          date: paymentDate || todayIsoDate(),
          organization_id: opportunity.contact.organization_id || organizationId,
        },
      ]);

      if (insertError) throw insertError;

      const nextDonationTotal = opportunity.contributionTotal + amount;

      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          donation_total: nextDonationTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunity.id);

      if (updateError) throw updateError;

      await saveJackpotAction({
        contactId: opportunity.id,
        actionType: "record_contribution",
        status: "worked",
        notes:
          actionNotes ||
          `${currency.format(amount)} ${paymentMethod} contribution recorded from Jackpot.`,
      });

      setActionMessage(`${currency.format(amount)} contribution recorded.`);
      await loadJackpotOpportunities();
    } catch (error: any) {
      setActionMessage(error?.message || "Contribution did not save.");
    }
  }

  async function createPledge(opportunity: JackpotOpportunity) {
    const amount = toNumber(pledgeAmount);

    setActionMessage("");

    if (amount <= 0) {
      setActionMessage("Enter a valid pledge amount.");
      return;
    }

    try {
      const { error: insertError } = await supabase.from("pledges").insert([
        {
          contact_id: opportunity.id,
          amount_pledged: amount,
          amount_fulfilled: 0,
          status: "pledged",
          next_follow_up: pledgeFollowUp || null,
        },
      ]);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          pledge_amount: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunity.id);

      if (updateError) throw updateError;

      await saveJackpotAction({
        contactId: opportunity.id,
        actionType: "create_pledge",
        status: "worked",
        notes:
          actionNotes ||
          `${currency.format(amount)} pledge created from Jackpot.`,
      });

      setActionMessage(`${currency.format(amount)} pledge created.`);
      await loadJackpotOpportunities();
    } catch (error: any) {
      setActionMessage(error?.message || "Pledge did not save.");
    }
  }

  async function addToFinanceQueue(opportunity: JackpotOpportunity) {
    setActionMessage("");

    try {
      await saveJackpotAction({
        contactId: opportunity.id,
        actionType: "add_to_finance_queue",
        status: "open",
        notes: actionNotes || "Added to finance queue from Jackpot.",
      });

      setActionMessage("Added to finance queue.");
      await loadJackpotOpportunities();
    } catch (error: any) {
      setActionMessage(error?.message || "Could not add to finance queue.");
    }
  }

  async function markWorked(opportunity: JackpotOpportunity) {
    setActionMessage("");

    try {
      await saveJackpotAction({
        contactId: opportunity.id,
        actionType: "mark_worked",
        status: "worked",
        notes: actionNotes || "Marked worked from Jackpot queue.",
      });

      setActionMessage("Marked worked.");
      await loadJackpotOpportunities();
    } catch (error: any) {
      setActionMessage(error?.message || "Could not mark worked.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading jackpot queue...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Crown className="h-3.5 w-3.5" />
              Jackpot Queue
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Work the money-moving opportunities first.
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 lg:text-base">
                Jackpot surfaces donors who may not already be in normal lists,
                then lets Finance record contributions, create pledges, queue the
                contact, or mark the opportunity worked.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/finance/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Finance Focus
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Users className="h-4 w-4" />
              Contacts
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {message}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Latent Value</p>
            <BadgeDollarSign className="h-5 w-5 text-amber-700" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-amber-950">
            {currency.format(totalLatentValue)}
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Opportunity currently surfaced by Jackpot.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">Open Pledge Value</p>
            <HandCoins className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-emerald-950">
            {currency.format(totalOpenPledgeValue)}
          </p>
          <p className="mt-2 text-sm text-emerald-900/80">
            Pledge value that can be converted.
          </p>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-rose-800">High Priority</p>
            <Zap className="h-5 w-5 text-rose-700" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-rose-950">
            {highPriorityCount}
          </p>
          <p className="mt-2 text-sm text-rose-900/80">
            Opportunities with score 85 or higher.
          </p>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-sky-800">
              Recommended First Move
            </p>
            <PhoneCall className="h-5 w-5 text-sky-700" />
          </div>
          <p className="mt-3 text-lg font-semibold text-sky-950">
            {topOpportunity?.contactName || "No opportunity surfaced"}
          </p>
          <p className="mt-2 text-sm text-sky-900/80">
            {topOpportunity?.suggestedAsk || "Ingest donor or FEC signals to activate Jackpot."}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-white p-6 shadow-md">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-amber-700" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Abe Jackpot Read
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {jackpotOpportunities.length > 0
                ? "Jackpot sees money sitting between signal and action."
                : "Jackpot is waiting for live donor signal."}
            </h2>
            <p className="mt-2 max-w-4xl text-sm text-slate-700">
              {jackpotOpportunities.length > 0
                ? "Work open pledge value first, then underworked donor capacity, then hidden capacity and re-engagement. Jackpot is its own queue for opportunity discovery, not just a dashboard."
                : "No live jackpot opportunities are available yet. Import contacts, FEC matches, pledge records, or donor activity to activate this queue."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        {jackpotOpportunities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No live jackpot opportunities yet.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Jackpot will populate when contacts carry FEC totals, donor tiers,
              jackpot anomaly flags, pledges, contributions, or other finance signal fields.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/dashboard/contacts/import"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Import Contacts
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/finance"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Finance
              </Link>
            </div>
          </div>
        ) : null}

        {jackpotOpportunities.map((opportunity, index) => {
          const isActive = activeOpportunityId === opportunity.id;
          const latestAction = actionStatusForContact(actions, opportunity.id);

          return (
            <div
              key={opportunity.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6"
            >
              <div className="grid gap-5 lg:grid-cols-[0.75fr_1.55fr_0.95fr] lg:items-start">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Rank #{index + 1}
                  </p>
                  <p className={`mt-3 text-4xl font-semibold ${scoreTone(opportunity.opportunityScore)}`}>
                    {opportunity.opportunityScore}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Opportunity Score
                  </p>
                  <p className="mt-4 text-2xl font-semibold text-slate-900">
                    {currency.format(opportunity.latentValue)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Latent value</p>

                  {latestAction ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">
                        Last Action
                      </p>
                      <p className="mt-1">{latestAction.action_type}</p>
                      <p className="mt-1 capitalize">{latestAction.status}</p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(
                        opportunity.category,
                      )}`}
                    >
                      {categoryLabel(opportunity.category)}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      jackpot work queue
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                    {opportunity.contactName}
                  </h2>
                  <p className="mt-2 text-base font-medium text-slate-800">
                    {opportunity.headline}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Campaign Contributions</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {currency.format(opportunity.contributionTotal)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Open Pledges</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {currency.format(opportunity.pledgeTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Why Jackpot surfaced this
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {opportunity.whySurfaced.map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <Target className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Recommended action
                    </p>
                    <p className="mt-2 text-sm text-emerald-900">
                      {opportunity.recommendedAction}
                    </p>
                  </div>

                  {isActive && activeOpportunity ? (
                    <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Jackpot Work Panel
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <input
                          value={paymentAmount}
                          onChange={(event) => setPaymentAmount(event.target.value)}
                          placeholder="Contribution amount"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <select
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(event.target.value as PaymentMethod)
                          }
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="check">Check</option>
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>

                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(event) => setPaymentDate(event.target.value)}
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input
                          value={pledgeAmount}
                          onChange={(event) => setPledgeAmount(event.target.value)}
                          placeholder="Pledge amount"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          type="date"
                          value={pledgeFollowUp}
                          onChange={(event) => setPledgeFollowUp(event.target.value)}
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <textarea
                        value={actionNotes}
                        onChange={(event) => setActionNotes(event.target.value)}
                        placeholder="Optional action notes..."
                        rows={3}
                        className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => recordContribution(activeOpportunity)}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                        >
                          Record Contribution
                        </button>
                        <button
                          onClick={() => createPledge(activeOpportunity)}
                          className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700"
                        >
                          Create Pledge
                        </button>
                        <button
                          onClick={() => addToFinanceQueue(activeOpportunity)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                        >
                          Add to Finance Queue
                        </button>
                        <button
                          onClick={() => markWorked(activeOpportunity)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Mark Worked
                        </button>
                        <button
                          onClick={() => setActiveOpportunityId(null)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Close
                        </button>
                      </div>

                      {actionMessage ? (
                        <p className="mt-3 text-sm font-medium text-amber-800">
                          {actionMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Suggested Ask</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {opportunity.suggestedAsk}
                    </p>
                  </div>

                  <button
                    onClick={() => openActionPanel(opportunity)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Work Jackpot
                  </button>

                  <Link
                    href={opportunity.contactHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open Contact
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/dashboard/finance/focus"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Open Finance Focus
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Jackpot Pattern Watch
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {jackpotOpportunities.length > 0
                ? "The strongest pattern is conversion before discovery."
                : "No jackpot pattern is active yet."}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              {jackpotOpportunities.length > 0
                ? "Work active pledge conversion first, then underworked donor capacity, then hidden capacity and re-engagement. Jackpot protects focus by keeping money-moving signals above routine volume."
                : "Once donor intelligence is ingested, this section will summarize the strongest live money-moving pattern."}
            </p>
          </div>

          <TrendingUp className="h-10 w-10 text-amber-300" />
        </div>
      </section>
    </div>
  );
}
