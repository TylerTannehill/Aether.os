"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeDollarSign,
  Crown,
  PhoneCall,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type JackpotOpportunity = {
  id: string;
  contactName: string;
  opportunityScore: number;
  latentValue: number;
  category:
    | "pledge_conversion"
    | "underworked_major"
    | "hidden_capacity"
    | "reengagement";
  headline: string;
  whySurfaced: string[];
  recommendedAction: string;
  suggestedAsk: string;
  contactHref: string;
};

type JackpotDbContact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  fec_match_status?: "matched" | "probable" | "unresolved" | "none" | null;
  fec_confidence_score?: number | null;
  fec_total_given?: number | null;
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
  pledge_amount?: number | null;
  donation_total?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};



const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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
  const name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  return name || contact.email || "Unnamed Contact";
}

function getLatentValue(contact: JackpotDbContact) {
  const values = [
    Number(contact.pledge_amount ?? 0),
    Number(contact.fec_total_given ?? 0),
    Number(contact.donation_total ?? 0),
  ].filter((value) => Number.isFinite(value));

  const bestValue = Math.max(0, ...values);

  if (contact.fec_donor_tier === "maxed") return Math.max(bestValue, 6600);
  if (contact.fec_donor_tier === "major") return Math.max(bestValue, 2500);
  if (contact.fec_donor_tier === "mid") return Math.max(bestValue, 1000);
  if (contact.fec_donor_tier === "base") return Math.max(bestValue, 500);

  return bestValue;
}

function getJackpotCategory(
  contact: JackpotDbContact
): JackpotOpportunity["category"] {
  if (contact.jackpot_anomaly_type === "pledge_gap" || Number(contact.pledge_amount ?? 0) > 0) {
    return "pledge_conversion";
  }

  if (
    contact.jackpot_anomaly_type === "high_value_unworked" ||
    contact.fec_donor_tier === "major" ||
    contact.fec_donor_tier === "maxed"
  ) {
    return "underworked_major";
  }

  if (
    contact.jackpot_anomaly_type === "recent_external_giving" ||
    contact.fec_recent_activity
  ) {
    return "hidden_capacity";
  }

  return "reengagement";
}

function getOpportunityScore(contact: JackpotDbContact) {
  let score = 45;

  if (contact.jackpot_candidate) score += 25;
  if (contact.fec_match_status === "matched") score += 10;
  if (contact.fec_match_status === "probable") score += 6;
  if (contact.fec_recent_activity) score += 10;
  if (Number(contact.pledge_amount ?? 0) > 0) score += 12;

  const latentValue = getLatentValue(contact);

  if (latentValue >= 6600) score += 12;
  else if (latentValue >= 2500) score += 9;
  else if (latentValue >= 1000) score += 6;
  else if (latentValue >= 500) score += 3;

  const confidence = Number(contact.fec_confidence_score ?? 0);
  if (confidence > 0) {
    score += Math.min(10, Math.round(confidence / 10));
  }

  return Math.min(99, Math.max(1, score));
}

function getHeadline(contact: JackpotDbContact) {
  const category = getJackpotCategory(contact);

  if (category === "pledge_conversion") {
    return "Pledge conversion risk is creating immediate opportunity.";
  }

  if (category === "underworked_major") {
    return "Major donor capacity is visible but underworked.";
  }

  if (category === "hidden_capacity") {
    return "Hidden capacity signal should be worked before normal volume.";
  }

  return "Dormant donor relationship may be ready for reactivation.";
}

function getSuggestedAsk(contact: JackpotDbContact) {
  const latentValue = getLatentValue(contact);

  if (Number(contact.pledge_amount ?? 0) > 0) {
    return `Confirm ${currency.format(Number(contact.pledge_amount ?? 0))} pledge`;
  }

  if (contact.fec_donor_tier === "maxed") {
    return "Protect max-out relationship";
  }

  if (latentValue >= 6600) return "Test $6,600 max-out path";
  if (latentValue >= 2500) return `Prepare ${currency.format(latentValue)} ask`;
  if (latentValue >= 500) return `Reopen with ${currency.format(Math.max(latentValue, 1000))} ask`;

  return "Prepare starter finance ask";
}

function buildWhySurfaced(contact: JackpotDbContact) {
  const reasons: string[] = [];

  if (contact.jackpot_reason) {
    reasons.push(contact.jackpot_reason);
  }

  if (Number(contact.pledge_amount ?? 0) > 0) {
    reasons.push(`${currency.format(Number(contact.pledge_amount ?? 0))} pledge is still open.`);
  }

  if (contact.fec_donor_tier && contact.fec_donor_tier !== "none") {
    reasons.push(`${contact.fec_donor_tier.replace("_", " ")} donor tier is visible.`);
  }

  if (contact.fec_recent_activity) {
    reasons.push("Recent FEC activity suggests the donor is warm.");
  }

  if (contact.fec_match_status === "matched" || contact.fec_match_status === "probable") {
    reasons.push(`FEC match status is ${contact.fec_match_status}.`);
  }

  if (Number(contact.fec_total_given ?? 0) > 0) {
    reasons.push(`${currency.format(Number(contact.fec_total_given ?? 0))} in FEC giving is visible.`);
  }

  if (!reasons.length) {
    reasons.push("Contact has finance signal fields available for review.");
  }

  return reasons.slice(0, 3);
}

