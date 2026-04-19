"use client";

import {
  AutoExecutionSelectorCard,
  AutoExecutionSelectorResult,
  getAutoExecutionQueueHeadline,
  getAutoExecutionQueueSubheadline,
  getImmediateExecutionCards,
  getTopAutoExecutionCards,
  getTopBlockedCards,
  getTopManualReviewCards,
} from "@/lib/priority/auto-execution-selectors";

type AutoExecutionQueueProps = {
  result: AutoExecutionSelectorResult;
};

function getDispositionLabel(disposition: AutoExecutionSelectorCard["disposition"]) {
  switch (disposition) {
    case "auto_execute":
      return "Auto";
    case "manual_review":
      return "Manual Review";
    case "blocked":
      return "Blocked";
    default:
      return disposition;
  }
}

function getRiskLabel(riskLevel: AutoExecutionSelectorCard["riskLevel"]) {
  switch (riskLevel) {
    case "low":
      return "Low Risk";
    case "medium":
      return "Medium Risk";
    case "high":
      return "High Risk";
    default:
      return riskLevel;
  }
}

function getLevelClasses(level: AutoExecutionSelectorCard["level"]) {
  switch (level) {
    case "critical":
      return "border-red-500/40 bg-red-500/10 text-red-200";
    case "high":
      return "border-orange-500/40 bg-orange-500/10 text-orange-200";
    case "medium":
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-200";
    case "low":
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function getDispositionClasses(
  disposition: AutoExecutionSelectorCard["disposition"]
) {
  switch (disposition) {
    case "auto_execute":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "manual_review":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "blocked":
      return "border-rose-500/40 bg-rose-500/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {sublabel ? <div className="mt-1 text-sm text-white/55">{sublabel}</div> : null}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  subtitle,
}: {
  title: string;
  count: number;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <div className="text-lg font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm text-white/55">{subtitle}</div>
      </div>
      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white/60">
        {count} shown
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
      {label}
    </div>
  );
}

function ActionCard({ card }: { card: AutoExecutionSelectorCard }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1020]/80 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-white">{card.title}</div>
          <div className="mt-1 text-sm text-white/60">{card.summary}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${getDispositionClasses(
              card.disposition
            )}`}
          >
            {getDispositionLabel(card.disposition)}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${getLevelClasses(
              card.level
            )}`}
          >
            {card.level}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Priority
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {card.priorityScore}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Confidence
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {card.confidence}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Risk
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {getRiskLabel(card.riskLevel)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Bucket
          </div>
          <div className="mt-2 text-lg font-semibold capitalize text-white">
            {card.bucket.replace("_", " ")}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
          Recommended Action
        </div>
        <div className="mt-2 text-sm text-white/80">{card.recommendedAction}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.badges.length > 0 ? (
          card.badges.map((badge) => (
            <span
              key={`${card.actionId}-${badge}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65"
            >
              {badge}
            </span>
          ))
        ) : (
          <span className="text-xs text-white/35">No badges</span>
        )}
      </div>
    </div>
  );
}

function ActionSection({
  title,
  subtitle,
  cards,
}: {
  title: string;
  subtitle: string;
  cards: AutoExecutionSelectorCard[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#060B16]/80 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.3)]">
      <SectionHeader title={title} count={cards.length} subtitle={subtitle} />
      <div className="space-y-4">
        {cards.length > 0 ? (
          cards.map((card) => <ActionCard key={card.actionId} card={card} />)
        ) : (
          <EmptyState label={`No items in ${title.toLowerCase()}.`} />
        )}
      </div>
    </section>
  );
}

export function AutoExecutionQueue({ result }: AutoExecutionQueueProps) {
  const headline = getAutoExecutionQueueHeadline(result);
  const subheadline = getAutoExecutionQueueSubheadline(result);

  const immediateQueue = getImmediateExecutionCards(result, 6);
  const topAuto = getTopAutoExecutionCards(result, 6);
  const topManual = getTopManualReviewCards(result, 6);
  const topBlocked = getTopBlockedCards(result, 6);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.14)_100%)] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.32)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">
              Aether Auto Execution Queue
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {headline}
            </h2>
            <p className="mt-2 text-sm text-white/60">{subheadline}</p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[460px] lg:grid-cols-4">
            <StatCard
              label="Auto Executable"
              value={result.summary.autoExecutable}
              sublabel={`${result.summary.autoExecutionRate}% of total`}
            />
            <StatCard
              label="Manual Review"
              value={result.summary.manualReview}
              sublabel="Needs operator approval"
            />
            <StatCard
              label="Blocked"
              value={result.summary.blocked}
              sublabel="Governance prevented execution"
            />
            <StatCard
              label="Top Priority"
              value={result.summary.topPriorityScore}
              sublabel="Highest ranked action"
            />
          </div>
        </div>
      </section>

      <ActionSection
        title="Immediate Queue"
        subtitle="Highest urgency items across fix-now, owner pressure, and top-level actions."
        cards={immediateQueue}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <ActionSection
          title="Auto Executable"
          subtitle="Actions safe to run under current controls."
          cards={topAuto}
        />

        <ActionSection
          title="Manual Review"
          subtitle="Actions that need review before execution."
          cards={topManual}
        />

        <ActionSection
          title="Blocked"
          subtitle="Actions blocked by governance, confidence, or risk controls."
          cards={topBlocked}
        />
      </div>
    </div>
  );
}

export default AutoExecutionQueue;