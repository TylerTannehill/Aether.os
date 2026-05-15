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
} from "lucide-react";

type PoliticalMode = "default" | "democrat" | "republican";

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
  const [mode, setMode] = useState<PoliticalMode>("default");

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
            context_mode: mode,
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
      setMode("default");
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

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* HERO */}
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Team Aether
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-5xl">
                Org Setup Console
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">
                Create campaign organizations, assign design context,
                and provision the first org admin from one guarded workspace.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                Internal provisioning workspace
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* PROCESS CARDS */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Building2 className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              1. Create Organization
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Establish the organization identity and routing structure.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Flag className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              2. Apply Context
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Assign political undertones and future integration visibility.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Mail className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              3. Assign Org Admin
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Provision the first admin who will manage departments and users.
            </p>
          </div>
        </section>

        {/* MAIN PANEL */}
        <section className="rounded-[2rem] border-2 border-slate-900 bg-white p-6 shadow-md lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                Provisioning
              </div>

              <h2 className="mt-3 text-2xl font-semibold">
                Create Organization
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Team Aether can now provision real organizations into Supabase.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              Provisioning route connected
            </div>
          </div>

          {/* ORG NAME */}
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">
                Organization Name
              </span>

              <input
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Example: Morgan for Congress"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Slug Preview
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                {slugPreview || "org-slug-preview"}
              </p>
            </div>
          </div>

          {/* MODE BUTTONS */}
          <div className="mt-8">
            <p className="text-sm font-semibold text-slate-900">
              Political / Design Context
            </p>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setMode("democrat")}
                className={`rounded-3xl border p-5 text-left transition ${buttonStyles(
                  "democrat"
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Democrat</span>

                  {mode === "democrat" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : null}
                </div>

                <p className="mt-3 text-sm opacity-80">
                  Blue undertones and Democratic integration visibility.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("republican")}
                className={`rounded-3xl border p-5 text-left transition ${buttonStyles(
                  "republican"
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Republican</span>

                  {mode === "republican" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : null}
                </div>

                <p className="mt-3 text-sm opacity-80">
                  Red undertones and Republican integration visibility.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("default")}
                className={`rounded-3xl border p-5 text-left transition ${buttonStyles(
                  "default"
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Default</span>

                  {mode === "default" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : null}
                </div>

                <p className="mt-3 text-sm opacity-80">
                  Neutral red/white/blue undertones with full visibility.
                </p>
              </button>
            </div>
          </div>

          {/* ADMIN */}
          <div className="mt-8">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">
                Org Admin Email
              </span>

              <input
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
          </div>

          {/* ACTION */}
          <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                Ready to provision organization?
              </p>

              <p className="mt-1 text-sm text-slate-500">
                This now creates a real organization record in Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <ClipboardList className="h-4 w-4" />

              {creating ? "Creating..." : "Create Org"}
            </button>
          </div>

          {/* ERROR */}
          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {/* SUCCESS */}
          {created ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Organization created successfully.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}