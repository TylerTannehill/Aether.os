"use client";

import { useMemo, useState } from "react";

type Domain = "finance" | "digital" | "field" | "print";
type FinanceMetric = "money_in" | "money_out" | "net" | "pledges";
type DigitalMetric = "impressions" | "engagement" | "sentiment" | "spend";
type FieldMetric = "doors" | "conversations" | "ids" | "completion";
type PrintMetric = "on_hand" | "orders" | "approval_ready" | "delivery_risk";
type TimeRange = "day" | "week" | "month" | "quarter" | "cycle";

interface Props {
  finance: {
    moneyIn: number;
    moneyOut: number;
    net: number;
    pledges: number;
  };
  digital: {
    impressions: number;
    engagement: number;
    spend: number;
    sentimentPositive: number;
    sentimentNegative: number;
  };
  field: {
    doors: number;
    conversations: number;
    ids: number;
    completion: number;
  };
  print: {
    onHand: number;
    orders: number;
    approvalReady: number;
    deliveryRisk: number;
  };
}

type ChartPoint = {
  label: string;
  value: number;
};

const TIME_RANGE_LABELS: Record<TimeRange, string[]> = {
  day: ["6a", "9a", "12p", "3p", "6p", "9p"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: ["W1", "W2", "W3", "W4"],
  quarter: ["M1", "M2", "M3"],
  cycle: ["Q1", "Q2", "Q3", "Q4", "Final"],
};

export default function CrossDomainChart({
  finance,
  digital,
  field,
  print,
}: Props) {
  const [domain, setDomain] = useState<Domain>("finance");
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [financeMetric, setFinanceMetric] =
    useState<FinanceMetric>("money_in");
  const [digitalMetric, setDigitalMetric] =
    useState<DigitalMetric>("impressions");
  const [fieldMetric, setFieldMetric] = useState<FieldMetric>("doors");
  const [printMetric, setPrintMetric] =
    useState<PrintMetric>("approval_ready");

  const activeMetric = useMemo(() => {
    switch (domain) {
      case "finance":
        return financeMetric;
      case "digital":
        return digitalMetric;
      case "field":
        return fieldMetric;
      case "print":
        return printMetric;
      default:
        return financeMetric;
    }
  }, [domain, financeMetric, digitalMetric, fieldMetric, printMetric]);

  const chartData = useMemo<ChartPoint[]>(() => {
    const labels = TIME_RANGE_LABELS[timeRange];

    if (domain === "finance") {
      const value = finance[financeMetricMap(financeMetric)];
      return buildSeries(labels, value, timeRange, financeMetric);
    }

    if (domain === "digital") {
      if (digitalMetric === "sentiment") {
        const sentimentBase = Math.max(
          digital.sentimentPositive - digital.sentimentNegative,
          1
        );
        return buildSeries(labels, sentimentBase, timeRange, digitalMetric);
      }

      const value = digital[digitalMetricMap(digitalMetric)];
      return buildSeries(labels, value, timeRange, digitalMetric);
    }

    if (domain === "field") {
      const value = field[fieldMetricMap(fieldMetric)];
      return buildSeries(labels, value, timeRange, fieldMetric);
    }

    const value = print[printMetricMap(printMetric)];
    return buildSeries(labels, value, timeRange, printMetric);
  }, [
    domain,
    finance,
    digital,
    field,
    print,
    financeMetric,
    digitalMetric,
    fieldMetric,
    printMetric,
    timeRange,
  ]);

  const maxValue = Math.max(...chartData.map((point) => point.value), 1);

  const svgPoints = chartData
    .map((point, index) => {
      const x =
        chartData.length === 1
          ? 50
          : (index / (chartData.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const activeValueLabel = useMemo(() => {
    if (domain === "finance") {
      switch (financeMetric) {
        case "money_in":
          return `$${finance.moneyIn.toLocaleString()}`;
        case "money_out":
          return `$${finance.moneyOut.toLocaleString()}`;
        case "net":
          return `$${finance.net.toLocaleString()}`;
        case "pledges":
          return `$${finance.pledges.toLocaleString()}`;
      }
    }

    if (domain === "digital") {
      switch (digitalMetric) {
        case "impressions":
          return digital.impressions.toLocaleString();
        case "engagement":
          return digital.engagement.toLocaleString();
        case "spend":
          return `$${digital.spend.toLocaleString()}`;
        case "sentiment":
          return `${digital.sentimentPositive}% / ${digital.sentimentNegative}%`;
      }
    }

    if (domain === "field") {
      switch (fieldMetric) {
        case "doors":
          return field.doors.toLocaleString();
        case "conversations":
          return field.conversations.toLocaleString();
        case "ids":
          return field.ids.toLocaleString();
        case "completion":
          return `${field.completion}%`;
      }
    }

    switch (printMetric) {
      case "on_hand":
        return print.onHand.toLocaleString();
      case "orders":
        return print.orders.toLocaleString();
      case "approval_ready":
        return print.approvalReady.toLocaleString();
      case "delivery_risk":
        return `${print.deliveryRisk}`;
    }
  }, [
    domain,
    financeMetric,
    digitalMetric,
    fieldMetric,
    printMetric,
    finance,
    digital,
    field,
    print,
  ]);

  const summaryCopy = useMemo(() => {
    if (domain === "finance") {
      switch (financeMetric) {
        case "money_in":
          return "Track revenue pace coming into the campaign.";
        case "money_out":
          return "Watch outgoing spend and pressure on cash flow.";
        case "net":
          return "See whether finance is strengthening or tightening.";
        case "pledges":
          return "Measure dollars still waiting to be collected.";
      }
    }

    if (domain === "digital") {
      switch (digitalMetric) {
        case "impressions":
          return "Track how much reach current digital efforts are creating.";
        case "engagement":
          return "Watch audience response and interaction momentum.";
        case "spend":
          return "Monitor how much digital pressure is costing.";
        case "sentiment":
          return "Watch positive versus negative signal over time.";
      }
    }

    if (domain === "field") {
      switch (fieldMetric) {
        case "doors":
          return "Track field touch volume across active turf work.";
        case "conversations":
          return "See whether canvass engagement is moving in the right direction.";
        case "ids":
          return "Track voter identification output across field efforts.";
        case "completion":
          return "Watch turf completion pace and possible rebalancing pressure.";
      }
    }

    switch (printMetric) {
      case "on_hand":
        return "Monitor print inventory that is available to deploy.";
      case "orders":
        return "Track active print orders moving through production.";
      case "approval_ready":
        return "Watch how many print assets are ready for release.";
      case "delivery_risk":
        return "Monitor print-side delivery risk and operational friction.";
    }
  }, [domain, financeMetric, digitalMetric, fieldMetric, printMetric]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Performance Lens</p>
          <h2 className="text-xl font-semibold text-slate-900">
            Cross-Domain Trends
          </h2>
          <p className="mt-1 text-sm text-slate-500">{summaryCopy}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Current view
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {domain.toUpperCase()} ·{" "}
            {String(activeMetric).replaceAll("_", " ").toUpperCase()}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {activeValueLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["finance", "digital", "field", "print"] as Domain[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setDomain(item)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              domain === item
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["day", "week", "month", "quarter", "cycle"] as TimeRange[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTimeRange(item)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                timeRange === item
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {item.toUpperCase()}
            </button>
          )
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {domain === "finance"
          ? (["money_in", "money_out", "net", "pledges"] as FinanceMetric[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFinanceMetric(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    financeMetric === item
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item.replace("_", " ").toUpperCase()}
                </button>
              )
            )
          : null}

        {domain === "digital"
          ? (["impressions", "engagement", "sentiment", "spend"] as DigitalMetric[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDigitalMetric(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    digitalMetric === item
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item.toUpperCase()}
                </button>
              )
            )
          : null}

        {domain === "field"
          ? (["doors", "conversations", "ids", "completion"] as FieldMetric[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFieldMetric(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    fieldMetric === item
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item.toUpperCase()}
                </button>
              )
            )
          : null}

        {domain === "print"
          ? ([
              "on_hand",
              "orders",
              "approval_ready",
              "delivery_risk",
            ] as PrintMetric[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrintMetric(item)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  printMetric === item
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {item.replaceAll("_", " ").toUpperCase()}
              </button>
            ))
          : null}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="h-64 w-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            {[20, 40, 60, 80].map((line) => (
              <line
                key={line}
                x1="0"
                y1={line}
                x2="100"
                y2={line}
                stroke="currentColor"
                className="text-slate-200"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <polyline
              fill="none"
              stroke="currentColor"
              className="text-slate-900"
              strokeWidth="2.5"
              points={svgPoints}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {chartData.map((point, index) => {
              const x =
                chartData.length === 1
                  ? 50
                  : (index / (chartData.length - 1)) * 100;
              const y = 100 - (point.value / maxValue) * 100;

              return (
                <circle
                  key={`${point.label}-${index}`}
                  cx={x}
                  cy={y}
                  r="2.2"
                  fill="currentColor"
                  className="text-slate-900"
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {chartData.map((point) => (
            <div key={point.label} className="text-center">
              <p className="text-xs font-medium text-slate-500">{point.label}</p>
              <p className="mt-1 text-xs text-slate-700">
                {formatCompactValue(point.value, domain, activeMetric)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function financeMetricMap(metric: FinanceMetric) {
  switch (metric) {
    case "money_in":
      return "moneyIn";
    case "money_out":
      return "moneyOut";
    case "net":
      return "net";
    case "pledges":
      return "pledges";
  }
}

function digitalMetricMap(metric: DigitalMetric) {
  switch (metric) {
    case "impressions":
      return "impressions";
    case "engagement":
      return "engagement";
    case "spend":
      return "spend";
    case "sentiment":
      return "sentimentPositive";
  }
}

function fieldMetricMap(metric: FieldMetric) {
  switch (metric) {
    case "doors":
      return "doors";
    case "conversations":
      return "conversations";
    case "ids":
      return "ids";
    case "completion":
      return "completion";
  }
}

function printMetricMap(metric: PrintMetric) {
  switch (metric) {
    case "on_hand":
      return "onHand";
    case "orders":
      return "orders";
    case "approval_ready":
      return "approvalReady";
    case "delivery_risk":
      return "deliveryRisk";
  }
}

function buildSeries(
  labels: string[],
  baseValue: number,
  timeRange: TimeRange,
  metric: FinanceMetric | DigitalMetric | FieldMetric | PrintMetric
): ChartPoint[] {
  const patternsByRange: Record<TimeRange, number[]> = {
    day: [0.72, 0.81, 0.95, 1.04, 0.98, 1.08],
    week: [0.74, 0.79, 0.88, 0.93, 1.02, 1.07, 1.12],
    month: [0.76, 0.89, 0.97, 1.1],
    quarter: [0.82, 0.94, 1.08],
    cycle: [0.68, 0.79, 0.91, 1.02, 1.14],
  };

  const pattern = patternsByRange[timeRange];

  return labels.map((label, index) => {
    const multiplier = pattern[index] ?? 1;
    let adjustedValue = Math.max(Math.round(baseValue * multiplier), 1);

    if (metric === "sentiment" || metric === "completion") {
      adjustedValue = Math.max(Math.min(adjustedValue, 100), 1);
    }

    return {
      label,
      value: adjustedValue,
    };
  });
}

function formatCompactValue(
  value: number,
  domain: Domain,
  metric: FinanceMetric | DigitalMetric | FieldMetric | PrintMetric
) {
  if (domain === "finance") {
    return `$${value.toLocaleString()}`;
  }

  if (domain === "digital") {
    if (metric === "spend") {
      return `$${value.toLocaleString()}`;
    }

    if (metric === "sentiment") {
      return `${value}%`;
    }

    return value.toLocaleString();
  }

  if (domain === "field") {
    if (metric === "completion") {
      return `${value}%`;
    }

    return value.toLocaleString();
  }

  return value.toLocaleString();
}