"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function CampaignLockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070B1A] p-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[#2A2F4A] bg-[#0F172A] p-10 shadow-2xl">
        <div className="flex justify-center">
          <Image src="/aether-logo-full.png" alt="Aether" width={240} height={60} priority />
        </div>

        <h1 className="mt-8 text-center text-4xl font-bold text-white">
          Campaign Locked
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-center text-base leading-7 text-slate-300">
          This campaign has been suspended or scheduled for deletion.
          Access to Aether has been temporarily disabled for this
          organization.
        </p>

        <div className="mt-8 rounded-3xl border border-[#5B3DF5]/30 bg-[#141C33] p-6">
          <h2 className="text-lg font-semibold text-[#A78BFA]">
            What does this mean?
          </h2>

          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>• Your organization is currently unavailable.</li>
            <li>• Existing campaign data has been preserved.</li>
            <li>• If this was done in error, Team Aether can restore access before permanent deletion.</li>
            <li>• If you believe your campaign should still be active, please contact Team Aether.</li>
          </ul>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Login
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Team Aether • Clarity. Focus. Execution.
        </p>
      </div>
    </main>
  );
}