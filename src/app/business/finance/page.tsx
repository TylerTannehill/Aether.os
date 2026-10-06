"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote, CircleDollarSign, FileSpreadsheet, Focus, Landmark, Plus, ReceiptText, RefreshCw, TrendingUp, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Timeframe = "Today" | "Week" | "Month" | "Quarter" | "All Time";
const timeframes: Timeframe[] = ["Today","Week","Month","Quarter","All Time"];

type FinanceObligation = {
  id: string;
  direction: "in" | "out";
  amount: number | string;
  due_date: string;
  description: string;
  business_contact_id: string | null;
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
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BusinessFinancePage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");
  const [obligations, setObligations] = useState<FinanceObligation[]>([]);
  const [obligationsLoading, setObligationsLoading] = useState(true);
  const [obligationsError, setObligationsError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualDirection, setManualDirection] = useState<"in" | "out">("in");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDueDate, setManualDueDate] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCounterparty, setManualCounterparty] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadObligations() {
      setObligationsLoading(true);
      setObligationsError(null);

      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!active) return;

      if (!contextResponse.ok) {
        setObligationsError("Unable to load the active organization.");
        setObligationsLoading(false);
        return;
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        setObligationsError("No active Business organization is available.");
        setObligationsLoading(false);
        return;
      }

      setOrganizationId(organizationId);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("business_finance_obligations")
        .select(
          "id,direction,amount,due_date,description,business_contact_id,counterparty_name,status"
        )
        .eq("organization_id", organizationId)
        .eq("status", "open")
        .order("due_date", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Unable to load Business Finance obligations:", error);
        setObligationsError("Unable to load financial obligations.");
        setObligations([]);
      } else {
        setObligations((data || []) as FinanceObligation[]);
      }

      setObligationsLoading(false);

      setTransactionsLoading(true);
      setTransactionsError(null);

      const { data: transactionData, error: transactionError } = await supabase
        .from("business_finance_transactions")
        .select("id,direction,amount,transaction_date,description,counterparty_name,source,needs_review")
        .eq("organization_id", organizationId)
        .order("transaction_date", { ascending: false });

      if (!active) return;

      if (transactionError) {
        console.error("Unable to load Business Finance transactions:", transactionError);
        setTransactionsError("Unable to load financial transactions.");
        setTransactions([]);
      } else {
        setTransactions((transactionData || []) as FinanceTransaction[]);
      }

      setTransactionsLoading(false);
    }

    void loadObligations();

    return () => {
      active = false;
    };
  }, []);

  async function saveManualObligation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualError(null);

    const amount = Number(manualAmount);

    if (!organizationId) {
      setManualError("No active Business organization is available.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setManualError("Enter an amount greater than zero.");
      return;
    }

    if (!manualDueDate) {
      setManualError("Choose a due date.");
      return;
    }

    if (!manualDescription.trim()) {
      setManualError("Add a description.");
      return;
    }

    setManualSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_finance_obligations")
      .insert({
        organization_id: organizationId,
        direction: manualDirection,
        amount,
        due_date: manualDueDate,
        description: manualDescription.trim(),
        counterparty_name: manualCounterparty.trim() || null,
        status: "open",
      })
      .select(
        "id,direction,amount,due_date,description,business_contact_id,counterparty_name,status"
      )
      .single();

    if (error) {
      console.error("Unable to save Business Finance obligation:", error);
      setManualError("Unable to save this financial obligation.");
      setManualSaving(false);
      return;
    }

    setObligations((current) =>
      [...current, data as FinanceObligation].sort((a, b) =>
        a.due_date.localeCompare(b.due_date)
      )
    );
    setManualDirection("in");
    setManualAmount("");
    setManualDueDate("");
    setManualDescription("");
    setManualCounterparty("");
    setManualEntryOpen(false);
    setManualSaving(false);
  }

  const obligationSummary = useMemo(() => {
    const today = localDateKey();

    return obligations.reduce(
      (summary, obligation) => {
        const amount = Number(obligation.amount) || 0;
        if (obligation.direction === "in") {
          summary.receive += amount;
          summary.total += amount;
        } else {
          summary.pay += amount;
          summary.total -= amount;
        }

        if (obligation.due_date < today) {
          summary.overdueCount += 1;
          summary.overdueAmount += amount;
        } else if (obligation.due_date === today) {
          summary.dueTodayCount += 1;
        }

        return summary;
      },
      {
        total: 0,
        receive: 0,
        pay: 0,
        overdueCount: 0,
        overdueAmount: 0,
        dueTodayCount: 0,
      }
    );
  }, [obligations]);

  const filteredTransactions = useMemo(() => {
    if (timeframe === "All Time") return transactions;

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (timeframe === "Today") {
      // start already represents today
    } else if (timeframe === "Week") {
      start.setDate(start.getDate() - 6);
    } else if (timeframe === "Month") {
      start.setDate(start.getDate() - 29);
    } else if (timeframe === "Quarter") {
      start.setDate(start.getDate() - 89);
    }

    const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    return transactions.filter((transaction) => transaction.transaction_date >= startKey);
  }, [transactions, timeframe]);

  const transactionSummary = useMemo(() =>
    filteredTransactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.direction === "in") summary.moneyIn += amount;
        else summary.moneyOut += amount;
        return summary;
      },
      { moneyIn: 0, moneyOut: 0 }
    ),
  [filteredTransactions]);

  const transactionNet = transactionSummary.moneyIn - transactionSummary.moneyOut;

  const chartPoints = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const byDate = new Map<string, { moneyIn: number; moneyOut: number }>();
    filteredTransactions.forEach((transaction) => {
      const point = byDate.get(transaction.transaction_date) || {
        moneyIn: 0,
        moneyOut: 0,
      };
      const amount = Number(transaction.amount) || 0;
      if (transaction.direction === "in") point.moneyIn += amount;
      else point.moneyOut += amount;
      byDate.set(transaction.transaction_date, point);
    });

    const toKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const parseKey = (key: string) => {
      const [year, month, day] = key.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let rangeStart: Date;
    let rangeEnd = todayStart;

    if (timeframe === "Today") {
      rangeStart = new Date(todayStart);
    } else if (timeframe === "Week") {
      rangeStart = new Date(todayStart);
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (timeframe === "Month") {
      rangeStart = new Date(todayStart);
      rangeStart.setDate(rangeStart.getDate() - 29);
    } else if (timeframe === "Quarter") {
      rangeStart = new Date(todayStart);
      rangeStart.setDate(rangeStart.getDate() - 89);
    } else {
      const sortedDates = Array.from(byDate.keys()).sort();
      rangeStart = parseKey(sortedDates[0]);
      rangeEnd = new Date(todayStart);
    }

    const daily: { date: string; moneyIn: number; moneyOut: number; net: number }[] = [];
    const cursor = new Date(rangeStart);

    while (cursor <= rangeEnd) {
      const date = toKey(cursor);
      const activity = byDate.get(date) || { moneyIn: 0, moneyOut: 0 };
      daily.push({
        date,
        moneyIn: activity.moneyIn,
        moneyOut: activity.moneyOut,
        net: activity.moneyIn - activity.moneyOut,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (daily.length === 1) {
      const activity = daily[0];
      return [
        { ...activity, date: "Start" },
        activity,
      ];
    }

    return daily;
  }, [filteredTransactions, timeframe]);

  const chartMagnitude = Math.max(
    1,
    ...chartPoints.flatMap((point) => [
      Math.abs(point.moneyIn),
      Math.abs(point.moneyOut),
      Math.abs(point.net),
    ])
  );
  const chartWidth = 720;
  const chartHeight = 250;
  const chartPadding = 24;
  const chartMidline = chartHeight / 2;
  const xFor = (index: number) =>
    chartPadding + (index / Math.max(1, chartPoints.length - 1)) * (chartWidth - chartPadding * 2);
  const yFor = (value: number) =>
    chartMidline - (value / chartMagnitude) * (chartMidline - chartPadding);
  const pathFor = (key: "moneyIn" | "moneyOut" | "net") =>
    chartPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point[key])}`)
      .join(" ");

  const metrics = [
    {
      label: "Money In",
      value: transactionsLoading ? "…" : formatCurrency(transactionSummary.moneyIn),
      detail: `${filteredTransactions.length} transaction${filteredTransactions.length === 1 ? "" : "s"} in ${timeframe.toLowerCase()}`,
      icon: ArrowDownLeft,
    },
    {
      label: "Money Out",
      value: transactionsLoading ? "…" : formatCurrency(transactionSummary.moneyOut),
      detail: `${filteredTransactions.length} transaction${filteredTransactions.length === 1 ? "" : "s"} in ${timeframe.toLowerCase()}`,
      icon: ArrowUpRight,
    },
    {
      label: "Net",
      value: transactionsLoading ? "…" : formatCurrency(transactionNet),
      detail: "Actual money in minus actual money out",
      icon: TrendingUp,
    },
    {
      label: "Outstanding",
      value: obligationsLoading ? "…" : formatCurrency(obligationSummary.total),
      detail: obligationsLoading
        ? "Loading open obligations"
        : `${obligations.length} open obligation${obligations.length === 1 ? "" : "s"}`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                <Landmark className="h-3.5 w-3.5" /> Business Finance
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Finance Command Center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Understand how money is moving through your business and surface the financial work that needs attention.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/business/finance/import" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-white/10" style={{color:"#fff"}}>
                <FileSpreadsheet className="h-4 w-4" /> Import Data
              </Link>
              <Link href="/business/finance/focus" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-white/15" style={{color:"#fff"}}>
                <Focus className="h-4 w-4" /> Open Focus Mode
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><Icon className="h-4 w-4" /></div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{metric.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Financial Flow</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Money in, money out, and net</h2>
                <p className="mt-1 text-sm text-slate-500">Financial activity will appear here as records enter Aether.</p>
              </div>
              <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                {timeframes.map((option) => (
                  <button key={option} type="button" onClick={() => setTimeframe(option)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${timeframe===option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{option}</button>
                ))}
              </div>
            </div>
            {transactionsLoading ? (
              <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">Loading financial activity…</p>
              </div>
            ) : transactionsError ? (
              <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
                <p className="text-sm text-rose-700">{transactionsError}</p>
              </div>
            ) : chartPoints.length === 0 ? (
              <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200"><TrendingUp className="h-5 w-5" /></div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">No financial activity yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Money in, money out, and net movement for {timeframe.toLowerCase()} will appear here once transactions exist.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                  <span>Money In · {formatCurrency(transactionSummary.moneyIn)}</span>
                  <span>Money Out · {formatCurrency(transactionSummary.moneyOut)}</span>
                  <span>Net · {formatCurrency(transactionNet)}</span>
                </div>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[260px] w-full" role="img" aria-label={`Financial flow for ${timeframe.toLowerCase()}`}>
                  {[0.25, 0.5, 0.75].map((fraction) => (
                    <line key={fraction} x1={chartPadding} x2={chartWidth-chartPadding} y1={chartHeight*fraction} y2={chartHeight*fraction} stroke="currentColor" className="text-slate-200" strokeWidth="1" />
                  ))}
                  <line x1={chartPadding} x2={chartWidth-chartPadding} y1={chartMidline} y2={chartMidline} stroke="currentColor" className="text-slate-300" strokeWidth="1.5" />
                  <path d={pathFor("moneyIn")} fill="none" stroke="currentColor" className="text-emerald-600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathFor("moneyOut")} fill="none" stroke="currentColor" className="text-rose-500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathFor("net")} fill="none" stroke="currentColor" className="text-slate-700" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 6" />
                </svg>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>{chartPoints[0]?.date === "Start" ? chartPoints[chartPoints.length-1]?.date : chartPoints[0]?.date}</span>
                  <span>{chartPoints[chartPoints.length-1]?.date}</span>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Financial Attention</p>

            {obligationsLoading ? (
              <>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Loading financial obligations</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Checking real expected incoming and outgoing payments.</p>
              </>
            ) : obligationsError ? (
              <>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Financial obligations unavailable</h2>
                <p className="mt-2 text-sm leading-6 text-rose-600">{obligationsError}</p>
              </>
            ) : obligations.length === 0 ? (
              <>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Nothing needs attention yet</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">There are no open financial obligations for this organization.</p>
              </>
            ) : (
              <>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {obligationSummary.overdueCount > 0
                    ? `${obligationSummary.overdueCount} overdue obligation${obligationSummary.overdueCount === 1 ? "" : "s"}`
                    : `${obligations.length} open obligation${obligations.length === 1 ? "" : "s"}`}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {formatCurrency(obligationSummary.receive)} expected in · {formatCurrency(obligationSummary.pay)} expected out
                  {obligationSummary.dueTodayCount > 0
                    ? ` · ${obligationSummary.dueTodayCount} due today`
                    : ""}
                </p>
              </>
            )}

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200">
                  <Focus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Focus reflects financial pressure</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {obligations.length > 0
                      ? "Open obligations now provide real Receive and Pay pressure for Finance Focus."
                      : "Finance Focus will come from real financial state rather than invented tasks."}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Financial Sources</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Bring financial reality into Aether</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Manual entry, CSV imports, and connected systems will feed the same Business Finance view.</p>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setManualError(null);
                  setManualEntryOpen(true);
                }}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-600"><Plus className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Manual Entry</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Add an expected incoming or outgoing payment</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <Link href="/business/finance/import" className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50">
                <span className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-600"><FileSpreadsheet className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">CSV Import</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Import historical or external financial records</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link href="/business/tools" className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50">
                <span className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-600"><RefreshCw className="h-4 w-4" /></span>
                  <span><span className="block text-sm font-semibold text-slate-900">Connected Systems</span><span className="mt-0.5 block text-xs text-slate-500">No financial systems connected yet</span></span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent Transactions</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Financial activity</h2>
                <p className="mt-1 text-sm text-slate-500">Money movement from every supported source will converge here.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500"><ReceiptText className="h-4 w-4" /> {transactions.length} records</div>
            </div>
            {transactions.length === 0 ? (
              <div className="mt-6 flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200"><Banknote className="h-5 w-5" /></div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">No transactions yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Manual transactions, imports, and connected financial systems will populate this activity stream.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                {transactions.slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-4 bg-white p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{transaction.description}</p>
                      <p className="mt-1 text-xs text-slate-500">{transaction.counterparty_name || transaction.source} · {transaction.transaction_date}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${transaction.direction === "in" ? "text-emerald-700" : "text-rose-600"}`}>
                      {transaction.direction === "in" ? "+" : "−"}{formatCurrency(Number(transaction.amount) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-slate-500" /><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Operational Financial Visibility</p></div>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Aether is not your accounting system.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Business Finance brings revenue, expenses, outstanding money, and connected financial activity into an operational view. Your accounting and payment platforms remain the systems of record.</p>
            </div>
            <div className="flex flex-wrap gap-2">{["Manual","CSV","Connected Systems"].map((x)=><span key={x} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">{x}</span>)}</div>
          </div>
        </section>
      </div>

      {manualEntryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Manual Entry</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Add a financial obligation</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Record money you expect to receive or need to pay. This does not record a completed transaction.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualEntryOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={saveManualObligation} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Direction</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualDirection("in")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      manualDirection === "in"
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Money In
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualDirection("out")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      manualDirection === "out"
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Money Out
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={manualAmount}
                    onChange={(event) => setManualAmount(event.target.value)}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Due Date</span>
                  <input
                    type="date"
                    value={manualDueDate}
                    onChange={(event) => setManualDueDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Description</span>
                <input
                  type="text"
                  value={manualDescription}
                  onChange={(event) => setManualDescription(event.target.value)}
                  placeholder="What is this payment for?"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Counterparty</span>
                <input
                  type="text"
                  value={manualCounterparty}
                  onChange={(event) => setManualCounterparty(event.target.value)}
                  placeholder="Customer, vendor, contractor, or other party (optional)"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              {manualError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {manualError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualEntryOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {manualSaving ? "Saving..." : "Save Obligation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
