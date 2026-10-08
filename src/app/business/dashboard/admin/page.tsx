"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Activity,
  ShieldCheck,
  Users,
  X,
  Send,
} from "lucide-react";

type TeamStatusMember = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  title: string | null;
  profile_status: string;
};

export default function BusinessAdminPage() {
  const [teamMembers, setTeamMembers] = useState<TeamStatusMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [businessModules, setBusinessModules] = useState<Set<string>>(new Set());
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [activity, setActivity] = useState<Record<string, { label: string; value: number }[]> | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestModules, setRequestModules] = useState<string[]>([]);
  const [requestAction, setRequestAction] = useState<"add" | "remove" | "question">("question");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSending, setRequestSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTeam() {
      try {
        const response = await fetch("/api/tools/team-status", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to load team status.");
        if (active) setTeamMembers((data?.members || []) as TeamStatusMember[]);
      } catch (error) {
        if (active) setTeamError(error instanceof Error ? error.message : "Failed to load team status.");
      } finally {
        if (active) setTeamLoading(false);
      }
    }
    void loadTeam();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadBusinessModules() {
      try {
        const response = await fetch("/api/auth/current-context", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load business module access.");
        const context = await response.json();
        if (!context?.organization?.id || !Array.isArray(context?.business_modules)) {
          throw new Error("Business module access is unavailable.");
        }
        const provisioned = new Set<string>(
          context.business_modules
            .map((module: unknown) => String(module || "").trim().toLowerCase())
            .filter(Boolean)
        );
        if (active) {
          setBusinessModules(provisioned);
          setOrganizationName(String(context.organization.name || ""));
        }
      } catch (error) {
        if (active) setModulesError(error instanceof Error ? error.message : "Failed to load business modules.");
      } finally {
        if (active) setModulesLoading(false);
      }
    }
    void loadBusinessModules();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadActivity() {
      try {
        const response = await fetch("/api/auth/current-context", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load organization context.");
        const context = await response.json();
        const orgId = context?.organization?.id;
        if (!orgId || !Array.isArray(context?.business_modules)) throw new Error("Business access unavailable.");
        const enabled = new Set<string>(context.business_modules.map((m: unknown) => String(m).toLowerCase()));
        const db = createClient();
        const snapshot: Record<string, { label: string; value: number }[]> = {};
        const count = async (table: string, filters: { field: string; value: string | boolean }[] = []) => {
          let query = db.from(table).select("id", { count: "exact", head: true }).eq("organization_id", orgId);
          for (const filter of filters) query = query.eq(filter.field, filter.value);
          const result = await query;
          if (result.error) throw result.error;
          return result.count ?? 0;
        };
        if (enabled.has("crm")) {
          snapshot.CRM = [
            { label: "Focus lists", value: await count("business_lists", [{ field: "department", value: "CRM" }]) },
            { label: "CRM follow-ups", value: await count("business_follow_ups", [{ field: "department", value: "CRM" }]) },
          ];
        }
        if (enabled.has("marketing")) {
          const { data, error } = await db.from("business_marketing_content")
            .select("stage").eq("organization_id", orgId).is("archived_at", null);
          if (error) throw error;
          const rows = data ?? [];
          snapshot.Marketing = [
            { label: "Unpublished content", value: rows.filter(r => String(r.stage ?? "").toLowerCase() !== "published").length },
            { label: "Published content", value: rows.filter(r => String(r.stage ?? "").toLowerCase() === "published").length },
          ];
        }
        if (enabled.has("inventory")) {
          const { data: reorder, error: reorderError } = await db.rpc("get_business_inventory_reorder_count", { p_organization_id: orgId });
          if (reorderError) throw reorderError;
          const { data: orders, error: ordersError } = await db.from("business_purchase_orders")
            .select("id, status").eq("organization_id", orgId);
          if (ordersError) throw ordersError;
          const pendingIds = (orders ?? []).filter(o => o.status === "ordered" || o.status === "partially_received").map(o => o.id);
          let deliveries = 0;
          if (pendingIds.length) {
            const { count: pending, error } = await db.from("business_inventory_deliveries")
              .select("id", { count: "exact", head: true }).in("purchase_order_id", pendingIds).is("received_at", null);
            if (error) throw error;
            deliveries = pending ?? 0;
          }
          snapshot.Inventory = [
            { label: "Items needing reorder", value: Number(reorder ?? 0) },
            { label: "Draft purchase orders", value: (orders ?? []).filter(o => o.status === "draft").length },
            { label: "Pending deliveries", value: deliveries },
          ];
        }
        if (enabled.has("dispatch")) {
          const { data: jobs, error: jobsError } = await db.from("business_dispatch_jobs")
            .select("id, status, assigned_user_id").eq("organization_id", orgId);
          if (jobsError) throw jobsError;
          const { data: routes, error: routesError } = await db.from("business_dispatch_routes")
            .select("id").eq("organization_id", orgId);
          if (routesError) throw routesError;
          const routeIds = (routes ?? []).map(r => r.id);
          const routed = new Set<string>();
          if (routeIds.length) {
            const { data: memberships, error } = await db.from("business_dispatch_route_jobs")
              .select("dispatch_job_id").in("route_id", routeIds);
            if (error) throw error;
            for (const membership of memberships ?? []) routed.add(membership.dispatch_job_id);
          }
          const lanes = { assign: 0, route: 0, execute: 0 };
          for (const job of jobs ?? []) {
            if (job.status === "completed") continue;
            if (!job.assigned_user_id) lanes.assign++;
            else if (!routed.has(job.id)) lanes.route++;
            else lanes.execute++;
          }
          snapshot.Dispatch = [
            { label: "Awaiting assignment", value: lanes.assign },
            { label: "Awaiting routing", value: lanes.route },
            { label: "In execution", value: lanes.execute },
          ];
        }
        if (enabled.has("finance")) {
          snapshot.Finance = [
            { label: "Awaiting receipt", value: await count("business_finance_obligations", [{ field: "direction", value: "in" }, { field: "status", value: "open" }]) },
            { label: "Awaiting payment", value: await count("business_finance_obligations", [{ field: "direction", value: "out" }, { field: "status", value: "open" }]) },
            { label: "Transactions to review", value: await count("business_finance_transactions", [{ field: "needs_review", value: true }]) },
          ];
        }
        if (active) setActivity(snapshot);
      } catch (error) {
        console.error("Failed to load department activity", error);
        if (active) setActivityError("Department activity is unavailable right now.");
      } finally {
        if (active) setActivityLoading(false);
      }
    }
    void loadActivity();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!requestOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !requestSending) setRequestOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestOpen, requestSending]);

  function openModuleRequest() {
    setRequestError("");
    setRequestSent(false);
    setRequestModules([]);
    setRequestAction("question");
    setRequestMessage("");
    setRequestOpen(true);
  }

  function toggleRequestedModule(key: string) {
    setRequestModules((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  async function submitModuleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestAction !== "question" && requestModules.length === 0) {
      setRequestError("Select at least one module for this change.");
      return;
    }
    if (requestAction === "question" && !requestMessage.trim() && requestModules.length === 0) {
      setRequestError("Please select a module or enter a message.");
      return;
    }
    setRequestSending(true);
    setRequestError("");
    try {
      const selectedNames = moduleDescriptions
        .filter((module) => requestModules.includes(module.key))
        .map((module) => module.name);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "module_request",
          name: requestName.trim(),
          email: requestEmail.trim(),
          organization: organizationName || "Not available",
          subject: "Business Module Inquiry",
          message: `Request type: ${requestAction === "add" ? "Add modules" : requestAction === "remove" ? "Remove modules" : "General question"}\nModules: ${selectedNames.join(", ") || "None specified"}\nCurrent modules: ${moduleDescriptions.filter((module) => businessModules.has(module.key)).map((module) => module.name).join(", ") || "None"}\n\nAdditional details:\n${requestMessage.trim() || "None provided"}`,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Request failed.");
      setRequestSent(true);
    } catch (error) {
      console.error("Module request error:", error);
      setRequestError("Unable to send your request. Please try again.");
    } finally {
      setRequestSending(false);
    }
  }

  const moduleDescriptions = [
    { key: "crm", name: "CRM", description: "Manage your customer relationships" },
    { key: "inventory", name: "Inventory", description: "Manage your inventory & ordering" },
    { key: "dispatch", name: "Dispatch", description: "Send your team or products where they need to go" },
    { key: "marketing", name: "Marketing", description: "Live marketing data all in one place!" },
    { key: "finance", name: "Finance", description: "Track your money your way" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Admin Control
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Business Administration
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Manage organization access and the administrative controls
                behind Aether Business.
              </p>
            </div>

            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Organization
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Administration
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <Users className="h-6 w-6 text-slate-700" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Team Management
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                    Manage the people who have access to this organization.
                  </p>
                </div>
              </div>

              <Link
                href="/business/dashboard/admin/team-management"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
              >
                Manage Team
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              {teamLoading ? (
                <p className="text-sm text-slate-500">Loading team status...</p>
              ) : teamError ? (
                <p className="text-sm text-red-700">{teamError}</p>
              ) : teamMembers.length === 0 ? (
                <p className="text-sm text-slate-500">No team members found for this organization.</p>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {teamMembers.map((member) => {
                    const status = member.profile_status || "unknown";
                    const statusLabel = status === "potato"
                      ? "Potato 🥔"
                      : status.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
                    return (
                      <div key={member.id} className="flex flex-col gap-2 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{member.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {[member.title, member.department, member.role]
                              .filter(Boolean)
                              .filter((value, index, values) => values.indexOf(value) === index)
                              .join(" • ")}
                          </p>
                        </div>
                        <span className="w-fit shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Future Administration
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Administrative Controls
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
                <Building2 className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-950">Your Business Modules</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                See a module that may help your business? Ask{" "}
                <button
                  type="button"
                  onClick={openModuleRequest}
                  className="cursor-pointer font-semibold text-blue-700 underline decoration-2 underline-offset-4 transition hover:text-blue-900 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  team@aetheros.pro
                </button>{" "}
                about it!
              </p>
              {modulesLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading your business modules...</p>
              ) : modulesError ? (
                <p className="mt-4 text-sm text-red-700">{modulesError}</p>
              ) : (
                <div className="mt-5 flex flex-col gap-3">
                  {moduleDescriptions.map((module) => {
                    const isProvisioned = businessModules.has(module.key);
                    return (
                      <div
                        key={module.key}
                        className={`rounded-2xl border p-4 ${
                          isProvisioned
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-950"
                        }`}
                      >
                        <h4 className="text-base font-semibold">{module.name}</h4>
                        <p className={`mt-1 text-sm leading-6 ${isProvisioned ? "text-slate-200" : "text-slate-700"}`}>
                          {module.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-950">
                Provisioning &amp; Access
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Assign teammates to departments and manage their existing roles
                from Team Management.
              </p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">Department Admin</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Oversees department operations and available management actions,
                    according to their assigned permissions.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">General User</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Works within their assigned department and uses the tools
                    their permissions allow.
                  </p>
                </div>
              </div>
              <Link
                href="/business/dashboard/admin/team-management"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
              >
                Manage Team Access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
                <Activity className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-950">Department Activity</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current Focus workload across your provisioned departments.
              </p>
              {activityLoading ? (
                <p className="mt-5 text-sm text-slate-500">Loading department activity...</p>
              ) : activityError ? (
                <p className="mt-5 text-sm text-red-700">{activityError}</p>
              ) : !activity || Object.keys(activity).length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">No provisioned department activity to show.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {Object.entries(activity).map(([department, metrics]) => (
                    <div key={department} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-950">{department}</h4>
                      <div className="mt-3 space-y-2">
                        {metrics.map(metric => (
                          <div key={metric.label} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-600">{metric.label}</span>
                            <span className="font-semibold tabular-nums text-slate-950">{metric.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
        {requestOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !requestSending) setRequestOpen(false);
            }}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="module-request-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="module-request-title" className="text-xl font-semibold">Business Module Inquiry</h2>
                  <p className="mt-1 text-sm text-slate-600">Ask Team Aether to add or remove modules, or send a question about your subscription.</p>
                </div>
                <button type="button" disabled={requestSending} onClick={() => setRequestOpen(false)} aria-label="Close request" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
              </div>
              {requestSent ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-semibold text-emerald-950">Request sent!</p>
                  <p className="mt-2 text-sm text-emerald-900">Team Aether has received your module inquiry.</p>
                  <button type="button" onClick={() => setRequestOpen(false)} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Close</button>
                </div>
              ) : (
                <form onSubmit={submitModuleRequest} className="mt-5 space-y-4">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold">Organization:</span> {organizationName || "Unavailable"}</div>
                  <div>
                    <label htmlFor="module-request-name" className="block text-sm font-semibold">Your name *</label>
                    <input id="module-request-name" required maxLength={150} value={requestName} onChange={(event) => setRequestName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950" />
                  </div>
                  <div>
                    <label htmlFor="module-request-email" className="block text-sm font-semibold">Your email *</label>
                    <input id="module-request-email" type="email" required maxLength={254} value={requestEmail} onChange={(event) => setRequestEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950" />
                  </div>
                  <fieldset>
                    <legend className="text-sm font-semibold">What would you like to do?</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {([{"key":"add","label":"Add modules"},{"key":"remove","label":"Remove modules"},{"key":"question","label":"General question"}] as const).map((option) => (
                        <label key={option.key} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${requestAction === option.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
                          <input type="radio" name="module-request-action" value={option.key} checked={requestAction === option.key} onChange={() => { setRequestAction(option.key); setRequestModules([]); setRequestError(""); }} className="sr-only" />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="text-sm font-semibold">Modules {requestAction === "question" ? "(optional)" : "*"}</legend>
                    <div className="mt-2 space-y-2">
                      {moduleDescriptions.map((module) => (
                        <label key={module.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
                          <input type="checkbox" checked={requestModules.includes(module.key)} onChange={() => toggleRequestedModule(module.key)} className="h-4 w-4 accent-slate-950" />
                          {module.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label htmlFor="module-request-message" className="block text-sm font-semibold">Additional details (optional)</label>
                    <textarea id="module-request-message" rows={3} maxLength={2000} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950" />
                  </div>
                  {requestError && <p role="alert" className="text-sm text-red-700">{requestError}</p>}
                  <button type="submit" disabled={requestSending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                    <Send className="h-4 w-4" /> {requestSending ? "Sending..." : "Send Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
    </main>
  );
}
