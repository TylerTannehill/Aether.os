import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function BusinessAdminPage() {
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
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Manage Team
                <ArrowRight className="h-4 w-4" />
              </Link>
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
              <h3 className="font-semibold text-slate-950">
                Organization Settings
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organization-level settings will live here as Business
                administration expands.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-950">
                Provisioning &amp; Access
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Product and module access controls will appear here once the
                Business provisioning model is defined.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
                <Settings2 className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-950">
                System Controls
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Additional Business administration controls will appear here
                when they are ready to be connected.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
