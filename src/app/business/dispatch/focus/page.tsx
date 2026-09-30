"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  MapPinned,
  Navigation,
  Play,
  Route,
  Truck,
  UserRoundCheck,
  Zap,
} from "lucide-react";

type FocusPriority = "high" | "medium" | "low";

type AssignmentFocusItem = {
  id: string;
  jobId: string;
  jobName: string;
  customerName: string | null;
  address: string;
  scheduledWindow: string | null;
  priority: FocusPriority;
};

type RoutingFocusItem = {
  id: string;
  jobId: string;
  jobName: string;
  address: string;
  assigneeName: string | null;
  reason: "needs_route" | "route_conflict";
  priority: FocusPriority;
};

type ExecutionFocusItem = {
  id: string;
  jobId: string;
  jobName: string;
  customerName: string | null;
  address: string;
  assigneeName: string | null;
  status: "scheduled" | "in_progress";
  priority: FocusPriority;
};

function priorityClasses(priority: FocusPriority) {
  switch (priority) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function PriorityBadge({ priority }: { priority: FocusPriority }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClasses(
        priority
      )}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function EmptyLane({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <Icon className="mx-auto h-5 w-5 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

export default function BusinessDispatchFocusPage() {
  // Dispatch Focus is intentionally empty until real Business Dispatch
  // persistence exists. These queues must eventually be derived from real
  // jobs/work orders rather than seeded or manufactured UI data.
  const [assignmentItems] = useState<AssignmentFocusItem[]>([]);
  const [routingItems] = useState<RoutingFocusItem[]>([]);
  const [executionItems] = useState<ExecutionFocusItem[]>([]);

  const allItems = useMemo(
    () => [...assignmentItems, ...routingItems, ...executionItems],
    [assignmentItems, routingItems, executionItems]
  );

  const highPriorityCount = useMemo(
    () => allItems.filter((item) => item.priority === "high").length,
    [allItems]
  );

  const hasFocusWork = allItems.length > 0;

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Zap className="h-3.5 w-3.5" />
              Dispatch Focus Mode
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                {hasFocusWork
                  ? "Dispatch work needs attention."
                  : "Dispatch is clear right now."}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Focus turns real Dispatch pressure into a short execution queue:
                assign the work, route the work, then execute the work.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 lg:text-[9px]">
                {allItems.length} focus action{allItems.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 lg:text-[9px]">
                {highPriorityCount} high priority
              </span>
            </div>
          </div>

          <Link
            href="/business/dispatch"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dispatch
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Focus Actions",
            value: allItems.length,
            detail: "Real work requiring action",
            icon: Zap,
          },
          {
            label: "Assign",
            value: assignmentItems.length,
            detail: "Jobs needing ownership",
            icon: UserRoundCheck,
          },
          {
            label: "Route",
            value: routingItems.length,
            detail: "Jobs needing route action",
            icon: Navigation,
          },
          {
            label: "Execute",
            value: executionItems.length,
            detail: "Jobs ready for execution",
            icon: Play,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      {!hasFocusWork ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Current execution state
              </p>
              <h2 className="mt-1 text-lg font-semibold text-emerald-950">
                No Dispatch actions are available yet
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-800">
                Dispatch persistence is not connected, so Focus has no real jobs
                from which to derive assignment, routing, or execution work.
                Nothing has been generated to make this queue look populated.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3 lg:gap-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Lane 01
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Assign
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Put real unassigned work in the right hands.
              </p>
            </div>
            <UserRoundCheck className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 space-y-3">
            {assignmentItems.length === 0 ? (
              <EmptyLane
                icon={UserRoundCheck}
                title="No assignment pressure"
                body="Real jobs without an owner will appear here when Dispatch persistence is connected."
              />
            ) : (
              assignmentItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.jobName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.customerName || "No customer recorded"}
                      </p>
                    </div>
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item.address}</span>
                  </div>

                  {item.scheduledWindow ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Scheduled: {item.scheduledWindow}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-500"
                    title="Assignment actions activate with real Dispatch persistence."
                  >
                    <UserRoundCheck className="h-4 w-4" />
                    Assign Worker
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Lane 02
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Route
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Turn real service locations into executable routes.
              </p>
            </div>
            <Route className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 space-y-3">
            {routingItems.length === 0 ? (
              <EmptyLane
                icon={Navigation}
                title="No routing pressure"
                body="Jobs needing route action will appear here after real locations and the Business Routes adapter are connected."
              />
            ) : (
              routingItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.jobName}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        {item.reason.replace("_", " ")}
                      </p>
                    </div>
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item.address}</span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {item.assigneeName || "No assignee recorded"}
                  </p>

                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-500"
                    title="Routing actions activate after the Business Dispatch adapter is connected."
                  >
                    <Navigation className="h-4 w-4" />
                    Build Route
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Lane 03
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Execute
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Open the work that is ready to be performed.
              </p>
            </div>
            <Play className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 space-y-3">
            {executionItems.length === 0 ? (
              <EmptyLane
                icon={Truck}
                title="No execution pressure"
                body="Scheduled or active jobs will appear here only when real Dispatch records support execution."
              />
            ) : (
              executionItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.jobName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.customerName || "No customer recorded"}
                      </p>
                    </div>
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {item.assigneeName || "No assignee recorded"}
                  </p>

                  <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                    <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item.address}</span>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-500"
                    title="Execution controls activate with real Dispatch job state."
                  >
                    <Play className="h-4 w-4" />
                    Open Job
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <BriefcaseBusiness className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Active execution
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                No active Dispatch job
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                When a real job enters execution, this surface can become the
                live workspace for ownership, location, route context, progress,
                and completion controls.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            Waiting for real execution state
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Focus reflects operational pressure. It does not invent it.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Dispatch Focus will derive its queue from real jobs and work
              orders. Scheduling can influence priority without becoming a
              separate execution lane. Assignment actions, route generation,
              job progress, and completion will activate only when their real
              persistence and execution paths exist.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
