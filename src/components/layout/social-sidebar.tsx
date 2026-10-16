"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BriefcaseBusiness, House, UsersRound, UserRound } from "lucide-react";

export function SocialSidebar() {
  const pathname = usePathname();
  const homeActive = pathname === "/social";
  const networkActive = pathname === "/social/network" || pathname.startsWith("/social/network/");
  const jobsActive = pathname === "/social/jobs" || pathname.startsWith("/social/jobs/");
  const profileActive = pathname === "/social/profile" || pathname.startsWith("/social/profile/");

  return (
    <aside className="flex h-screen w-full max-w-[280px] flex-col overflow-hidden border-r border-slate-800/70 bg-slate-950 text-white lg:max-w-[210px]">
      <div className="border-b border-white/10 bg-gradient-to-br from-slate-900 via-violet-950/70 to-slate-950 px-6 py-8 text-white lg:px-[18px] lg:py-6">
        <Link href="/social" className="block">
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/aether-logo-full.png"
              alt="Aether.os logo"
              width={180}
              height={120}
              className="h-auto w-[175px] object-contain lg:w-[131px]"
              priority
            />
            <p className="mt-2 text-center text-sm font-medium text-slate-100 lg:mt-1.5 lg:text-[11px]">
              Aether Social
            </p>
          </div>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-5 lg:px-3 lg:py-4">
        <p className="mb-4 px-3 text-xs font-bold uppercase tracking-[0.26em] text-slate-400 lg:mb-3 lg:px-2 lg:text-[9px]">
          Social
        </p>
        <nav aria-label="Social navigation" className="space-y-2 lg:space-y-1.5">
          <Link
            href="/social"
            aria-current={homeActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px] ${homeActive ? "bg-black/55 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            <House className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Home
          </Link>
          <Link
            href="/social/network"
            aria-current={networkActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px] ${networkActive ? "bg-black/55 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            <UsersRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Network
          </Link>
          <Link
            href="/social/jobs"
            aria-current={jobsActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px] ${jobsActive ? "bg-black/55 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            <BriefcaseBusiness className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Jobs
          </Link>
          <Link
            href="/social/profile"
            aria-current={profileActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px] ${profileActive ? "bg-black/55 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            <UserRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Profile
          </Link>
          <Link
            href="/aether-academy"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[11px]"
          >
            <BookOpen className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Academy
          </Link>
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-slate-950 px-4 py-4 lg:px-3">
        <p className="text-center text-xs text-slate-500 lg:text-[10px]">Social · In development</p>
      </div>
    </aside>
  );
}
