"use client";

import Link from "next/link";

const templates = [
  {
    title: "Email 1 - Introduction",
    subject: "Simplifying Campaign Operations",
    body: `Hi {{First Name}},

I hope you're doing well.

My name is {{Your Name}}, and I'm part of Team Aether.

We built Aether because campaign teams deserve better tools. Most campaigns end up juggling spreadsheets, disconnected software, and information spread across multiple platforms.

You can learn more at https://aetheros.pro or reply to this email and we'd be happy to schedule a demo.

Thanks for your time!

— Team Aether`,
  },
  {
    title: "Email 2 - Follow Up",
    subject: "Following Up",
    body: `Hi {{First Name}},

Just checking back in to see if you've had a chance to look at Aether.

If you'd like to learn more, Aether Academy walks through the platform, or we'd be happy to schedule a quick demo.

Thanks again!

— Team Aether`,
  },
  {
    title: "Email 3 - Final Follow Up",
    subject: "Final Follow Up",
    body: `Hi {{First Name}},

I wanted to reach out one last time.

Aether was built specifically for campaign teams to simplify day-to-day operations across Finance, Field, Outreach, Digital and Print.

If you'd like to see what you're missing, we'd love to schedule a demo.

Best of luck this campaign season!

— Team Aether`,
  },
  {
    title: "Demo Scheduling",
    subject: "Let's Schedule Your Demo",
    body: `Hi {{First Name}},

Thanks for your interest in Aether.

Send us a few dates and times that work best for you and we'll get a demo on the calendar.

Looking forward to meeting you!

— Team Aether`,
  },
  {
    title: "Provisioned",
    subject: "Welcome to Aether!",
    body: `Hi {{First Name}},

Your organization has been provisioned successfully.

Organization:
{{Organization}}

Username:
{{Username}}

Temporary Password:
{{Password}}

Login:
https://aetheros.pro

Welcome to Team Aether!

— Team Aether`,
  },
];

export default function EmailTemplatesPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                Team Aether
              </div>
              <h1 className="mt-4 text-5xl font-bold">Email Templates</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Manage the default email templates used throughout Team Aether.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-[430px]">
              <Link href="/team-aether/dashboard" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Dashboard</Link>
              <Link href="/team-aether" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Provisioning</Link>
              <Link href="/team-aether/sales-pipeline" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Sales Pipeline</Link>
              <Link href="/team-aether/support" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Support</Link>
              <Link href="/logout" className="col-span-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Logout</Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Available Variables</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {["{{First Name}}","{{Campaign}}","{{Organization}}","{{Username}}","{{Password}}","{{Demo Date}}","{{Demo Time}}"].map(v=>(
                  <span key={v} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">{v}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="rounded-2xl bg-slate-950 px-5 py-3 text-white font-semibold">Save Changes</button>
              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold">Restore Defaults</button>
            </div>
          </div>
        </section>

        {templates.map((t)=>(
          <section key={t.title} className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-bold">{t.title}</h2>

            <label className="mt-6 block text-sm font-semibold uppercase tracking-wide text-slate-500">
              Subject
            </label>
            <input
              defaultValue={t.subject}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
            />

            <label className="mt-6 block text-sm font-semibold uppercase tracking-wide text-slate-500">
              Body
            </label>
            <textarea
              defaultValue={t.body}
              className="mt-2 h-64 w-full rounded-2xl border border-slate-200 p-4"
            />

            <div className="mt-4 flex gap-3">
              <button className="rounded-xl bg-slate-950 px-4 py-2 text-white">Save</button>
              <button className="rounded-xl border border-slate-200 px-4 py-2">Preview</button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
