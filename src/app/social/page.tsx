"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  BriefcaseBusiness,
  GraduationCap,
  Heart,
  LockKeyhole,
  MessageCircle,
  Moon,
  PenLine,
  Loader2,
  Send,
  UserRound,
  Search,
  Sparkles,
  Sun,
  UsersRound,
} from "lucide-react";

type SocialContext = "professional" | "personal";
type SocialProfile = { id: string; display_name: string | null; username: string | null; avatar_path: string | null };
type SocialPost = { id: string; author_id: string; context: SocialContext; content: string; created_at: string };
type FeedPost = SocialPost & { author: SocialProfile | null; personalAvatarPath: string | null };

function postContent(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!/^https?:\/\//.test(part)) return <span key={index}>{part}</span>;
    try {
      const url = new URL(part);
      if (!['http:', 'https:'].includes(url.protocol)) return <span key={index}>{part}</span>;
      return <a key={index} href={url.href} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900">{part}</a>;
    } catch { return <span key={index}>{part}</span>; }
  });
}


export default function SocialHomePage() {
  const [context, setContext] = useState<SocialContext>("professional");
  const professional = context === "professional";
  const [supabase] = useState(() => createClient());
  const [me, setMe] = useState<SocialProfile | null>(null);
  const [myPersonalAvatar, setMyPersonalAvatar] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<SocialContext, string>>({ professional: "", personal: "" });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  const avatarUrl = (path: string | null | undefined) => path
    ? supabase.storage.from("social-avatars").getPublicUrl(path).data.publicUrl
    : null;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) { setError("Sign in to publish posts."); setLoading(false); return; }
      const { data, error: profileError } = await supabase.from("social_profiles")
        .select("id, display_name, username, avatar_path").eq("auth_user_id", user.id).maybeSingle();
      if (!active) return;
      if (profileError || !data) { setError("Your Aether Social profile could not be loaded."); setLoading(false); return; }
      setMe(data as SocialProfile);
      const { data: personal } = await supabase.from("social_personal_profiles")
        .select("avatar_path").eq("profile_id", data.id).maybeSingle();
      if (active) setMyPersonalAvatar(personal?.avatar_path ?? null);
    })();
    return () => { active = false; };
  }, [supabase]);

  const loadFeed = useCallback(async (selected: SocialContext) => {
    setLoading(true);
    setFeedError(null);
    setPosts([]);
    const { data, error: postsError } = await supabase.from("social_posts")
      .select("id, author_id, context, content, created_at")
      .eq("context", selected).order("created_at", { ascending: false }).limit(100);
    if (postsError) { setFeedError(postsError.message); setLoading(false); return; }
    const records = (data ?? []) as SocialPost[];
    if (!records.length) { setLoading(false); return; }
    const ids = [...new Set(records.map((post) => post.author_id))];
    const { data: authors, error: authorsError } = await supabase.from("social_profiles")
      .select("id, display_name, username, avatar_path").in("id", ids);
    if (authorsError) { setFeedError(authorsError.message); setLoading(false); return; }
    const authorMap = new Map((authors ?? []).map((author) => [author.id, author as SocialProfile]));
    let personalMap = new Map<string, string | null>();
    if (selected === "personal") {
      const { data: personal, error: personalError } = await supabase.from("social_personal_profiles")
        .select("profile_id, avatar_path").in("profile_id", ids);
      if (personalError) { setFeedError(personalError.message); setLoading(false); return; }
      personalMap = new Map((personal ?? []).map((entry) => [entry.profile_id, entry.avatar_path]));
    }
    setPosts(records.map((post) => ({ ...post, author: authorMap.get(post.author_id) ?? null, personalAvatarPath: personalMap.get(post.author_id) ?? null })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadFeed(context); }, [context, loadFeed]);

  async function publishPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = drafts[context].trim();
    if (!me || !content || content.length > 5000 || posting) return;
    setPosting(true);
    setError(null);
    const { error: insertError } = await supabase.from("social_posts").insert({ author_id: me.id, context, content });
    if (insertError) setError(insertError.message);
    else {
      setDrafts((previous) => ({ ...previous, [context]: "" }));
      await loadFeed(context);
    }
    setPosting(false);
  }


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
            <form onSubmit={publishPost} className="px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-violet-700">
                  {avatarUrl(professional ? me?.avatar_path : myPersonalAvatar) ? <img src={avatarUrl(professional ? me?.avatar_path : myPersonalAvatar)!} alt="Your avatar" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" />}
                </div>
                <textarea value={drafts[context]} onChange={(event) => setDrafts((previous) => ({ ...previous, [context]: event.target.value }))}
                  maxLength={5000} rows={3} disabled={!me || posting}
                  placeholder={professional ? "Share a professional update..." : "What's on your mind?"}
                  className="min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60" />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <PenLine className="h-4 w-4" /> Text & links · {professional ? "Professional" : "Authorized personal viewers"}
                  <span className="ml-2 text-slate-400">{drafts[context].length}/5000</span>
                </div>
                <button type="submit" disabled={!me || posting || !drafts[context].trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40">
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
                </button>
              </div>
              {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
            </form>
          </section>

          {loading ? (
            <section className="flex min-h-[220px] items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500 shadow-sm"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading posts...</section>
          ) : feedError ? (
            <section className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm" role="alert">Could not load posts: {feedError}</section>
          ) : posts.length ? (
            <div className="space-y-4">
              {posts.map((post) => {
                const picture = avatarUrl(professional ? post.author?.avatar_path : post.personalAvatarPath);
                return <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-violet-700">
                      {picture ? <img src={picture} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-950">{post.author?.display_name || post.author?.username || "Aether member"}</p>
                      <p className="text-xs text-slate-500">{professional ? "Professional" : "Personal"} · {new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{postContent(post.content)}</p>
                </article>;
              })}
            </div>
          ) : (
            <section className="flex min-h-[270px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="rounded-2xl bg-violet-50 p-4 text-violet-700">{professional ? <Sparkles className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}</div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{professional ? "Your professional feed starts here" : "Your personal feed starts here"}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{professional ? "No professional posts yet. Share the first update." : "No personal posts from you or people who have granted you access yet."}</p>
            </section>
          )}
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
