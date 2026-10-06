"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, BarChart3, Settings, Sparkles, UserRound } from "lucide-react";

type BusinessTrendDepartment = "CRM" | "Marketing" | "Inventory" | "Dispatch" | "Finance";

type CrmTrendPoint = {
  trend_date: string;
  interactions: number;
  follow_ups: number;
};

type MarketingTrendPoint = {
  trend_date: string;
  impressions: number;
  engagements: number;
};

type InventoryTrendPoint = {
  trend_date: string;
  available_inventory: number;
  items_needing_reorder: number;
};

type DispatchTrendPoint = {
  trend_date: string;
  jobs_completed: number;
  active_jobs: number;
};

type FinanceTrendPoint = {
  trend_date: string;
  net_cash_movement: number;
  outstanding_obligations: number;
};

function fillCrmTrendDates(rows: CrmTrendPoint[]) {
  if (rows.length === 0) return [];

  const byDate = new Map(
    rows.map((row) => [
      row.trend_date,
      {
        interactions: Number(row.interactions ?? 0),
        follow_ups: Number(row.follow_ups ?? 0),
      },
    ])
  );

  const sortedDates = [...byDate.keys()].sort();
  const start = new Date(`${sortedDates[0]}T00:00:00`);
  const end = new Date(`${sortedDates[sortedDates.length - 1]}T00:00:00`);
  const filled: CrmTrendPoint[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const dateKey = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, "0"),
      String(cursor.getDate()).padStart(2, "0"),
    ].join("-");
    const values = byDate.get(dateKey) ?? { interactions: 0, follow_ups: 0 };

    filled.push({
      trend_date: dateKey,
      interactions: values.interactions,
      follow_ups: values.follow_ups,
    });
  }

  return filled;
}

function formatTrendDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

const businessTrendDepartments: BusinessTrendDepartment[] = [
  "CRM",
  "Marketing",
  "Inventory",
  "Dispatch",
  "Finance",
];

const businessTrendCopy: Record<BusinessTrendDepartment, string> = {
  CRM: "Customer relationship activity and movement will trend here.",
  Marketing: "Audience, content, and marketing performance will trend here.",
  Inventory: "Inventory movement, purchasing, and stock pressure will trend here.",
  Dispatch: "Job volume, routing, and execution activity will trend here.",
  Finance: "Money movement and financial position will trend here.",
};

