"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  HandCoins,
  ReceiptText,
  Search,
  Send,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FinanceObligation = {
  id: string;
  direction: "in" | "out";
  amount: number | string;
  due_date: string;
  description: string;
  counterparty_name: string | null;
  status: "open" | "resolved" | "cancelled";
};

type FinanceTransaction = {
  id: string;
  direction: "in" | "out";
  amount: number | string;
  transaction_date: string;
  description: string;
  counterparty_name: string | null;
  source: string;
  needs_review: boolean;
  review_reason: string | null;
  reviewed_at: string | null;
};

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function formatDueDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTransactionDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function duePressure(value: string) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (value < todayKey) return "Overdue";
  if (value === todayKey) return "Due today";
  return "Upcoming";
}

type FocusLane = {
  id: "receive" | "pay" | "review";
  label: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyBody: string;
  icon: typeof HandCoins;
};

const lanes: FocusLane[] = [
  {
    id: "receive",
    label: "Receive Lane",
    title: "Collect expected money",
    description: "Keep incoming payment commitments and expected dates visible.",
    emptyTitle: "No payments to receive",
    emptyBody:
      "Expected incoming payments will appear here when a real financial obligation has a receive date and still needs attention.",
    icon: HandCoins,
  },
  {
    id: "pay",
    label: "Pay Lane",
    title: "Meet payment commitments",
    description: "Keep outgoing payment obligations from slipping past their due dates.",
    emptyTitle: "No payments to send",
    emptyBody:
      "Upcoming or overdue outgoing payments will appear here when a real financial obligation has a due date and still needs attention.",
    icon: Send,
  },
  {
    id: "review",
    label: "Review Lane",
    title: "Review financial activity",
    description: "Surface real transaction activity that is waiting for a human review.",
    emptyTitle: "Nothing to review",
    emptyBody:
      "Transactions will appear here when real financial activity creates review pressure. Focus will not invent review work.",
    icon: ClipboardCheck,
  },
];

