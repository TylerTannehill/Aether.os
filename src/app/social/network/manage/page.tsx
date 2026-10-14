"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Loader2, LockKeyhole, RefreshCw, Search, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_grants_personal: boolean;
  recipient_grants_personal: boolean;
};
type Member = { id: string; display_name: string | null; username: string | null };
type Position = { profile_id: string; job_title: string | null; company_name: string | null; is_current: boolean; start_date: string | null };

export default function ManageConnectionsPage() {
  const [supabase] = useState(() => createClient());
  const [myId, setMyId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) {
          window.location.replace("/login-social");
          return;
        }
        const { data: mine, error: mineError } = await supabase.from("social_profiles")
          .select("id").eq("auth_user_id", auth.user.id).maybeSingle();
        if (mineError) throw mineError;
        if (!mine) throw new Error("Your Social profile could not be found.");
        const { data: rows, error: rowsError } = await supabase.from("social_connections")
          .select("id, requester_id, recipient_id, requester_grants_personal, recipient_grants_personal")
          .eq("status", "accepted")
          .or(`requester_id.eq.${mine.id},recipient_id.eq.${mine.id}`);
        if (rowsError) throw rowsError;
        const accepted = (rows ?? []) as Connection[];
        const ids = [...new Set(accepted.map(c => c.requester_id === mine.id ? c.recipient_id : c.requester_id))];
        let people: Member[] = [];
        let jobs: Position[] = [];
        if (ids.length) {
          const [profilesResult, positionsResult] = await Promise.all([
            supabase.from("social_profiles").select("id, display_name, username").in("id", ids),
            supabase.from("social_professional_experience")
              .select("profile_id, job_title, company_name, is_current, start_date")
              .in("profile_id", ids).eq("is_current", true).order("start_date", { ascending: false }),
          ]);
          if (profilesResult.error) throw profilesResult.error;
          if (positionsResult.error) throw positionsResult.error;
          people = (profilesResult.data ?? []) as Member[];
          jobs = (positionsResult.data ?? []) as Position[];
        }
        if (!alive) return;
        setMyId(mine.id);
        setConnections(accepted);
        setMembers(people);
        setPositions(jobs);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Unable to load your connections.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, [supabase, refresh]);

  const memberById = useMemo(() => new Map(members.map(member => [member.id, member])), [members]);
  const jobById = useMemo(() => {
    const map = new Map<string, Position>();
    for (const position of positions) if (!map.has(position.profile_id)) map.set(position.profile_id, position);
    return map;
  }, [positions]);
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase().replace(/^@/, "");
    return connections.filter(connection => {
      const otherId = connection.requester_id === myId ? connection.recipient_id : connection.requester_id;
      const member = memberById.get(otherId);
      const job = jobById.get(otherId);
      return !needle || [member?.display_name, member?.username, job?.job_title, job?.company_name]
        .some(value => (value ?? "").toLowerCase().includes(needle));
    }).sort((a, b) => {
      const aId = a.requester_id === myId ? a.recipient_id : a.requester_id;
      const bId = b.requester_id === myId ? b.recipient_id : b.requester_id;
      return (memberById.get(aId)?.display_name ?? "").localeCompare(memberById.get(bId)?.display_name ?? "");
    });
  }, [connections, myId, search, memberById, jobById]);
  const personalCount = connections.filter(c => c.requester_id === myId ? c.requester_grants_personal : c.recipient_grants_personal).length;

  async function change(connection: Connection, action: "remove" | "grant" | "revoke") {
    if (busyId) return;
    setBusyId(connection.id);
    setError("");
    setNotice("");
    const { data, error: actionError } = await supabase.rpc(
      action === "remove" ? "social_remove_connection" : "social_set_personal_access",
      action === "remove"
        ? { p_connection_id: connection.id }
        : { p_connection_id: connection.id, p_allow: action === "grant" }
    );
    if (actionError || data !== true) {
      setError(actionError?.message ?? "That change could not be saved. Please refresh and try again.");
    } else if (action === "remove") {
      setConnections(current => current.filter(item => item.id !== connection.id));
      setNotice("Professional connection removed. Personal sharing with this person has ended too.");
    } else {
      setConnections(current => current.map(item => item.id === connection.id
        ? item.requester_id === myId
          ? { ...item, requester_grants_personal: action === "grant" }
          : { ...item, recipient_grants_personal: action === "grant" }
        : item));
      setNotice(action === "grant" ? "Personal access granted." : "Personal access revoked.");
    }
    setConfirmRemove(null);
    setBusyId(null);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 text-slate-100 sm:px-6">
      <Link href="/social/network" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
        <ArrowLeft className="h-4 w-4" /> Back to Network
      </Link>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-xl">
        <div className="bg-gradient-to-r from-[#17132e] via-[#23214d] to-[#172c49] px-6 py-7 sm:px-8 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-100/80">Aether Social</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-white sm:text-4xl"><UsersRound className="h-8 w-8" /> Manage My Connections</h1>
          <p className="mt-2 text-sm text-violet-100">One place to manage your professional network and the people you trust with personal access.</p>
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"><BriefcaseBusiness className="mr-2 inline h-4 w-4 text-violet-300" />{connections.length} professional</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"><LockKeyhole className="mr-2 inline h-4 w-4 text-violet-300" />{personalCount} personal access</span>
          </div>
          <button type="button" disabled={loading || !!busyId} onClick={() => { setNotice(""); setRefresh(n => n + 1); }} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, @username, role, or company" aria-label="Search connections" className="w-full rounded-xl border border-white/20 bg-slate-950/70 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-400" />
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <div className="hidden grid-cols-[minmax(0,1fr)_170px_170px] gap-4 border-b border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
            <span>Person · Role & Company</span><span>Professional</span><span>Personal</span>
          </div>
          {loading ? <div className="flex items-center gap-2 p-8 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading connections...</div>
          : !error && visible.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">{search.trim() ? "No connections match your search." : "No professional connections yet. Visit Make Connections to find people."}</div>
          : visible.map(connection => {
            const otherId = connection.requester_id === myId ? connection.recipient_id : connection.requester_id;
            const member = memberById.get(otherId);
            const job = jobById.get(otherId);
            const granted = connection.requester_id === myId ? connection.requester_grants_personal : connection.recipient_grants_personal;
            const busy = busyId === connection.id;
            return <div key={connection.id} className="grid gap-4 border-b border-white/10 bg-white/[0.025] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_170px_170px] md:items-center md:px-5">
              <Link href={`/social/profile/${otherId}`} className="group flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-200"><UserRound className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block truncate font-bold text-white group-hover:text-violet-200">{member?.display_name || "Aether Social Member"} <ArrowRight className="inline h-3.5 w-3.5" /></span>
                  <span className="block truncate text-xs text-violet-300">{member?.username ? `@${member.username}` : "View profile"}</span>
                  <span className="mt-1 block text-sm text-slate-400">{job ? [job.job_title, job.company_name].filter(Boolean).join(" at ") : "No current role listed"}</span>
                </span>
              </Link>
              <div className="flex items-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-2 text-xs font-semibold text-emerald-200"><Check className="h-3.5 w-3.5" /> Connected</span>
                <button type="button" disabled={!!busyId} onClick={() => setConfirmRemove(connection.id)} aria-label={`Remove professional connection with ${member?.display_name || "member"}`} title="Remove professional connection" className="rounded-lg border border-rose-400/20 p-2 text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                {granted ? <><span className="inline-flex items-center gap-1 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-2 text-xs font-semibold text-violet-200"><ShieldCheck className="h-3.5 w-3.5" /> Allowed</span>
                  <button type="button" disabled={!!busyId} onClick={() => void change(connection, "revoke")} aria-label={`Revoke personal access for ${member?.display_name || "member"}`} title="Revoke personal access" className="rounded-lg border border-rose-400/20 p-2 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}</button></>
                  : <button type="button" disabled={!!busyId} onClick={() => void change(connection, "grant")} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Grant access</button>}
              </div>
              {confirmRemove === connection.id && <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm md:col-span-3">
                <p className="font-semibold text-rose-100">Remove {member?.display_name || "this member"} from your professional connections?</p>
                <p className="mt-1 text-rose-100/80">This also ends personal access between you. You can reconnect later.</p>
                <div className="mt-3 flex gap-2"><button type="button" disabled={!!busyId} onClick={() => void change(connection, "remove")} className="rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-50">Remove connection</button><button type="button" onClick={() => setConfirmRemove(null)} className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Cancel</button></div>
              </div>}
            </div>;
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">Professional removal ends the connection. Personal access controls only what you share with that person; their sharing permissions are independent.</p>
      </section>
    </main>
  );
}
