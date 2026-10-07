"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Building2,
  Mail,
  Flag,
  Sparkles,
  CheckCircle2,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Headset,
} from "lucide-react";

type PoliticalMode = "default" | "democrat" | "republican";
type AetherTier = "t1" | "t2" | "t3";
type ProductType = "political" | "business";
type BusinessDeployment = "smb" | "enterprise";
type BusinessModule = "crm" | "marketing" | "inventory" | "dispatch" | "finance";

const businessModuleOptions: { key: BusinessModule; label: string; description: string }[] = [
  { key: "crm", label: "CRM", description: "Customer relationships, lists, interactions, and follow-up work." },
  { key: "marketing", label: "Marketing", description: "Marketing analytics, content, spend, and audience response." },
  { key: "inventory", label: "Inventory", description: "Inventory state, purchasing, deliveries, receiving, and reorder pressure." },
  { key: "dispatch", label: "Dispatch", description: "Jobs, worker assignment, routing, and execution." },
  { key: "finance", label: "Finance", description: "Operational money movement, obligations, transactions, and financial attention." },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function TeamAetherPage() {
  const [orgName, setOrgName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [productType, setProductType] = useState<ProductType>("political");
  const [mode, setMode] = useState<PoliticalMode>("default");
  const [tier, setTier] = useState<AetherTier>("t3");
  const [businessDeployment, setBusinessDeployment] = useState<BusinessDeployment>("smb");
  const [businessModules, setBusinessModules] = useState<Set<BusinessModule>>(new Set(["crm"]));

  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugPreview = useMemo(() => slugify(orgName), [orgName]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  async function handleCreate() {
    try {
      setCreating(true);
      setError(null);
      setCreated(false);

      const response = await fetch(
        "/api/team-aether/create-org",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: orgName,
            admin_email: adminEmail,
            product_context: productType,
            context_mode: mode,
            aether_tier: tier,
            business_modules:
              productType === "business" ? Array.from(businessModules) : [],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to create organization."
        );
      }

      setCreated(true);

      setOrgName("");
      setAdminEmail("");
      setProductType("political");
      setMode("default");
      setTier("t3");
      setBusinessDeployment("smb");
      setBusinessModules(new Set(["crm"]));
    } catch (err: any) {
      setError(
        err?.message || "Failed to create organization."
      );
    } finally {
      setCreating(false);
    }
  }

  function buttonStyles(current: PoliticalMode) {
    const active = mode === current;

    if (!active) {
      return "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
    }

    if (current === "democrat") {
      return "border-blue-300 bg-blue-50 text-blue-900 ring-2 ring-blue-100";
    }

    if (current === "republican") {
      return "border-rose-300 bg-rose-50 text-rose-900 ring-2 ring-rose-100";
    }

    return "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-200";
  }

  function selectBusinessDeployment(deployment: BusinessDeployment) {
    setBusinessDeployment(deployment);

    if (deployment === "enterprise") {
      setBusinessModules(new Set(businessModuleOptions.map((option) => option.key)));
    }
  }

  function toggleBusinessModule(module: BusinessModule) {
    if (businessDeployment === "enterprise") return;

    setBusinessModules((current) => {
      const next = new Set(current);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-6 lg:p-3">
      <div className="mx-auto max-w-6xl space-y-8 lg:space-y-6">
        {/* HERO */}
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm lg:p-7 lg:rounded-2xl lg:p-6">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start lg:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 lg:text-[10px]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Team Aether
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl lg:mt-3 lg:text-2xl">
                Org Setup Console
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 lg:text-sm lg:mt-2 lg:text-[12px]">
                Create campaign organizations, assign design context,
                and provision the first org admin from one guarded workspace.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[140px_1fr] lg:gap-4">
              <div className="flex flex-col items-start gap-3 pt-6 lg:gap-2">
                <a
                  href="/team-aether/sales-help"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                >
                  <Sparkles className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  Sales Help
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                >
                  <LogOut className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  Logout
                </button>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex flex-wrap gap-3 lg:gap-2">
                  <a
                    href="/team-aether/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                  >
                    <LayoutDashboard className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    Dashboard
                  </a>

                  <a
                    href="/team-aether/organizations"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                  >
                    <Building2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    Organizations
                  </a>

                  <a
                    href="/team-aether"
                    aria-current="page"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/10 px-4 py-2.5 text-sm font-semibold text-white lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                  >
                    <Sparkles className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    Provisioning
                  </a>

                  <a
                    href="/team-aether/sales-pipeline"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                  >
                    <BarChart3 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    Sales Pipeline
                  </a>

                  <a
                    href="/team-aether/email-templates"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                  >
                    <Mail className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    Email Templates
                  </a>

                  <a
                    href="/team-aether/support-portal"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
                  >
                    <Headset className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                    Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS CARDS */}
        <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-xl lg:p-4">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700 lg:rounded-xl">
              <Building2 className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>

            <h2 className="mt-4 text-lg font-semibold lg:mt-3 lg:text-base">
              1. Create Organization
            </h2>

            <p className="mt-2 text-sm text-slate-500 lg:mt-1.5 lg:text-[12px]">
              Establish the organization identity and routing structure.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-xl lg:p-4">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700 lg:rounded-xl">
              <Flag className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>

            <h2 className="mt-4 text-lg font-semibold lg:mt-3 lg:text-base">
              2. Apply Context
            </h2>

            <p className="mt-2 text-sm text-slate-500 lg:mt-1.5 lg:text-[12px]">
              Apply Political context or configure Business module visibility.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-xl lg:p-4">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700 lg:rounded-xl">
              <Mail className="h-5 w-5 lg:h-4 lg:w-4" />
            </div>

            <h2 className="mt-4 text-lg font-semibold lg:mt-3 lg:text-base">
              3. Assign Org Admin
            </h2>

            <p className="mt-2 text-sm text-slate-500 lg:mt-1.5 lg:text-[12px]">
              Provision the first admin who will manage departments and users.
            </p>
          </div>
        </section>

        {/* MAIN PANEL */}
        <section className="rounded-[2rem] border-2 border-slate-900 bg-white p-6 shadow-md lg:p-6 lg:rounded-2xl lg:p-[18px]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-3 lg:mb-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 lg:text-[10px]">
                <Sparkles className="h-3.5 w-3.5" />
                Provisioning
              </div>

              <h2 className="mt-3 text-2xl font-semibold lg:mt-2 lg:text-xl">
                Create Organization
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[12px]">
                Team Aether can now provision real organizations into Supabase.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end lg:gap-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]">
                Provisioning route connected
              </div>

              <a
                href="/team-aether/sales-help"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[12px]"
              >
                Sales Talking Points
              </a>
            </div>
          </div>

          {/* ORG NAME */}
          <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:gap-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 lg:text-[12px]">
                Organization Name
              </span>

              <input
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Example: Morgan for Congress or Acme Services"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 lg:mt-1.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[12px] lg:rounded-xl lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px]"
              />
            </label>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]">
                Slug Preview
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-900 lg:mt-1.5 lg:text-[12px]">
                {slugPreview || "org-slug-preview"}
              </p>
            </div>
          </div>

          {/* PRODUCT */}
          <div className="mt-8 lg:mt-6">
            <p className="text-sm font-semibold text-slate-900 lg:text-[12px]">
              Product
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:gap-2 lg:mt-2">
              {([
                ["political", "Political", "Campaign operating system with Political context and tier controls."],
                ["business", "Business", "SMB or Enterprise operating system with provisioned Business modules."],
              ] as const).map(([value, label, description]) => {
                const active = productType === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProductType(value)}
                    className={`rounded-3xl border p-5 text-left transition lg:rounded-xl lg:p-4 ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{label}</span>
                      {active ? <CheckCircle2 className="h-5 w-5 lg:h-4 lg:w-4" /> : null}
                    </div>
                    <p className="mt-3 text-sm opacity-80 lg:mt-2 lg:text-[12px]">
                      {description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {productType === "political" ? (
            <>
              {/* POLITICAL MODE */}
              <div className="mt-8 lg:mt-6">
                <p className="text-sm font-semibold text-slate-900 lg:text-[12px]">
                  Political / Design Context
                </p>

                <div className="mt-3 grid gap-3 lg:grid-cols-3 lg:gap-2 lg:mt-2">
                  {([
                    ["democrat", "Democrat", "Blue undertones and Democratic integration visibility."],
                    ["republican", "Republican", "Red undertones and Republican integration visibility."],
                    ["default", "Default", "Neutral red/white/blue undertones with full visibility."],
                  ] as const).map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`rounded-3xl border p-5 text-left transition lg:rounded-xl lg:p-4 ${buttonStyles(value)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{label}</span>
                        {mode === value ? <CheckCircle2 className="h-5 w-5 lg:h-4 lg:w-4" /> : null}
                      </div>
                      <p className="mt-3 text-sm opacity-80 lg:mt-2 lg:text-[12px]">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* POLITICAL TIER */}
              <div className="mt-8 lg:mt-6">
                <p className="text-sm font-semibold text-slate-900 lg:text-[12px]">
                  Aether Tier
                </p>

                <div className="mt-3 grid gap-3 lg:grid-cols-3 lg:gap-2 lg:mt-2">
                  {([
                    ["t1", "T1", "Ground campaign operating layer for lean local and field-first operations."],
                    ["t2", "T2", "Full operational campaign workspace for growing coordinated teams."],
                    ["t3", "T3", "Full strategic command infrastructure for high-scale campaign organizations."],
                  ] as const).map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTier(value)}
                      className={`rounded-3xl border p-5 text-left transition lg:rounded-xl lg:p-4 ${
                        tier === value
                          ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{label}</span>
                        {tier === value ? <CheckCircle2 className="h-5 w-5 lg:h-4 lg:w-4" /> : null}
                      </div>
                      <p className="mt-3 text-sm opacity-80 lg:mt-2 lg:text-[12px]">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* BUSINESS DEPLOYMENT */}
              <div className="mt-8 lg:mt-6">
                <p className="text-sm font-semibold text-slate-900 lg:text-[12px]">
                  Business Deployment
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:gap-2 lg:mt-2">
                  {([
                    ["smb", "SMB / À la carte", "Choose the Business modules included in this deployment."],
                    ["enterprise", "Enterprise", "Provision the complete Business operating system."],
                  ] as const).map(([value, label, description]) => {
                    const active = businessDeployment === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => selectBusinessDeployment(value)}
                        className={`rounded-3xl border p-5 text-left transition lg:rounded-xl lg:p-4 ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-200"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{label}</span>
                          {active ? <CheckCircle2 className="h-5 w-5 lg:h-4 lg:w-4" /> : null}
                        </div>
                        <p className="mt-3 text-sm opacity-80 lg:mt-2 lg:text-[12px]">
                          {description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUSINESS MODULES */}
              <div className="mt-8 lg:mt-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 lg:text-[12px]">
                      Provisioned Modules
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[12px]">
                      Overview, Tools, and FAQ are included with every Business deployment.
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]">
                    {businessModules.size} of {businessModuleOptions.length} selected
                  </p>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5 lg:gap-2 lg:mt-2">
                  {businessModuleOptions.map((option) => {
                    const active = businessModules.has(option.key);
                    const locked = businessDeployment === "enterprise";

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => toggleBusinessModule(option.key)}
                        disabled={locked}
                        className={`rounded-3xl border p-5 text-left transition lg:rounded-xl lg:p-4 ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-200"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        } ${locked ? "cursor-default" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{option.label}</span>
                          {active ? <CheckCircle2 className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" /> : null}
                        </div>
                        <p className="mt-3 text-sm opacity-80 lg:mt-2 lg:text-[12px]">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ADMIN */}
          <div className="mt-8 lg:mt-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900 lg:text-[12px]">
                Org Admin Email
              </span>

              <input
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 lg:mt-1.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[12px] lg:rounded-xl lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px]"
              />
            </label>
          </div>

          {/* ACTION */}
          <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between lg:gap-2 lg:rounded-xl lg:p-3 lg:mt-6">
            <div>
              <p className="font-semibold text-slate-900">
                Ready to provision organization?
              </p>

              <p className="mt-1 text-sm text-slate-500 lg:text-[12px]">
                This now creates a real organization record in Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-[12px]"
            >
              <ClipboardList className="h-4 w-4 lg:h-3.5 lg:w-3.5" />

              {creating ? "Creating..." : "Create Org"}
            </button>
          </div>

          {/* ERROR */}
          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 lg:rounded-xl lg:p-3 lg:mt-4 lg:text-[12px]">
              {error}
            </div>
          ) : null}

          {/* SUCCESS */}
          {created ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 lg:rounded-xl lg:p-3 lg:mt-4 lg:text-[12px]">
              Organization created successfully.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}