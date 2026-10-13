"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  GraduationCap,
  Heart,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  Moon,
  PenLine,
  Search,
  Sparkles,
  Sun,
  UsersRound,
} from "lucide-react";

type SocialContext = "professional" | "personal";

export default function SocialHomePage() {
  const [context, setContext] = useState<SocialContext>("professional");
  const professional = context === "professional";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Aether Social</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Home</h1>
          <p className="mt-1 text-sm text-slate-500">Your people. Your opportunities. Your world.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Social experience">
          <button
            type="button"
            onClick={() => setContext("professional")}
            aria-pressed={professional}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${professional ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Sun className="h-4 w-4" /> Professional
          </button>
          <button
            type="button"
            onClick={() => setContext("personal")}
            aria-pressed={!professional}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${!professional ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Moon className="h-4 w-4" /> Personal
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-violet-950 px-6 py-6 text-white">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/10 p-3">{professional ? <BriefcaseBusiness className="h-6 w-6" /> : <Heart className="h-6 w-6" />}</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">{professional ? "Professional space" : "Personal space"}</p>
                  <h2 className="mt-1 text-xl font-bold">{professional ? "Build your next chapter." : "Stay connected to your world."}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {professional
                      ? "Discover people, organizations, career opportunities, and learning across the Aether ecosystem."
                      : "A place for conversations, communities, and the moments worth sharing."}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><UsersRound className="h-5 w-5" /></div>
                <div className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  {professional ? "Share a professional update..." : "What's on your mind?"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <span className="inline-flex items-center gap-1.5"><ImagePlus className="h-4 w-4" /> Media</span>
                  <span className="inline-flex items-center gap-1.5"><PenLine className="h-4 w-4" /> Post</span>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">Posting coming soon</span>
              </div>
            </div>
          </section>

          <section className="flex min-h-[270px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="rounded-2xl bg-violet-50 p-4 text-violet-700">{professional ? <Sparkles className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}</div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">{professional ? "Your professional feed starts here" : "Your personal feed starts here"}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {professional
                ? "Updates from your network and organizations will appear here once Social accounts, connections, and posting are live."
                : "Posts from friends and communities will appear here once we connect the Social experience."}
            </p>
            <span className="mt-5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-violet-700">Under construction</span>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900"><UsersRound className="h-5 w-5 text-violet-600" /><h2 className="font-bold">Your Aether identity</h2></div>
            <p className="mt-3 text-sm leading-6 text-slate-500">One personal identity, with the option to connect verified Political and Business experience later.</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500"><LockKeyhole className="h-4 w-4 shrink-0" /> Account linking is not enabled yet.</div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Explore what's coming</h2>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3"><Search className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Find your network</p><p className="text-xs text-slate-500">People and organization profiles · Coming soon</p></div></div>
              <div className="flex gap-3"><BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Jobs and hiring</p><p className="text-xs text-slate-500">Opportunities across the ecosystem · Coming soon</p></div></div>
              <div className="flex gap-3"><GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Aether Academy</p><p className="text-xs text-slate-500">Learn and grow with Aether</p><Link href="/aether-academy" className="mt-1 inline-block text-xs font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-900">Visit Academy</Link></div></div>
            </div>
          </section>
          <p className="px-2 text-center text-xs text-slate-400">Aether Social · Early development preview</p>
        </aside>
      </div>
    </div>
  );
}
