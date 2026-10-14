"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, UsersRound, UserRound, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SocialProfile = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
};

export default function SocialNetworkPage() {
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownAuthId, setOwnAuthId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let alive = true;
    async function loadProfiles() {
      setLoading(true);
      setError("");
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError || !auth.user) {
        window.location.replace("/login-social");
        return;
      }
      setOwnAuthId(auth.user.id);
      const { data, error: fetchError } = await supabase
        .from("social_profiles")
        .select("id, auth_user_id, display_name, username, bio")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!alive) return;
      if (fetchError) setError(fetchError.message);
      else setProfiles((data ?? []) as SocialProfile[]);
      setLoading(false);
    }
    void loadProfiles();
    return () => { alive = false; };
  }, [supabase, refreshCount]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    return profiles.filter((profile) => {
      if (profile.auth_user_id === ownAuthId) return false;
      if (!needle) return true;
      return (
        (profile.display_name ?? "").toLowerCase().includes(needle) ||
        (profile.username ?? "").toLowerCase().includes(needle)
      );
    });
  }, [profiles, query, ownAuthId]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 text-slate-100 sm:px-6">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Aether Social</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight">
          <UsersRound className="h-8 w-8 text-violet-400" /> Network
        </h1>
        <p className="mt-2 text-sm text-slate-400">Discover people in the Aether community.</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Find people</h2>
          <button type="button" onClick={() => setRefreshCount((n) => n + 1)} disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or @username" aria-label="Search Social profiles"
            className="w-full rounded-xl border border-white/20 bg-slate-950/70 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-400" />
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            Couldn't load profiles: {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-12 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Looking for people...
          </div>
        ) : !error && matches.length === 0 ? (
          <div className="py-12 text-center">
            <UsersRound className="mx-auto h-10 w-10 text-violet-400/70" />
            <h3 className="mt-4 text-lg font-bold">
              {query.trim() ? "No matching profiles" : "Nobody else here yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {query.trim()
                ? "Try another name or username."
                : "People will appear here after their Social profiles are created. Existing Aether accounts don't automatically appear until they have a Social profile."}
            </p>
          </div>
        ) : !error ? (
          <>
            <p className="mt-5 text-xs text-slate-400">
              {matches.length} {matches.length === 1 ? "profile" : "profiles"} found
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {matches.map((person) => (
                <Link key={person.id} href={`/social/profile/${person.id}`}
                  className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-violet-400/50 hover:bg-violet-500/10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-200">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-white">{person.display_name || "Aether Social Member"}</h3>
                    <p className="mt-1 truncate text-sm text-violet-300">
                      {person.username ? `@${person.username}` : "Username not set"}
                    </p>
                    {person.bio && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{person.bio}</p>}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
                      View profile <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>
      <p className="mt-5 text-xs leading-6 text-slate-500">
        This is profile discovery, not a connection system yet. Only Social profiles appear here, not every Political or Business user.
      </p>
    </main>
  );
}
