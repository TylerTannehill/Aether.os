"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, UsersRound, UserRound, Loader2, ArrowRight, RefreshCw, Check, X, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSocialExperience } from "@/components/layout/social-shell";

type SocialProfile = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
};

type PersonalGrant = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_grants_personal: boolean;
  recipient_grants_personal: boolean;
};

type IncomingRequest = {
  id: string;
  requester_id: string;
  created_at: string;
};

export default function SocialNetworkPage() {
  const experience = useSocialExperience();
  const isEmployer = experience === "employer";
  const isIndividual = experience === "individual";
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [query, setQuery] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownAuthId, setOwnAuthId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [myPeople, setMyPeople] = useState<PersonalGrant[]>([]);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [peopleError, setPeopleError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadProfiles() {
      setLoading(true);
      setError("");
      setRequestError("");
      setPeopleError("");
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError || !auth.user) {
        window.location.replace("/login-social");
        return;
      }
      setOwnAuthId(auth.user.id);
      const { data: myProfile, error: myProfileError } = await supabase
        .from("social_profiles")
        .select("id")
        .eq("auth_user_id", auth.user.id)
        .maybeSingle();
      if (!alive) return;
      setMyProfileId(myProfile?.id ?? null);
      if (!isIndividual) {
        setIncoming([]);
        setMyPeople([]);
      } else if (myProfileError) {
        setRequestError("Could not load your Social identity: " + myProfileError.message);
        setIncoming([]);
        setMyPeople([]);
      } else if (myProfile) {
        const { data: grants, error: grantsError } = await supabase
          .from("social_connections")
          .select("id, requester_id, recipient_id, requester_grants_personal, recipient_grants_personal")
          .eq("status", "accepted")
          .or(`requester_id.eq.${myProfile.id},recipient_id.eq.${myProfile.id}`);
        if (!alive) return;
        if (grantsError) {
          setPeopleError("Could not load your people right now.");
          setMyPeople([]);
        } else {
          setMyPeople(((grants ?? []) as PersonalGrant[]).filter((grant) =>
            grant.requester_id === myProfile.id ? grant.requester_grants_personal : grant.recipient_grants_personal
          ));
        }
        const { data: requests, error: requestsError } = await supabase
          .from("social_connections")
          .select("id, requester_id, created_at")
          .eq("recipient_id", myProfile.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (!alive) return;
        if (requestsError) {
          setRequestError("Could not load incoming requests: " + requestsError.message);
          setIncoming([]);
        } else {
          setIncoming((requests ?? []) as IncomingRequest[]);
        }
      } else {
        setIncoming([]);
        setMyPeople([]);
      }
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
  }, [supabase, refreshCount, isIndividual]);

  async function handleRequest(connectionId: string, action: "accept" | "decline") {
    if (!isIndividual || busyRequestId) return;
    setBusyRequestId(connectionId);
    setRequestError("");
    setRequestNotice("");
    const functionName = action === "accept" ? "social_accept_connection" : "social_remove_connection";
    const { data, error: actionError } = await supabase.rpc(functionName, {
      p_connection_id: connectionId,
    });
    if (actionError || data !== true) {
      setRequestError(actionError?.message ?? "This request could not be updated. Refresh and try again.");
    } else {
      setIncoming((current) => current.filter((request) => request.id !== connectionId));
      setRequestNotice(action === "accept" ? "Connection accepted." : "Connection request declined.");
    }
    setBusyRequestId(null);
  }

  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);

  const filteredMyPeople = useMemo(() => {
    const needle = peopleQuery.trim().toLowerCase().replace(/^@/, "");
    if (!needle) return myPeople;
    return myPeople.filter((grant) => {
      const personId = grant.requester_id === myProfileId ? grant.recipient_id : grant.requester_id;
      const person = profileById.get(personId);
      return (person?.display_name ?? "").toLowerCase().includes(needle) ||
        (person?.username ?? "").toLowerCase().includes(needle);
    });
  }, [myPeople, peopleQuery, myProfileId, profileById]);

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
    <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-3 text-slate-100 sm:px-6 sm:pt-4">
      <section className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-xl">
        <div className="bg-gradient-to-r from-[#17132e] via-[#23214d] to-[#172c49] px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-100/80">Aether Social</p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl"><UsersRound className="h-9 w-9" /> Your Network</h1>
              <p className="mt-2 text-sm text-violet-100">{isEmployer ? "Discover professionals and explore their work." : "Build professional connections. Choose who gets to know you personally."}</p>
            </div>
            {isIndividual && <Link href="/social/network/manage" className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:border-violet-300/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 sm:self-center">
              Manage My Connections <ArrowRight className="h-4 w-4" />
            </Link>}
          </div>
        </div>
      </section>

      {isIndividual && <div className="mb-5 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
      <section className="flex h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-xl sm:p-6" aria-labelledby="incoming-requests-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="incoming-requests-heading" className="flex items-center gap-2 text-lg font-bold">
            <UsersRound className="h-5 w-5 text-violet-300" /> Incoming requests
            {incoming.length > 0 && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">{incoming.length}</span>}
          </h2>
          <button type="button" onClick={() => setRefreshCount((n) => n + 1)} disabled={loading || busyRequestId !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-400">Review professional connection requests.</p>
        {requestError && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{requestError}</p>}
        {requestNotice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{requestNotice}</p>}
        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Checking requests...</div>
        ) : incoming.length === 0 ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">No incoming connection requests right now.</p>
        ) : (
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {incoming.map((request) => {
              const sender = profileById.get(request.requester_id);
              const busy = busyRequestId === request.id;
              return (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <Link href={`/social/profile/${request.requester_id}`} className="flex min-w-0 items-center gap-3 hover:text-violet-200">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-200"><UserRound className="h-5 w-5" /></span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{sender?.display_name || "Aether Social Member"}</span>
                      <span className="block truncate text-xs text-violet-300">{sender?.username ? `@${sender.username}` : "View professional profile"}</span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busyRequestId !== null} onClick={() => void handleRequest(request.id, "accept")}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
                    </button>
                    <button type="button" disabled={busyRequestId !== null} onClick={() => void handleRequest(request.id, "decline")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50">
                      <X className="h-4 w-4" /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="flex h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-xl sm:p-6" aria-labelledby="my-people-heading">
        <h2 id="my-people-heading" className="flex items-center gap-2 text-lg font-bold"><LockKeyhole className="h-5 w-5 text-violet-300" /> View My People</h2>
        <p className="mt-2 text-sm text-slate-400">People you've allowed to see your personal profile.</p>
        <div className="relative mt-3 shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)}
            placeholder="Search My People" aria-label="Search people with personal access"
            className="w-full rounded-lg border border-white/20 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-400" />
        </div>
        {peopleError && <p role="alert" className="mt-4 text-sm text-rose-200">{peopleError}</p>}
        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading your people...</p>
        ) : myPeople.length === 0 && !peopleError ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">You haven't granted anyone personal access yet.</p>
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <div className="space-y-3">
            {filteredMyPeople.map((grant) => {
              const personId = grant.requester_id === myProfileId ? grant.recipient_id : grant.requester_id;
              const person = profileById.get(personId);
              return <Link key={grant.id} href={`/social/profile/${personId}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-violet-400/50">
                <UserRound className="h-6 w-6 shrink-0 text-violet-300" />
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{person?.display_name || 'Aether Social Member'}</span><span className="block truncate text-xs text-violet-300">{person?.username ? `@${person.username}` : 'View profile'}</span></span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-violet-300" />
              </Link>;
            })}
            {filteredMyPeople.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">No people match your search.</p>
            )}
            </div>
          </div>
        )}
      </section>
      </div>}

      <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Make Connections</h2>
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
        {isEmployer ? "Employer experience shows professional discovery only. Personal profiles and sharing are unavailable to employers." : "Only Social profiles appear here, not every Political or Business user. Professional profiles remain discoverable whether or not you are connected."}
      </p>
    </main>
  );
}