function EmptyLane({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof HandCoins;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

export default function BusinessFinanceFocusPage() {
  const [search, setSearch] = useState("");
  const [obligations, setObligations] = useState<FinanceObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewTransactions, setReviewTransactions] = useState<FinanceTransaction[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadObligations() {
      setLoading(true);
      setLoadError(null);

      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!active) return;

      if (!contextResponse.ok) {
        setLoadError("Unable to load the active organization.");
        setLoading(false);
        return;
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        setLoadError("No active Business organization is available.");
        setLoading(false);
        return;
      }

      setOrganizationId(organizationId);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_finance_obligations")
        .select("id,direction,amount,due_date,description,counterparty_name,status")
        .eq("organization_id", organizationId)
        .eq("status", "open")
        .order("due_date", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Unable to load Finance Focus obligations:", error);
        setLoadError("Unable to load financial obligations.");
        setObligations([]);
      } else {
        setObligations((data || []) as FinanceObligation[]);
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from("business_finance_transactions")
        .select("id,direction,amount,transaction_date,description,counterparty_name,source,needs_review,review_reason,reviewed_at")
        .eq("organization_id", organizationId)
        .eq("needs_review", true)
        .order("transaction_date", { ascending: false });

      if (!active) return;

      if (reviewError) {
        console.error("Unable to load Finance Focus review transactions:", reviewError);
        setLoadError("Unable to load financial review activity.");
        setReviewTransactions([]);
      } else {
        setReviewTransactions((reviewData || []) as FinanceTransaction[]);
      }

      setLoading(false);
    }

    void loadObligations();

    return () => {
      active = false;
    };
  }, []);

  async function resolveObligation(item: FinanceObligation) {
    if (!organizationId || resolvingId) return;

    setActionError(null);
    setResolvingId(item.id);

    const supabase = createClient();
    const amount = Number(item.amount) || 0;
    const now = new Date();
    const transactionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const { error: transactionError } = await supabase
      .from("business_finance_transactions")
      .insert({
        organization_id: organizationId,
        direction: item.direction,
        amount,
        transaction_date: transactionDate,
        description: item.description,
        counterparty_name: item.counterparty_name,
        source: "manual",
        external_id: null,
        needs_review: false,
      });

    if (transactionError) {
      console.error("Unable to record Business Finance transaction:", transactionError);
      setActionError("The payment could not be recorded. The obligation was left open.");
      setResolvingId(null);
      return;
    }

    const { error: obligationError } = await supabase
      .from("business_finance_obligations")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .eq("status", "open");

    if (obligationError) {
      console.error("Unable to resolve Business Finance obligation:", obligationError);
      setActionError(
        "The transaction was recorded, but the obligation could not be closed. Do not click again; review this item before retrying."
      );
      setResolvingId(null);
      return;
    }

    setObligations((current) => current.filter((obligation) => obligation.id !== item.id));
    setResolvingId(null);
  }

  async function markReviewed(item: FinanceTransaction) {
    if (!organizationId || reviewingId) return;

    setActionError(null);
    setReviewingId(item.id);

    const supabase = createClient();
    const { error } = await supabase
      .from("business_finance_transactions")
      .update({
        needs_review: false,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .eq("needs_review", true);

    if (error) {
      console.error("Unable to clear Business Finance review item:", error);
      setActionError("This transaction could not be marked reviewed.");
      setReviewingId(null);
      return;
    }

    setReviewTransactions((current) =>
      current.filter((transaction) => transaction.id !== item.id)
    );
    setReviewingId(null);
  }

  const query = search.trim().toLowerCase();

  const receiveItems = useMemo(
    () =>
      obligations.filter(
        (item) =>
          item.direction === "in" &&
          (!query ||
            item.description.toLowerCase().includes(query) ||
            (item.counterparty_name || "").toLowerCase().includes(query))
      ),
    [obligations, query]
  );

  const payItems = useMemo(
    () =>
      obligations.filter(
        (item) =>
          item.direction === "out" &&
          (!query ||
            item.description.toLowerCase().includes(query) ||
            (item.counterparty_name || "").toLowerCase().includes(query))
      ),
    [obligations, query]
  );

  const reviewItems = useMemo(
    () =>
      reviewTransactions.filter(
        (item) =>
          !query ||
          item.description.toLowerCase().includes(query) ||
          (item.counterparty_name || "").toLowerCase().includes(query) ||
          (item.review_reason || "").toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query)
      ),
    [reviewTransactions, query]
  );

  const totalActions =
    receiveItems.length + payItems.length + reviewItems.length;
  const hasFocusWork = totalActions > 0;

  const visibleCounts = {
    receive: receiveItems.length,
    pay: payItems.length,
    review: reviewItems.length,
  };

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Zap className="h-3.5 w-3.5" />
              Finance Focus Mode
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                {hasFocusWork
                  ? "Finance work needs attention."
                  : "Finance is clear right now."}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Focus Mode turns real financial pressure into executable work:
                receive expected money, meet outgoing commitments, and review
                financial activity that needs human attention.
              </p>
            </div>
          </div>

          <Link
            href="/business/finance"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            Back to Finance
            <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Focus Actions",
            value: totalActions,
            detail: "Real financial actions currently queued",
          },
          {
            label: "Receive",
            value: receiveItems.length,
            detail: "Incoming commitments needing attention",
          },
          {
            label: "Pay",
            value: payItems.length,
            detail: "Outgoing commitments needing attention",
          },
          {
            label: "Review",
            value: reviewItems.length,
            detail: "Financial activity awaiting review",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {stat.value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </section>

      {loading || loadError || !hasFocusWork ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <ReceiptText className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Execution status
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {loading
                  ? "Loading Finance Focus"
                  : loadError
                    ? "Finance Focus is unavailable"
                    : "No finance actions require attention"}
              </h2>
              <p className={`mt-2 max-w-3xl text-sm leading-6 ${loadError ? "text-rose-600" : "text-slate-600"}`}>
                {loading
                  ? "Checking real incoming and outgoing payment obligations."
                  : loadError
                    ? loadError
                    : "There are no open Receive, Pay, or Review actions requiring attention."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Work queue
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Finance execution
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search the live Finance execution queue once financial work exists.
            </p>
          </div>

          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Focus work"
              disabled={!hasFocusWork}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3 lg:gap-4">
        {lanes.map((lane) => {
          const Icon = lane.icon;

          return (
            <div
              key={lane.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]"
            >
              <div className="mb-5 flex items-center justify-between lg:mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                    {lane.label}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                    {lane.title}
                  </h2>
                </div>
                <Icon className="h-5 w-5 text-slate-600 lg:h-4 lg:w-4" />
              </div>

              <p className="mb-4 text-sm leading-6 text-slate-500">
                {lane.description}
              </p>

              {lane.id === "review" ? (
                reviewItems.length === 0 ? (
                  <EmptyLane icon={Icon} title={lane.emptyTitle} body={lane.emptyBody} />
                ) : (
                  <div className="space-y-3">
                    {reviewItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {item.description}
                            </p>
                            {item.counterparty_name ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.counterparty_name}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {item.direction === "in" ? "+" : "−"}
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                              {item.source}
                            </span>
                            <span>{formatTransactionDate(item.transaction_date)}</span>
                          </div>
                          <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 leading-5 text-slate-700">
                            {item.review_reason || "This transaction needs human review."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => void markReviewed(item)}
                          disabled={reviewingId !== null}
                          className="mt-4 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewingId === item.id ? "Clearing..." : "Mark Reviewed"}
                        </button>
                      </article>
                    ))}
                  </div>
                )
              ) : (lane.id === "receive" ? receiveItems : payItems).length === 0 ? (
                <EmptyLane icon={Icon} title={lane.emptyTitle} body={lane.emptyBody} />
              ) : (
                <div className="space-y-3">
                  {(lane.id === "receive" ? receiveItems : payItems).map((item) => {
                    const pressure = duePressure(item.due_date);

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {item.description}
                            </p>
                            {item.counterparty_name ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.counterparty_name}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                            {pressure}
                          </span>
                          <span>Due {formatDueDate(item.due_date)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => void resolveObligation(item)}
                          disabled={resolvingId !== null}
                          className="mt-4 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {resolvingId === item.id
                            ? "Recording..."
                            : item.direction === "in"
                              ? "Mark Received"
                              : "Mark Paid"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              {visibleCounts[lane.id] > 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  {visibleCounts[lane.id]} visible
                </p>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          {
            label: "Receive Pressure",
            value: receiveItems.length,
            icon: CalendarClock,
            detail: "Expected incoming payments",
          },
          {
            label: "Payment Pressure",
            value: payItems.length,
            icon: Send,
            detail: "Outgoing commitments",
          },
          {
            label: "Review Queue",
            value: reviewItems.length,
            icon: ClipboardCheck,
            detail: "Transactions needing review",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:rounded-xl lg:p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-700 lg:text-[9px]">
                  {item.label}
                </p>
                <Icon className="h-4 w-4 text-slate-500 lg:h-3.5 lg:w-3.5" />
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-600 lg:text-[9px]">
                {item.detail}
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Focus acts on real financial state
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Receive pressure will come from real expected incoming payments,
              payment pressure from real outgoing obligations, and review work
              from real transaction activity. Focus does not create a second
              accounting or task system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
