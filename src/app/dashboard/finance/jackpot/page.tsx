"use client";

import Link from "next/link";
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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const jackpotOpportunities: JackpotOpportunity[] = [
  {
    id: "jackpot-1",
    contactName: "Michael Ross",
    opportunityScore: 94,
    latentValue: 3200,
    category: "pledge_conversion",
    headline: "Pledge conversion risk is creating immediate opportunity.",
    whySurfaced: [
      "$3,200 pledge is still open.",
      "Recent donor intent is already visible.",
      "Conversion window is active enough to work now.",
    ],
    recommendedAction: "Call now and convert the pledge before it cools.",
    suggestedAsk: "Confirm $3,200 pledge",
    contactHref: "/dashboard/contacts",
  },
  {
    id: "jackpot-2",
    contactName: "Elaine Porter",
    opportunityScore: 88,
    latentValue: 6600,
    category: "underworked_major",
    headline: "Major donor capacity is visible but underworked.",
    whySurfaced: [
      "Giving capacity sits above major donor threshold.",
      "No recent finance call activity is attached.",
      "A timely touch could reopen donor momentum.",
    ],
    recommendedAction: "Route into the next finance call session.",
    suggestedAsk: "Test $6,600 max-out path",
    contactHref: "/dashboard/contacts",
  },
  {
    id: "jackpot-3",
    contactName: "Jordan Hayes",
    opportunityScore: 81,
    latentValue: 4200,
    category: "hidden_capacity",
    headline: "Hidden capacity signal should be worked before normal volume.",
    whySurfaced: [
      "External donor signal suggests higher capacity than current ask.",
      "Contact has not been prioritized in finance flow yet.",
      "Opportunity is stronger than routine call queue volume.",
    ],
    recommendedAction: "Open contact context and prepare a higher ask.",
    suggestedAsk: "Prepare $4,200 ask",
    contactHref: "/dashboard/contacts",
  },
  {
    id: "jackpot-4",
    contactName: "Priya Shah",
    opportunityScore: 76,
    latentValue: 2400,
    category: "reengagement",
    headline: "Dormant donor relationship may be ready for reactivation.",
    whySurfaced: [
      "Past giving indicates meaningful donor intent.",
      "No recent follow-up is visible.",
      "Reactivation could create a clean donor conversation.",
    ],
    recommendedAction: "Send to call session after top pledge and major donor work.",
    suggestedAsk: "Reopen with $2,400 ask",
    contactHref: "/dashboard/contacts",
  },
];

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
  const totalLatentValue = jackpotOpportunities.reduce(
    (sum, opportunity) => sum + opportunity.latentValue,
    0
  );

  const topOpportunity = jackpotOpportunities[0];
  const highPriorityCount = jackpotOpportunities.filter(
    (opportunity) => opportunity.opportunityScore >= 85
  ).length;

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
            {topOpportunity.contactName}
          </p>
          <p className="mt-2 text-sm text-emerald-900/80">
            {topOpportunity.suggestedAsk}
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
              Jackpot sees money sitting between signal and action.
            </h2>
            <p className="mt-2 max-w-4xl text-sm text-slate-700">
              Work the top pledge conversion first, then route underworked major
              donors into the finance call session. Compliance remains protected
              in its own lane; this queue is for opportunity-generating pressure.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5">
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
              The strongest pattern is conversion before discovery.
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Work active pledge conversion first, then underworked major donor
              capacity, then hidden capacity and re-engagement. The queue should
              protect focus by keeping money-moving signals above routine volume.
            </p>
          </div>

          <TrendingUp className="h-10 w-10 text-amber-300" />
        </div>
      </section>
    </div>
  );
}