function buildRecommendedAction(contact: JackpotDbContact) {
  const category = getJackpotCategory(contact);

  if (category === "pledge_conversion") {
    return "Call now and convert the pledge before it cools.";
  }

  if (category === "underworked_major") {
    return "Route into the next finance call session.";
  }

  if (category === "hidden_capacity") {
    return "Open contact context and prepare a higher ask.";
  }

  return "Send to call session after top pledge and major donor work.";
}

function buildOpportunity(contact: JackpotDbContact): JackpotOpportunity {
  const latentValue = getLatentValue(contact);

  return {
    id: contact.id,
    contactName: contactName(contact),
    opportunityScore: getOpportunityScore(contact),
    latentValue,
    category: getJackpotCategory(contact),
    headline: getHeadline(contact),
    whySurfaced: buildWhySurfaced(contact),
    recommendedAction: buildRecommendedAction(contact),
    suggestedAsk: getSuggestedAsk(contact),
    contactHref: `/dashboard/contacts/${contact.id}`,
  };
}

function categoryLabel(category: JackpotOpportunity["category"]) {
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

function categoryTone(category: JackpotOpportunity["category"]) {
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

export default function FinanceJackpotQueuePage() {
  const [jackpotOpportunities, setJackpotOpportunities] = useState<
    JackpotOpportunity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadJackpotOpportunities() {
      try {
        setLoading(true);
        setMessage("");

        const organizationId = await getActiveOrganizationId();

        const { data, error } = await supabase
          .from("contacts")
          .select(
            "id, first_name, last_name, email, phone, city, state, fec_match_status, fec_confidence_score, fec_total_given, fec_last_donation_date, fec_recent_activity, fec_donor_tier, jackpot_candidate, jackpot_anomaly_type, jackpot_reason, pledge_amount, donation_total, updated_at, created_at"
          )
          .eq("organization_id", organizationId)
          .or(
            "jackpot_candidate.eq.true,jackpot_anomaly_type.neq.none,fec_recent_activity.eq.true,fec_total_given.gt.0,pledge_amount.gt.0,donation_total.gt.0"
          )
          .limit(100);

        if (error) {
          throw error;
        }

        if (!mounted) return;

        const opportunities = ((data as JackpotDbContact[] | null) ?? [])
          .map(buildOpportunity)
          .filter((opportunity) => opportunity.latentValue > 0 || opportunity.opportunityScore >= 60)
          .sort((a, b) => {
            const scoreDifference = b.opportunityScore - a.opportunityScore;
            if (scoreDifference !== 0) return scoreDifference;
            return b.latentValue - a.latentValue;
          });

        setJackpotOpportunities(opportunities);
      } catch (error: any) {
        console.error("Failed to load jackpot opportunities:", error);

        if (!mounted) return;

        setJackpotOpportunities([]);
        setMessage(error?.message || "Failed to load jackpot opportunities.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadJackpotOpportunities();

    return () => {
      mounted = false;
    };
  }, []);

  const totalLatentValue = useMemo(() => {
    return jackpotOpportunities.reduce(
      (sum, opportunity) => sum + opportunity.latentValue,
      0
    );
  }, [jackpotOpportunities]);

  const topOpportunity = jackpotOpportunities[0] ?? null;

  const highPriorityCount = useMemo(() => {
    return jackpotOpportunities.filter(
      (opportunity) => opportunity.opportunityScore >= 85
    ).length;
  }, [jackpotOpportunities]);

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
                Jackpot prioritizes latent donor value, pledge conversion risk,
                underworked major donors, and hidden capacity signals before
                routine finance volume.
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

      <section className="grid gap-4 md:grid-cols-3">
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

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">
              Recommended First Move
            </p>
            <PhoneCall className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-3 text-lg font-semibold text-emerald-950">
            {topOpportunity?.contactName || "No opportunity surfaced"}
          </p>
          <p className="mt-2 text-sm text-emerald-900/80">
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
                ? "Work the top pledge conversion first, then route underworked major donors into the finance call session. Compliance remains protected in its own lane; this queue is for opportunity-generating pressure."
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
              jackpot anomaly flags, pledges, or other finance signal fields.
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

        {jackpotOpportunities.map((opportunity, index) => (
          <div
            key={opportunity.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6"
          >
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.75fr_0.8fr] lg:items-start">
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
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(
                      opportunity.category
                    )}`}
                  >
                    {categoryLabel(opportunity.category)}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    money-moving signal
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                  {opportunity.contactName}
                </h2>
                <p className="mt-2 text-base font-medium text-slate-800">
                  {opportunity.headline}
                </p>

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
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Suggested Ask</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {opportunity.suggestedAsk}
                  </p>
                </div>

                <Link
                  href={opportunity.contactHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Open Contact
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/dashboard/finance/focus"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600"
                >
                  <PhoneCall className="h-4 w-4" />
                  Route to Call Session
                </Link>
              </div>
            </div>
          </div>
        ))}
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
                ? "Work active pledge conversion first, then underworked major donor capacity, then hidden capacity and re-engagement. The queue should protect focus by keeping money-moving signals above routine volume."
                : "Once donor intelligence is ingested, this section will summarize the strongest live money-moving pattern."}
            </p>
          </div>

          <TrendingUp className="h-10 w-10 text-amber-300" />
        </div>
      </section>
    </div>
  );
}
