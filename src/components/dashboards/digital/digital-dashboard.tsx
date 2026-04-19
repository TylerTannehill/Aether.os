"use client";

import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";

const kpis = [
  {
    title: "Ad Spend",
    value: "$42,860",
    change: "+12.4%",
    detail: "vs last 30 days",
    icon: CircleDollarSign,
  },
  {
    title: "Leads Generated",
    value: "1,284",
    change: "+18.1%",
    detail: "qualified form fills",
    icon: Users,
  },
  {
    title: "CTR",
    value: "4.82%",
    change: "+0.9%",
    detail: "across active campaigns",
    icon: MousePointerClick,
  },
  {
    title: "Conversion Rate",
    value: "7.14%",
    change: "+1.2%",
    detail: "click to action",
    icon: TrendingUp,
  },
];

const campaigns = [
  {
    name: "Spring Member Drive",
    channel: "Meta",
    budget: "$12,000",
    leads: 342,
    ctr: "5.4%",
    status: "Active",
  },
  {
    name: "Volunteer Recruitment",
    channel: "Google",
    budget: "$8,500",
    leads: 211,
    ctr: "4.7%",
    status: "Active",
  },
  {
    name: "Petition Awareness",
    channel: "YouTube",
    budget: "$6,200",
    leads: 119,
    ctr: "3.8%",
    status: "Optimizing",
  },
  {
    name: "Community Push",
    channel: "Email",
    budget: "$2,900",
    leads: 166,
    ctr: "6.2%",
    status: "Active",
  },
  {
    name: "Retargeting Batch 04",
    channel: "Display",
    budget: "$4,100",
    leads: 88,
    ctr: "2.9%",
    status: "Review",
  },
];

const channelPerformance = [
  { channel: "Meta Ads", performance: 82, cpl: "$31", roas: "3.6x" },
  { channel: "Google Search", performance: 76, cpl: "$28", roas: "4.1x" },
  { channel: "YouTube", performance: 61, cpl: "$44", roas: "2.8x" },
  { channel: "Email", performance: 88, cpl: "$12", roas: "6.3x" },
];

const funnelSteps = [
  { label: "Impressions", value: "418,000", percent: 100 },
  { label: "Clicks", value: "20,148", percent: 62 },
  { label: "Leads", value: "1,284", percent: 34 },
  { label: "Conversions", value: "612", percent: 18 },
];

const tasks = [
  "Refresh underperforming display creative",
  "Review Google keyword exclusions",
  "Finalize April audience segmentation",
  "Launch retargeting follow-up email",
];

function statusClasses(status: string) {
  if (status === "Active") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  if (status === "Optimizing") {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export function DigitalDashboard() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BarChart3 className="h-4 w-4" />
              Digital performance command center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Digital Dashboard
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                Monitor spend, lead generation, conversion performance, and
                campaign health from one clean operating view.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Last 30 Days
            </button>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Export
            </button>
            <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
              New Campaign
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">
                  {item.change}
                </span>
                <span className="text-slate-500">{item.detail}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Active Campaigns
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Current campaign performance snapshot across active channels.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 sm:flex sm:items-center sm:gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Performance up
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Campaign
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Channel
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Budget
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Leads
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    CTR
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.name} className="bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {campaign.channel}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {campaign.budget}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {campaign.leads}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {campaign.ctr}
                    </td>
                    <td className="rounded-r-2xl px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Digital Funnel
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Top-line pipeline from traffic to action.
            </p>
          </div>

          <div className="space-y-5">
            {funnelSteps.map((step) => (
              <div key={step.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {step.label}
                  </span>
                  <span className="text-slate-500">{step.value}</span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-slate-900"
                    style={{ width: `${step.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Channel Performance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Efficiency and return by channel.
            </p>
          </div>

          <div className="space-y-4">
            {channelPerformance.map((item) => (
              <div
                key={item.channel}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.channel}</p>
                    <p className="text-sm text-slate-500">
                      CPL {item.cpl} • ROAS {item.roas}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {item.performance}%
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-slate-200">
                  <div
                    className="h-2.5 rounded-full bg-slate-900"
                    style={{ width: `${item.performance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <CheckCircle2 className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Priority Actions
                </h2>
                <p className="text-sm text-slate-500">
                  Immediate next steps for the digital team
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-medium text-slate-900">{task}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep momentum high and close the loop this sprint.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Executive Snapshot
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Best Channel</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Email
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Top Campaign</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Spring Drive
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ROAS Trend</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Rising
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}