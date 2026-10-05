"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type DispatchWorker = {
  id: string;
  name: string;
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
  status: "ready" | "scheduled" | "in_progress";
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
  const [assignmentItems, setAssignmentItems] = useState<AssignmentFocusItem[]>([]);
  const [routingItems, setRoutingItems] = useState<RoutingFocusItem[]>([]);
  const [executionItems, setExecutionItems] = useState<ExecutionFocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildingRoute, setBuildingRoute] = useState(false);
  const [routingJobId, setRoutingJobId] = useState<string | null>(null);
  const [routeActionError, setRouteActionError] = useState<string | null>(null);
  const [routeActionSuccess, setRouteActionSuccess] = useState<string | null>(null);
  const [workers, setWorkers] = useState<DispatchWorker[]>([]);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [selectedWorkerByJob, setSelectedWorkerByJob] = useState<Record<string, string>>({});
  const [assignmentActionError, setAssignmentActionError] = useState<string | null>(null);
  const [executingJobId, setExecutingJobId] = useState<string | null>(null);
  const [executionActionError, setExecutionActionError] = useState<string | null>(null);
  const [executionActionSuccess, setExecutionActionSuccess] = useState<string | null>(null);

  async function loadFocusWork() {
    setLoading(true);
    setError(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active organization found.");
      }

      const teamStatusResponse = await fetch("/api/tools/team-status", {
        cache: "no-store",
      });

      if (!teamStatusResponse.ok) {
        const teamStatusPayload = await teamStatusResponse.json().catch(() => null);
        throw new Error(
          teamStatusPayload?.error || "Unable to load assignable team members."
        );
      }

      const teamStatus = await teamStatusResponse.json();
      const teamMembers = Array.isArray(teamStatus?.members)
        ? teamStatus.members
        : [];

      setWorkers(
        teamMembers
          .map((member: { user_id?: string; name?: string }) => ({
            id: String(member.user_id || "").trim(),
            name: String(member.name || "").trim() || "Team member",
          }))
          .filter((worker: DispatchWorker) => Boolean(worker.id))
          .sort((a: DispatchWorker, b: DispatchWorker) =>
            a.name.localeCompare(b.name)
          )
      );

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: jobRows, error: jobsError } = await supabase
        .from("business_dispatch_jobs")
        .select(
          "id,name,contact_id,address,assigned_user_id,scheduled_start,scheduled_end,status"
        )
        .eq("organization_id", organizationId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const contactIds = Array.from(
        new Set(
          (jobRows || [])
            .map((job) => job.contact_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const assigneeIds = Array.from(
        new Set(
          (jobRows || [])
            .map((job) => job.assigned_user_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const jobIds = (jobRows || []).map((job) => job.id);

      const [contactsResult, usersResult, routedJobsResult] = await Promise.all([
        contactIds.length > 0
          ? supabase
              .from("business_contacts")
              .select("id,first_name,last_name")
              .eq("organization_id", organizationId)
              .in("id", contactIds)
          : Promise.resolve({ data: [], error: null }),
        assigneeIds.length > 0
          ? supabase
              .from("users")
              .select("id,name")
              .in("id", assigneeIds)
          : Promise.resolve({ data: [], error: null }),
        jobIds.length > 0
          ? supabase
              .from("business_dispatch_route_jobs")
              .select("dispatch_job_id")
              .in("dispatch_job_id", jobIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (contactsResult.error) throw contactsResult.error;
      if (usersResult.error) throw usersResult.error;
      if (routedJobsResult.error) throw routedJobsResult.error;

      const contactNames = new Map(
        (contactsResult.data || []).map((contact) => [
          contact.id,
          [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
            "Unnamed contact",
        ])
      );

      const assigneeNames = new Map(
        (usersResult.data || []).map((user) => [
          user.id,
          String(user.name || "").trim() || "Assigned user",
        ])
      );

      const routedJobIds = new Set(
        (routedJobsResult.data || []).map((row) => row.dispatch_job_id)
      );

      const formatSchedule = (
        start: string | null,
        end: string | null
      ): string | null => {
        if (!start) return null;

        const startLabel = new Date(start).toLocaleString();
        if (!end) return startLabel;

        return `${startLabel} – ${new Date(end).toLocaleString()}`;
      };

      const assignments: AssignmentFocusItem[] = [];
      const routes: RoutingFocusItem[] = [];
      const executions: ExecutionFocusItem[] = [];

      for (const job of jobRows || []) {
        const customerName = job.contact_id
          ? contactNames.get(job.contact_id) || null
          : null;
        const assigneeName = job.assigned_user_id
          ? assigneeNames.get(job.assigned_user_id) || "Assigned"
          : null;

        if (!job.assigned_user_id) {
          assignments.push({
            id: `assign-${job.id}`,
            jobId: job.id,
            jobName: job.name,
            customerName,
            address: job.address,
            scheduledWindow: formatSchedule(
              job.scheduled_start,
              job.scheduled_end
            ),
            priority: "medium",
          });
          continue;
        }

        if (
          job.assigned_user_id &&
          job.address?.trim() &&
          !routedJobIds.has(job.id) &&
          job.status !== "in_progress"
        ) {
          routes.push({
            id: `route-${job.id}`,
            jobId: job.id,
            jobName: job.name,
            address: job.address,
            assigneeName,
            reason: "needs_route",
            priority: "medium",
          });
          continue;
        }

        if (
          routedJobIds.has(job.id) ||
          job.status === "scheduled" ||
          job.status === "in_progress"
        ) {
          executions.push({
            id: `execute-${job.id}`,
            jobId: job.id,
            jobName: job.name,
            customerName,
            address: job.address,
            assigneeName,
            status:
              job.status === "in_progress"
                ? "in_progress"
                : job.status === "scheduled"
                  ? "scheduled"
                  : "ready",
            priority: "medium",
          });
        }
      }

      setAssignmentItems(assignments);
      setRoutingItems(routes);
      setExecutionItems(executions);
    } catch (loadError) {
      console.error("Unable to load Dispatch Focus:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Dispatch Focus."
      );
      setAssignmentItems([]);
      setRoutingItems([]);
      setExecutionItems([]);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }

  async function assignWorker(jobId: string) {
    const workerId = selectedWorkerByJob[jobId];

    if (!workerId) {
      setAssignmentActionError("Choose a worker before assigning this job.");
      return;
    }

    setAssigningJobId(jobId);
    setAssignmentActionError(null);
    setRouteActionSuccess(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active organization found.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: assignmentError } = await supabase
        .from("business_dispatch_jobs")
        .update({
          assigned_user_id: workerId,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", jobId);

      if (assignmentError) throw assignmentError;

      setSelectedWorkerByJob((current) => {
        const next = { ...current };
        delete next[jobId];
        return next;
      });

      await loadFocusWork();
    } catch (assignmentError) {
      console.error("Unable to assign Dispatch worker:", assignmentError);
      setAssignmentActionError(
        assignmentError instanceof Error
          ? assignmentError.message
          : "Unable to assign Dispatch worker."
      );
    } finally {
      setAssigningJobId(null);
    }
  }

  async function routeJob(jobId: string) {
    setRoutingJobId(jobId);
    setRouteActionError(null);
    setRouteActionSuccess(null);

    try {
      const response = await fetch("/api/business/integrations/routes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: [jobId],
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Unable to route Dispatch job.");
      }

      setRouteActionSuccess("Dispatch job routed successfully.");
      await loadFocusWork();
    } catch (routeError) {
      console.error("Unable to route Dispatch job:", routeError);
      setRouteActionError(
        routeError instanceof Error
          ? routeError.message
          : "Unable to route Dispatch job."
      );
    } finally {
      setRoutingJobId(null);
    }
  }

  async function buildRoute() {
    if (routingItems.length < 2) {
      setRouteActionError("At least two routable Dispatch jobs are required.");
      return;
    }

    setBuildingRoute(true);
    setRouteActionError(null);
    setRouteActionSuccess(null);

    try {
      const response = await fetch("/api/business/integrations/routes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: routingItems.map((item) => item.jobId),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Unable to build Dispatch route.");
      }

      const routedCount = payload?.counts?.routedJobs ?? routingItems.length;
      setRouteActionSuccess(
        `Route built successfully for ${routedCount} job${routedCount === 1 ? "" : "s"}.`
      );

      await loadFocusWork();
    } catch (routeError) {
      console.error("Unable to build Dispatch route:", routeError);
      setRouteActionError(
        routeError instanceof Error
          ? routeError.message
          : "Unable to build Dispatch route."
      );
    } finally {
      setBuildingRoute(false);
    }
  }

  async function updateExecutionStatus(
    jobId: string,
    status: "in_progress" | "completed"
  ) {
    setExecutingJobId(jobId);
    setExecutionActionError(null);
    setExecutionActionSuccess(null);
    setRouteActionSuccess(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active organization found.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: executionError } = await supabase
        .from("business_dispatch_jobs")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", jobId);

      if (executionError) throw executionError;

      setExecutionActionSuccess(
        status === "in_progress"
          ? "Dispatch job started."
          : "Dispatch job completed."
      );

      await loadFocusWork();
    } catch (executionError) {
      console.error("Unable to update Dispatch execution:", executionError);
      setExecutionActionError(
        executionError instanceof Error
          ? executionError.message
          : "Unable to update Dispatch execution."
      );
    } finally {
      setExecutingJobId(null);
    }
  }

  useEffect(() => {
    void loadFocusWork();
  }, []);

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

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </section>
      ) : null}

      {assignmentActionError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {assignmentActionError}
        </section>
      ) : null}

      {routeActionError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {routeActionError}
        </section>
      ) : null}

      {routeActionSuccess ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {routeActionSuccess}
        </section>
      ) : null}

      {executionActionError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {executionActionError}
        </section>
      ) : null}

      {executionActionSuccess ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {executionActionSuccess}
        </section>
      ) : null}

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

      {!loading && !hasFocusWork ? (
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
                No current Dispatch jobs require assignment, routing, or
                execution action. Nothing has been generated to make this queue
                look populated.
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

                  <div className="mt-4 space-y-2">
                    <select
                      value={selectedWorkerByJob[item.jobId] || ""}
                      onChange={(event) =>
                        setSelectedWorkerByJob((current) => ({
                          ...current,
                          [item.jobId]: event.target.value,
                        }))
                      }
                      disabled={assigningJobId === item.jobId || workers.length === 0}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">
                        {workers.length > 0 ? "Choose worker…" : "No active team members"}
                      </option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => void assignWorker(item.jobId)}
                      disabled={
                        assigningJobId === item.jobId ||
                        !selectedWorkerByJob[item.jobId] ||
                        workers.length === 0
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:!text-slate-500"
                      style={
                        assigningJobId === item.jobId ||
                        !selectedWorkerByJob[item.jobId] ||
                        workers.length === 0
                          ? undefined
                          : { color: "#ffffff" }
                      }
                    >
                      <UserRoundCheck className="h-4 w-4" />
                      {assigningJobId === item.jobId ? "Assigning…" : "Assign Worker"}
                    </button>
                  </div>
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
            {routingItems.length >= 2 ? (
              <button
                type="button"
                onClick={() => void buildRoute()}
                disabled={buildingRoute}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: "#ffffff" }}
              >
                <Navigation className="h-4 w-4" />
                {buildingRoute
                  ? "Building Route…"
                  : `Build Route · ${routingItems.length} Jobs`}
              </button>
            ) : routingItems.length === 1 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                One routable job is ready. Route it below, or add another job for an optimized multi-stop route.
              </div>
            ) : null}

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
                    onClick={() => void routeJob(item.jobId)}
                    disabled={routingJobId === item.jobId || buildingRoute}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ color: "#ffffff" }}
                  >
                    <Navigation className="h-4 w-4" />
                    {routingJobId === item.jobId ? "Routing…" : "Route Job"}
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

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {item.status === "in_progress"
                        ? "In progress"
                        : item.status === "scheduled"
                          ? "Scheduled"
                          : "Ready to execute"}
                    </span>
                  </div>

                  {item.status === "in_progress" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void updateExecutionStatus(item.jobId, "completed")
                      }
                      disabled={executingJobId === item.jobId}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold !text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: "#ffffff" }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {executingJobId === item.jobId
                        ? "Completing…"
                        : "Complete Job"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void updateExecutionStatus(item.jobId, "in_progress")
                      }
                      disabled={executingJobId === item.jobId}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: "#ffffff" }}
                    >
                      <Play className="h-4 w-4" />
                      {executingJobId === item.jobId ? "Starting…" : "Start Job"}
                    </button>
                  )}
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
                {executionItems.find((item) => item.status === "in_progress")
                  ?.jobName || "No active Dispatch job"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {executionItems.find((item) => item.status === "in_progress")
                  ? `${executionItems.find((item) => item.status === "in_progress")?.assigneeName || "Assigned worker"} · ${executionItems.find((item) => item.status === "in_progress")?.address}`
                  : "When a real job enters execution, this surface becomes the live workspace for ownership, location, progress, and completion."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            {executionItems.some((item) => item.status === "in_progress")
              ? "Job in progress"
              : "Waiting for real execution state"}
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
