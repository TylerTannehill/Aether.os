import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";

export default function BusinessTeamManagementPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Link
                href="/business/dashboard/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Control
              </Link>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                  <Shield className="h-4 w-4" />
                  Organization administration
                </div>

                <h1 className="text-3xl font-semibold tracking-tight">
                  Manage Team
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Manage the people who have access to this organization.
                  Business roles, module permissions, and provisioning will be
                  connected here once that access model is defined.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <UserPlus className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Organization access
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Add team member
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Team member creation will be connected here when Business
                access and provisioning are ready. No users are created from
                this page yet.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="email"
                placeholder="team.member@example.com"
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />

              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
              >
                Add Team Member
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Organization members
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Current team
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Team membership will appear here once this page is connected
                  to organization access data.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                Not connected
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search team members..."
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-500 outline-none"
              />
            </div>

            <div className="mt-5 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div className="max-w-md">
                <Users className="mx-auto h-7 w-7 text-slate-400" />
                <h3 className="mt-3 font-semibold text-slate-900">
                  Team data is not connected yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  When organization membership is wired into Business Admin,
                  real team members and access controls will appear here.
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <Shield className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Future access model
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Roles, permissions &amp; provisioning
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            Business module access and administrative permissions will live
            here after the provisioning model is intentionally defined. This
            page does not inherit Political departments, campaign roles, or
            tier restrictions.
          </p>
        </section>
      </div>
    </main>
  );
}
