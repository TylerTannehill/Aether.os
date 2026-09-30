"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPinned,
  Navigation,
  Search,
  Truck,
  UserRoundCheck,
  Zap,
} from "lucide-react";

type DispatchJobStatus =
  | "unassigned"
  | "assigned"
  | "scheduled"
  | "in_progress"
  | "completed";

type DispatchJob = {
  id: string;
  name: string;
  customerName: string | null;
  address: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  assigneeName: string | null;
  status: DispatchJobStatus;
};

function statusLabel(status: DispatchJobStatus) {
  switch (status) {
    case "unassigned":
      return "Unassigned";
    case "assigned":
      return "Assigned";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
  }
}

function statusTone(status: DispatchJobStatus) {
  switch (status) {
    case "unassigned":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "assigned":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "scheduled":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "in_progress":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

export default function BusinessDispatchPage() {
  // Dispatch remains empty until real Business job/work-order persistence is connected.
  // Do not seed operational records here.
  const [jobs] = useState<DispatchJob[]>([]);
  const [search, setSearch] = useState("");

  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status !== "completed"),
    [jobs]
  );

  const unassignedJobs = useMemo(
    () => jobs.filter((job) => job.status === "unassigned"),
    [jobs]
  );

  const inProgressJobs = useMemo(
    () => jobs.filter((job) => job.status === "in_progress"),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === "completed"),
    [jobs]
  );

  const routedJobs = useMemo(
    () => activeJobs.filter((job) => job.address.trim().length > 0),
    [activeJobs]
  );

  const query = search.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    if (!query) return jobs;

    return jobs.filter((job) =>
      [
        job.name,
        job.customerName,
        job.address,
        job.assigneeName,
        statusLabel(job.status),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [jobs, query]);

  const hasJobs = jobs.length > 0;

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Truck className="h-3.5 w-3.5" />
              Dispatch Command Center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Put the right work in the right hands.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Coordinate jobs, assignments, service locations, schedules, and
                routes from one operational workspace.
              </p>
            </div>
          </div>

          <Link
            href="/business/dispatch/focus"
            className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2"
          >
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:text-[9px]">
                  Focus Mode
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200 transition group-hover:text-white lg:text-[11px]">
                  Open Dispatch Focus
                </p>
              </div>
              <Zap className="h-4 w-4 text-slate-300 transition group-hover:text-white" />
            </div>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Active Jobs",
            value: activeJobs.length,
            detail: "Work still in motion",
            icon: BriefcaseBusiness,
          },
          {
            label: "Unassigned",
            value: unassignedJobs.length,
            detail: "Jobs needing an owner",
            icon: UserRoundCheck,
          },
          {
            label: "In Progress",
            value: inProgressJobs.length,
            detail: "Work currently underway",
            icon: Clock3,
          },
          {
            label: "Route Ready",
            value: routedJobs.length,
            detail: "Active jobs with locations",
            icon: Navigation,
          },
          {
            label: "Completed",
            value: completedJobs.length,
            detail: "Finished jobs",
            icon: CheckCircle2,
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
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      {!hasJobs ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <BriefcaseBusiness className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Dispatch status
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                No dispatch jobs connected yet
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Dispatch will populate from real jobs and work orders once the
                Business data layer is connected. No assignments, schedules,
                routes, or completion activity have been estimated or generated.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Operations
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Jobs & work orders
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track who owns the work, where it happens, and where it stands.
              </p>
            </div>

            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dispatch"
                disabled={!hasJobs}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1.1fr_1fr_1.5fr_1fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Job</span>
              <span>Assigned To</span>
              <span>Location</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BriefcaseBusiness className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {hasJobs ? "No jobs match this search" : "No dispatch jobs"}
                </p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {hasJobs
                    ? "Adjust the search to find another job or work order."
                    : "Real jobs will appear here once Dispatch persistence is connected."}
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.1fr_1fr_1.5fr_1fr_0.8fr] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{job.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {job.customerName || "No customer recorded"}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600">
                    {job.assigneeName || "Unassigned"}
                  </p>

                  <p className="text-sm text-slate-600">{job.address}</p>

                  <p className="text-sm text-slate-600">
                    {job.scheduledStart || "Not scheduled"}
                  </p>

                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                      job.status
                    )}`}
                  >
                    {statusLabel(job.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6 lg:space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Routing
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Google Routes
                </h2>
              </div>
              <MapPinned className="h-5 w-5 text-blue-600" />
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Aether-managed routing
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Aether already operates the Google Routes service. Dispatch
                    will use that shared routing engine when real job locations
                    are connected.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Dispatch adapter pending
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The current routing engine accepts Political Field lists.
                Business Dispatch will receive its own adapter after real job
                persistence exists. The existing Political route workflow
                remains untouched.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Assignment pressure
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Work ownership
                </h2>
              </div>
              <UserRoundCheck className="h-5 w-5 text-slate-500" />
            </div>

            {unassignedJobs.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No unassigned work
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Jobs will appear here only when real Dispatch records need an
                  owner.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {unassignedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{job.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{job.address}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Scheduling",
            value: jobs.filter((job) => Boolean(job.scheduledStart)).length,
            detail: "Jobs with a recorded schedule",
            icon: Clock3,
          },
          {
            label: "Assignments",
            value: jobs.filter((job) => Boolean(job.assigneeName)).length,
            detail: "Jobs with a recorded owner",
            icon: UserRoundCheck,
          },
          {
            label: "Service Locations",
            value: jobs.filter((job) => job.address.trim().length > 0).length,
            detail: "Jobs with routable addresses",
            icon: MapPinned,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-700">
                  {item.label}
                </p>
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Dispatch reflects real operational state
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This workspace does not fabricate jobs, workers, schedules,
              routes, travel times, or completion activity. As the Business
              Dispatch data layer is built, these surfaces will populate from
              records that actually exist.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