export default function BusinessDashboardPage() {
  const [activeTrendDepartment, setActiveTrendDepartment] =
    useState<BusinessTrendDepartment>("CRM");
  const [crmInteractions, setCrmInteractions] = useState<number | null>(null);
  const [crmFollowUps, setCrmFollowUps] = useState<number | null>(null);
  const [marketingImpressions, setMarketingImpressions] = useState<number | null>(null);
  const [marketingEngagements, setMarketingEngagements] = useState<number | null>(null);
  const [inventoryAvailable, setInventoryAvailable] = useState<number | null>(null);
  const [inventoryReorderCount, setInventoryReorderCount] = useState<number | null>(null);
  const [dispatchCompletedCount, setDispatchCompletedCount] = useState<number | null>(null);
  const [dispatchActiveCount, setDispatchActiveCount] = useState<number | null>(null);
  const [financeNetCashMovement, setFinanceNetCashMovement] = useState<number | null>(null);
  const [financeOutstandingObligations, setFinanceOutstandingObligations] = useState<number | null>(null);
  const [crmTrendData, setCrmTrendData] = useState<CrmTrendPoint[]>([]);
  const [marketingTrendData, setMarketingTrendData] = useState<MarketingTrendPoint[]>([]);
  const [inventoryTrendData, setInventoryTrendData] = useState<InventoryTrendPoint[]>([]);
  const [dispatchTrendData, setDispatchTrendData] = useState<DispatchTrendPoint[]>([]);
  const [financeTrendData, setFinanceTrendData] = useState<FinanceTrendPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCrmInteractions() {
      try {
        const contextResponse = await fetch("/api/auth/current-context", { cache: "no-store" });
        if (!contextResponse.ok) return;

        const context = await contextResponse.json();
        const organizationId = context?.organization?.id;
        if (!organizationId) return;

        const supabase = createClient();
        const { count, error } = await supabase
          .from("business_interactions")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId);

        if (error) throw error;

        const { count: followUpCount, error: followUpError } = await supabase
          .from("business_follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId);

        if (followUpError) throw followUpError;

        const { data: impressionTotal, error: marketingError } = await supabase.rpc(
          "get_business_marketing_impressions",
          { p_organization_id: organizationId }
        );

        if (marketingError) throw marketingError;

        const { data: engagementTotal, error: engagementError } = await supabase.rpc(
          "get_business_marketing_engagements",
          { p_organization_id: organizationId }
        );

        if (engagementError) throw engagementError;

        const { data: inventoryAvailableTotal, error: inventoryAvailableError } =
          await supabase.rpc("get_business_inventory_available", {
            p_organization_id: organizationId,
          });

        if (inventoryAvailableError) throw inventoryAvailableError;

        const { data: inventoryReorderTotal, error: inventoryReorderError } =
          await supabase.rpc("get_business_inventory_reorder_count", {
            p_organization_id: organizationId,
          });

        if (inventoryReorderError) throw inventoryReorderError;

        const { data: dispatchCompletedTotal, error: dispatchCompletedError } =
          await supabase.rpc("get_business_dispatch_completed_count", {
            p_organization_id: organizationId,
          });

        if (dispatchCompletedError) throw dispatchCompletedError;

        const { data: dispatchActiveTotal, error: dispatchActiveError } =
          await supabase.rpc("get_business_dispatch_active_count", {
            p_organization_id: organizationId,
          });

        if (dispatchActiveError) throw dispatchActiveError;

        const { data: financeNetCashTotal, error: financeNetCashError } =
          await supabase.rpc("get_business_finance_net_cash_movement", {
            p_organization_id: organizationId,
          });

        if (financeNetCashError) throw financeNetCashError;

        const { data: financeOutstandingTotal, error: financeOutstandingError } =
          await supabase.rpc("get_business_finance_outstanding_obligations", {
            p_organization_id: organizationId,
          });

        if (financeOutstandingError) throw financeOutstandingError;

        const { data: crmTrendRows, error: crmTrendError } = await supabase.rpc(
          "get_business_crm_trends",
          { p_organization_id: organizationId }
        );

        if (crmTrendError) throw crmTrendError;

        const { data: marketingTrendRows, error: marketingTrendError } =
          await supabase.rpc("get_business_marketing_trends", {
            p_organization_id: organizationId,
          });

        if (marketingTrendError) throw marketingTrendError;

        const { data: inventoryTrendRows, error: inventoryTrendError } =
          await supabase.rpc("get_business_inventory_trends", {
            p_organization_id: organizationId,
          });

        if (inventoryTrendError) throw inventoryTrendError;

        const { data: dispatchTrendRows, error: dispatchTrendError } =
          await supabase.rpc("get_business_dispatch_trends", {
            p_organization_id: organizationId,
          });

        if (dispatchTrendError) throw dispatchTrendError;

        const { data: financeTrendRows, error: financeTrendError } =
          await supabase.rpc("get_business_finance_trends", {
            p_organization_id: organizationId,
          });

        if (financeTrendError) throw financeTrendError;

        if (!cancelled) {
          setCrmInteractions(count ?? 0);
          setCrmFollowUps(followUpCount ?? 0);
          setMarketingImpressions(Number(impressionTotal ?? 0));
          setMarketingEngagements(Number(engagementTotal ?? 0));
          setInventoryAvailable(Number(inventoryAvailableTotal ?? 0));
          setInventoryReorderCount(Number(inventoryReorderTotal ?? 0));
          setDispatchCompletedCount(Number(dispatchCompletedTotal ?? 0));
          setDispatchActiveCount(Number(dispatchActiveTotal ?? 0));
          setFinanceNetCashMovement(Number(financeNetCashTotal ?? 0));
          setFinanceOutstandingObligations(Number(financeOutstandingTotal ?? 0));
          setCrmTrendData(
            fillCrmTrendDates(
              ((crmTrendRows ?? []) as CrmTrendPoint[]).map((row) => ({
                trend_date: row.trend_date,
                interactions: Number(row.interactions ?? 0),
                follow_ups: Number(row.follow_ups ?? 0),
              }))
            )
          );
          setMarketingTrendData(
            ((marketingTrendRows ?? []) as MarketingTrendPoint[]).map((row) => ({
              trend_date: row.trend_date,
              impressions: Number(row.impressions ?? 0),
              engagements: Number(row.engagements ?? 0),
            }))
          );
          setInventoryTrendData(
            ((inventoryTrendRows ?? []) as InventoryTrendPoint[]).map((row) => ({
              trend_date: row.trend_date,
              available_inventory: Number(row.available_inventory ?? 0),
              items_needing_reorder: Number(row.items_needing_reorder ?? 0),
            }))
          );
          setDispatchTrendData(
            ((dispatchTrendRows ?? []) as DispatchTrendPoint[]).map((row) => ({
              trend_date: row.trend_date,
              jobs_completed: Number(row.jobs_completed ?? 0),
              active_jobs: Number(row.active_jobs ?? 0),
            }))
          );
          setFinanceTrendData(
            ((financeTrendRows ?? []) as FinanceTrendPoint[]).map((row) => ({
              trend_date: row.trend_date,
              net_cash_movement: Number(row.net_cash_movement ?? 0),
              outstanding_obligations: Number(row.outstanding_obligations ?? 0),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load CRM interaction count", error);
      }
    }

    void loadCrmInteractions();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <Activity className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Executive business hub
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Business Hub
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                See operational health, spot pressure fast, and understand where
                attention is needed before moving into execution.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-2">
            <Link
              href="/business/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <UserRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              My Profile
            </Link>

            <Link
              href="/business/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Settings className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Admin Control
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-fuchsia-200 bg-white p-2 text-fuchsia-800 lg:rounded-xl">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-fuchsia-800 lg:text-[11px]">A.B.E.</p>
            <h2 className="text-2xl font-semibold text-fuchsia-950">
              Business intelligence is taking shape.
            </h2>
            <p className="max-w-3xl text-sm text-slate-700 lg:text-[11px]">
              A.B.E. will interpret operational reality across CRM, Marketing, Inventory,
              Dispatch, and Finance. For now, this space establishes the executive read
              before the supporting analytics below.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 lg:space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 lg:text-[11px]">
          <BarChart3 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
          Business Trends
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">
                {activeTrendDepartment} Trends
              </p>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                View the operational trend for the selected business module.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {businessTrendDepartments.map((department) => {
                const isActive = activeTrendDepartment === department;

                return (
                  <button
                    key={department}
                    type="button"
                    onClick={() => setActiveTrendDepartment(department)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition lg:text-[11px] ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    aria-pressed={isActive}
                  >
                    {department}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTrendDepartment === "CRM" ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl">
              {crmTrendData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 bg-slate-900" />
                      Interactions
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 border-t-2 border-dashed border-slate-500" />
                      Follow-Ups
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox="0 0 900 260"
                      className="h-64 min-w-[700px] w-full"
                      role="img"
                      aria-label="CRM interactions and follow-ups over time"
                    >
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y = 20 + step * 45;
                        return (
                          <line
                            key={step}
                            x1="55"
                            x2="875"
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-slate-200"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {(() => {
                        const maxValue = Math.max(
                          1,
                          ...crmTrendData.flatMap((point) => [
                            point.interactions,
                            point.follow_ups,
                          ])
                        );
                        const chartLeft = 55;
                        const chartRight = 875;
                        const chartTop = 20;
                        const chartBottom = 200;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;
                        const xFor = (index: number) =>
                          crmTrendData.length === 1
                            ? chartLeft + chartWidth / 2
                            : chartLeft +
                              (index / (crmTrendData.length - 1)) * chartWidth;
                        const yFor = (value: number) =>
                          chartBottom - (value / maxValue) * chartHeight;
                        const interactionPoints = crmTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.interactions)}`
                          )
                          .join(" ");
                        const followUpPoints = crmTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.follow_ups)}`
                          )
                          .join(" ");

                        return (
                          <>
                            <line
                              x1={chartLeft}
                              x2={chartLeft}
                              y1={chartTop}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />
                            <line
                              x1={chartLeft}
                              x2={chartRight}
                              y1={chartBottom}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />

                            <text
                              x="45"
                              y={chartTop + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              {maxValue}
                            </text>
                            <text
                              x="45"
                              y={chartBottom + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              0
                            </text>

                            <polyline
                              points={interactionPoints}
                              fill="none"
                              stroke="currentColor"
                              className="text-slate-900"
                              strokeWidth="3"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                            <polyline
                              points={followUpPoints}
                              fill="none"
                              stroke="currentColor"
                              className="text-slate-500"
                              strokeWidth="3"
                              strokeDasharray="7 6"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />

                            {crmTrendData.map((point, index) => (
                              <g key={point.trend_date}>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.interactions)}
                                  r="4"
                                  fill="currentColor"
                                  className="text-slate-900"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.interactions} interactions`}
                                  </title>
                                </circle>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.follow_ups)}
                                  r="4"
                                  fill="white"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-slate-500"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.follow_ups} follow-ups`}
                                  </title>
                                </circle>
                                <text
                                  x={xFor(index)}
                                  y="228"
                                  textAnchor="middle"
                                  className="fill-slate-500 text-[11px]"
                                >
                                  {formatTrendDate(point.trend_date)}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center px-6 text-center">
                  <p className="max-w-md text-sm text-slate-500 lg:text-[11px]">
                    No CRM trend activity yet.
                  </p>
                </div>
              )}
            </div>
          ) : activeTrendDepartment === "Marketing" ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl">
              {marketingTrendData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 bg-slate-900" />
                      Impressions
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 border-t-2 border-dashed border-slate-500" />
                      Engagement
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox="0 0 900 260"
                      className="h-64 min-w-[700px] w-full"
                      role="img"
                      aria-label="Marketing impressions and engagement over time"
                    >
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y = 20 + step * 45;
                        return (
                          <line
                            key={step}
                            x1="55"
                            x2="875"
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-slate-200"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {(() => {
                        const maxValue = Math.max(
                          1,
                          ...marketingTrendData.flatMap((point) => [
                            point.impressions,
                            point.engagements,
                          ])
                        );
                        const chartLeft = 55;
                        const chartRight = 875;
                        const chartTop = 20;
                        const chartBottom = 200;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;
                        const xFor = (index: number) =>
                          marketingTrendData.length === 1
                            ? chartLeft + chartWidth / 2
                            : chartLeft +
                              (index / (marketingTrendData.length - 1)) * chartWidth;
                        const yFor = (value: number) =>
                          chartBottom - (value / maxValue) * chartHeight;
                        const impressionPoints = marketingTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.impressions)}`
                          )
                          .join(" ");
                        const engagementPoints = marketingTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.engagements)}`
                          )
                          .join(" ");
                        const labelEvery = Math.max(
                          1,
                          Math.ceil(marketingTrendData.length / 7)
                        );

                        return (
                          <>
                            <line
                              x1={chartLeft}
                              x2={chartLeft}
                              y1={chartTop}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />
                            <line
                              x1={chartLeft}
                              x2={chartRight}
                              y1={chartBottom}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />

                            <text
                              x="45"
                              y={chartTop + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              {maxValue.toLocaleString()}
                            </text>
                            <text
                              x="45"
                              y={chartBottom + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              0
                            </text>

                            <polyline
                              points={impressionPoints}
                              fill="none"
                              stroke="currentColor"
                              className="text-slate-900"
                              strokeWidth="3"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                            <polyline
                              points={engagementPoints}
                              fill="none"
                              stroke="currentColor"
                              className="text-slate-500"
                              strokeWidth="3"
                              strokeDasharray="7 6"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />

                            {marketingTrendData.map((point, index) => (
                              <g key={point.trend_date}>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.impressions)}
                                  r="3"
                                  fill="currentColor"
                                  className="text-slate-900"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.impressions.toLocaleString()} impressions`}
                                  </title>
                                </circle>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.engagements)}
                                  r="3"
                                  fill="white"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-slate-500"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.engagements.toLocaleString()} engagements`}
                                  </title>
                                </circle>

                                {(index % labelEvery === 0 ||
                                  index === marketingTrendData.length - 1) && (
                                  <text
                                    x={xFor(index)}
                                    y="228"
                                    textAnchor="middle"
                                    className="fill-slate-500 text-[11px]"
                                  >
                                    {formatTrendDate(point.trend_date)}
                                  </text>
                                )}
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center px-6 text-center">
                  <p className="max-w-md text-sm text-slate-500 lg:text-[11px]">
                    No Marketing trend activity yet.
                  </p>
                </div>
              )}
            </div>
          ) : activeTrendDepartment === "Inventory" ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl">
              {inventoryTrendData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 bg-slate-900" />
                      Available Inventory
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 border-t-2 border-dashed border-slate-500" />
                      Items Needing Reorder
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox="0 0 900 260"
                      className="h-64 min-w-[700px] w-full"
                      role="img"
                      aria-label="Available inventory and items needing reorder over time"
                    >
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y = 20 + step * 45;
                        return (
                          <line
                            key={step}
                            x1="55"
                            x2="875"
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-slate-200"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {(() => {
                        const maxValue = Math.max(
                          1,
                          ...inventoryTrendData.flatMap((point) => [
                            point.available_inventory,
                            point.items_needing_reorder,
                          ])
                        );
                        const chartLeft = 55;
                        const chartRight = 875;
                        const chartTop = 20;
                        const chartBottom = 200;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;
                        const xFor = (index: number) =>
                          inventoryTrendData.length === 1
                            ? chartLeft + chartWidth / 2
                            : chartLeft +
                              (index / (inventoryTrendData.length - 1)) * chartWidth;
                        const yFor = (value: number) =>
                          chartBottom - (value / maxValue) * chartHeight;
                        const availablePoints = inventoryTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.available_inventory)}`
                          )
                          .join(" ");
                        const reorderPoints = inventoryTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.items_needing_reorder)}`
                          )
                          .join(" ");

                        return (
                          <>
                            <line
                              x1={chartLeft}
                              x2={chartLeft}
                              y1={chartTop}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />
                            <line
                              x1={chartLeft}
                              x2={chartRight}
                              y1={chartBottom}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />

                            <text
                              x="45"
                              y={chartTop + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              {maxValue.toLocaleString()}
                            </text>
                            <text
                              x="45"
                              y={chartBottom + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              0
                            </text>

                            {inventoryTrendData.length > 1 && (
                              <>
                                <polyline
                                  points={availablePoints}
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-900"
                                  strokeWidth="3"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                <polyline
                                  points={reorderPoints}
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-500"
                                  strokeWidth="3"
                                  strokeDasharray="7 6"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                              </>
                            )}

                            {inventoryTrendData.map((point, index) => (
                              <g key={point.trend_date}>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.available_inventory)}
                                  r={inventoryTrendData.length === 1 ? "6" : "4"}
                                  fill="currentColor"
                                  className="text-slate-900"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.available_inventory.toLocaleString()} available`}
                                  </title>
                                </circle>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.items_needing_reorder)}
                                  r={inventoryTrendData.length === 1 ? "6" : "4"}
                                  fill="white"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-slate-500"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.items_needing_reorder.toLocaleString()} needing reorder`}
                                  </title>
                                </circle>
                                <text
                                  x={xFor(index)}
                                  y="228"
                                  textAnchor="middle"
                                  className="fill-slate-500 text-[11px]"
                                >
                                  {formatTrendDate(point.trend_date)}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {inventoryTrendData.length === 1 && (
                    <p className="text-center text-xs text-slate-500">
                      Inventory history begins with this snapshot. Trend lines will build as new snapshots are recorded.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center px-6 text-center">
                  <p className="max-w-md text-sm text-slate-500 lg:text-[11px]">
                    No Inventory trend snapshots yet.
                  </p>
                </div>
              )}
            </div>
          ) : activeTrendDepartment === "Dispatch" ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl">
              {dispatchTrendData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 bg-slate-900" />
                      Jobs Completed
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 border-t-2 border-dashed border-slate-500" />
                      Active Jobs
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox="0 0 900 260"
                      className="h-64 min-w-[700px] w-full"
                      role="img"
                      aria-label="Completed and active dispatch jobs over time"
                    >
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y = 20 + step * 45;
                        return (
                          <line
                            key={step}
                            x1="55"
                            x2="875"
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-slate-200"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {(() => {
                        const maxValue = Math.max(
                          1,
                          ...dispatchTrendData.flatMap((point) => [
                            point.jobs_completed,
                            point.active_jobs,
                          ])
                        );
                        const chartLeft = 55;
                        const chartRight = 875;
                        const chartTop = 20;
                        const chartBottom = 200;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;
                        const xFor = (index: number) =>
                          dispatchTrendData.length === 1
                            ? chartLeft + chartWidth / 2
                            : chartLeft +
                              (index / (dispatchTrendData.length - 1)) * chartWidth;
                        const yFor = (value: number) =>
                          chartBottom - (value / maxValue) * chartHeight;
                        const completedPoints = dispatchTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.jobs_completed)}`
                          )
                          .join(" ");
                        const activePoints = dispatchTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.active_jobs)}`
                          )
                          .join(" ");

                        return (
                          <>
                            <line
                              x1={chartLeft}
                              x2={chartLeft}
                              y1={chartTop}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />
                            <line
                              x1={chartLeft}
                              x2={chartRight}
                              y1={chartBottom}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />

                            <text
                              x="45"
                              y={chartTop + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              {maxValue.toLocaleString()}
                            </text>
                            <text
                              x="45"
                              y={chartBottom + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              0
                            </text>

                            {dispatchTrendData.length > 1 && (
                              <>
                                <polyline
                                  points={completedPoints}
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-900"
                                  strokeWidth="3"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                <polyline
                                  points={activePoints}
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-500"
                                  strokeWidth="3"
                                  strokeDasharray="7 6"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                              </>
                            )}

                            {dispatchTrendData.map((point, index) => (
                              <g key={point.trend_date}>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.jobs_completed)}
                                  r={dispatchTrendData.length === 1 ? "6" : "4"}
                                  fill="currentColor"
                                  className="text-slate-900"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.jobs_completed.toLocaleString()} jobs completed`}
                                  </title>
                                </circle>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.active_jobs)}
                                  r={dispatchTrendData.length === 1 ? "6" : "4"}
                                  fill="white"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-slate-500"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — ${point.active_jobs.toLocaleString()} active jobs`}
                                  </title>
                                </circle>
                                <text
                                  x={xFor(index)}
                                  y="228"
                                  textAnchor="middle"
                                  className="fill-slate-500 text-[11px]"
                                >
                                  {formatTrendDate(point.trend_date)}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {dispatchTrendData.length === 1 && (
                    <p className="text-center text-xs text-slate-500">
                      Dispatch history begins with this snapshot. Trend lines will build as new snapshots are recorded.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center px-6 text-center">
                  <p className="max-w-md text-sm text-slate-500 lg:text-[11px]">
                    No Dispatch trend snapshots yet.
                  </p>
                </div>
              )}
            </div>
          ) : activeTrendDepartment === "Finance" ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl">
              {financeTrendData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 bg-slate-900" />
                      Net Cash Movement
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-0.5 w-6 border-t-2 border-dashed border-slate-500" />
                      Outstanding Obligations
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox="0 0 900 260"
                      className="h-64 min-w-[700px] w-full"
                      role="img"
                      aria-label="Net cash movement and outstanding obligations over time"
                    >
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y = 20 + step * 45;
                        return (
                          <line
                            key={step}
                            x1="55"
                            x2="875"
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-slate-200"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {(() => {
                        const allValues = financeTrendData.flatMap((point) => [
                          point.net_cash_movement,
                          point.outstanding_obligations,
                        ]);
                        const minValue = Math.min(0, ...allValues);
                        const maxValue = Math.max(0, ...allValues);
                        const valueRange = Math.max(1, maxValue - minValue);
                        const chartLeft = 55;
                        const chartRight = 875;
                        const chartTop = 20;
                        const chartBottom = 200;
                        const chartWidth = chartRight - chartLeft;
                        const chartHeight = chartBottom - chartTop;
                        const xFor = (index: number) =>
                          financeTrendData.length === 1
                            ? chartLeft + chartWidth / 2
                            : chartLeft +
                              (index / (financeTrendData.length - 1)) * chartWidth;
                        const yFor = (value: number) =>
                          chartBottom - ((value - minValue) / valueRange) * chartHeight;
                        const cashPoints = financeTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.net_cash_movement)}`
                          )
                          .join(" ");
                        const obligationPoints = financeTrendData
                          .map(
                            (point, index) =>
                              `${xFor(index)},${yFor(point.outstanding_obligations)}`
                          )
                          .join(" ");
                        const zeroY = yFor(0);
                        const labelEvery = Math.max(
                          1,
                          Math.ceil(financeTrendData.length / 7)
                        );

                        return (
                          <>
                            <line
                              x1={chartLeft}
                              x2={chartLeft}
                              y1={chartTop}
                              y2={chartBottom}
                              stroke="currentColor"
                              className="text-slate-300"
                            />
                            <line
                              x1={chartLeft}
                              x2={chartRight}
                              y1={zeroY}
                              y2={zeroY}
                              stroke="currentColor"
                              className="text-slate-300"
                            />

                            <text
                              x="45"
                              y={chartTop + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              ${maxValue.toLocaleString()}
                            </text>
                            <text
                              x="45"
                              y={chartBottom + 4}
                              textAnchor="end"
                              className="fill-slate-500 text-[11px]"
                            >
                              ${minValue.toLocaleString()}
                            </text>

                            {financeTrendData.length > 1 && (
                              <>
                                <polyline
                                  points={cashPoints}
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-900"
                                  strokeWidth="3"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                <polyline
                                  points={obligationPoints}
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-500"
                                  strokeWidth="3"
                                  strokeDasharray="7 6"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                              </>
                            )}

                            {financeTrendData.map((point, index) => (
                              <g key={point.trend_date}>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.net_cash_movement)}
                                  r={financeTrendData.length === 1 ? "6" : "4"}
                                  fill="currentColor"
                                  className="text-slate-900"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — $${point.net_cash_movement.toLocaleString()} net cash movement`}
                                  </title>
                                </circle>
                                <circle
                                  cx={xFor(index)}
                                  cy={yFor(point.outstanding_obligations)}
                                  r={financeTrendData.length === 1 ? "6" : "4"}
                                  fill="white"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-slate-500"
                                >
                                  <title>
                                    {`${formatTrendDate(point.trend_date)} — $${point.outstanding_obligations.toLocaleString()} outstanding obligations`}
                                  </title>
                                </circle>

                                {(index % labelEvery === 0 ||
                                  index === financeTrendData.length - 1) && (
                                  <text
                                    x={xFor(index)}
                                    y="228"
                                    textAnchor="middle"
                                    className="fill-slate-500 text-[11px]"
                                  >
                                    {formatTrendDate(point.trend_date)}
                                  </text>
                                )}
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {financeTrendData.length === 1 && (
                    <p className="text-center text-xs text-slate-500">
                      Finance history currently contains one day of activity. Trend lines will build as additional dated activity is recorded.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center px-6 text-center">
                  <p className="max-w-md text-sm text-slate-500 lg:text-[11px]">
                    No Finance trend activity yet.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 lg:space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 lg:text-[11px]">
          <Activity className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
          Operational Analytics
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 lg:gap-3">
          {[
            ["CRM", "Interactions", "Follow-Ups"],
            ["Marketing", "Impressions", "Engagement"],
            ["Inventory", "Available Inventory", "Items Needing Reorder"],
            ["Dispatch", "Jobs Completed", "Active Jobs"],
            ["Finance", "Net Cash Movement", "Outstanding Obligations"],
          ].map(([department, metricOne, metricTwo]) => (
            <div
              key={department}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-[18px]"
            >
              <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">
                {department}
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                  <p className="text-sm text-slate-500 lg:text-[11px]">{metricOne}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {department === "CRM" && metricOne === "Interactions"
                      ? crmInteractions ?? "—"
                      : department === "Marketing" && metricOne === "Impressions"
                        ? marketingImpressions ?? "—"
                        : department === "Inventory" && metricOne === "Available Inventory"
                          ? inventoryAvailable ?? "—"
                          : department === "Dispatch" && metricOne === "Jobs Completed"
                            ? dispatchCompletedCount ?? "—"
                            : department === "Finance" && metricOne === "Net Cash Movement"
                              ? financeNetCashMovement ?? "—"
                              : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                  <p className="text-sm text-slate-500 lg:text-[11px]">{metricTwo}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {department === "CRM" && metricTwo === "Follow-Ups"
                      ? crmFollowUps ?? "—"
                      : department === "Marketing" && metricTwo === "Engagement"
                        ? marketingEngagements ?? "—"
                        : department === "Inventory" && metricTwo === "Items Needing Reorder"
                          ? inventoryReorderCount ?? "—"
                          : department === "Dispatch" && metricTwo === "Active Jobs"
                            ? dispatchActiveCount ?? "—"
                            : department === "Finance" && metricTwo === "Outstanding Obligations"
                              ? financeOutstandingObligations ?? "—"
                              : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
