"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSocialExperience } from "@/components/layout/social-shell";
import {
  BriefcaseBusiness,
  ArrowRight,
  MapPin,
  GraduationCap,
  Heart,
  MessageCircle,
  Moon,
  PenLine,
  Loader2,
  Send,
  UserRound,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";

type SocialContext = "professional" | "personal";
type SocialProfile = { id: string; display_name: string | null; username: string | null; avatar_path: string | null };
type SocialPost = { id: string; author_id: string | null; employer_id: string | null; job_id: string | null; context: SocialContext; content: string; created_at: string };
type PromotedJob = { id: string; title: string; description: string; location: string | null; status: string; expires_at: string | null };
type PostLike = { id: string; post_id: string; profile_id: string };
type PostComment = { id: string; post_id: string; profile_id: string; content: string; created_at: string };
type FeedPost = SocialPost & { author: SocialProfile | null; employerName: string | null; personalAvatarPath: string | null; job: PromotedJob | null };

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
  const experience = useSocialExperience();
  const isEmployer = experience === "employer";
  const [context, setContext] = useState<SocialContext>("professional");
  const activeContext: SocialContext = isEmployer ? "professional" : context;
  const professional = activeContext === "professional";
  const [supabase] = useState(() => createClient());
  const [me, setMe] = useState<SocialProfile | null>(null);
  const [myPersonalAvatar, setMyPersonalAvatar] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<SocialContext, string>>({ professional: "", personal: "" });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [likes, setLikes] = useState<PostLike[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentAuthors, setCommentAuthors] = useState<Record<string, SocialProfile>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [engagementBusy, setEngagementBusy] = useState<string | null>(null);
  const [engagementError, setEngagementError] = useState<Record<string, string>>({});

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
      if (experience !== "individual") return;
      const { data: personal } = await supabase.from("social_personal_profiles")
        .select("avatar_path").eq("profile_id", data.id).maybeSingle();
      if (active) setMyPersonalAvatar(personal?.avatar_path ?? null);
    })();
    return () => { active = false; };
  }, [supabase, experience]);

  const loadFeed = useCallback(async (selected: SocialContext) => {
    setLoading(true);
    setFeedError(null);
    setPosts([]);
    setLikes([]);
    setComments([]);
    setCommentAuthors({});
    const { data, error: postsError } = await supabase.from("social_posts")
      .select("id, author_id, employer_id, job_id, context, content, created_at")
      .eq("context", selected).order("created_at", { ascending: false }).limit(100);
    if (postsError) { setFeedError(postsError.message); setLoading(false); return; }
    const records = (data ?? []) as SocialPost[];
    if (!records.length) { setLoading(false); return; }
    const ids = [...new Set(records.map((post) => post.author_id).filter((id): id is string => Boolean(id)))];
    const employerIds = [...new Set(records.map((post) => post.employer_id).filter((id): id is string => Boolean(id)))];
    const jobIds = [...new Set(records.map((post) => post.job_id).filter((id): id is string => Boolean(id)))];
    const jobMap = new Map<string, PromotedJob>();
    if (jobIds.length) {
      const { data: promotedJobs, error: jobsError } = await supabase.from("social_job_listings")
        .select("id, title, description, location, status, expires_at").in("id", jobIds);
      if (jobsError) { setFeedError(jobsError.message); setLoading(false); return; }
      for (const job of promotedJobs ?? []) jobMap.set(job.id, job as PromotedJob);
    }
    const authorMap = new Map<string, SocialProfile>();
    if (ids.length) {
      const { data: authors, error: authorsError } = await supabase.from("social_profiles")
        .select("id, display_name, username, avatar_path").in("id", ids);
      if (authorsError) { setFeedError(authorsError.message); setLoading(false); return; }
      for (const author of authors ?? []) authorMap.set(author.id, author as SocialProfile);
    }
    const employerMap = new Map<string, string>();
    if (employerIds.length) {
      const { data: employers, error: employersError } = await supabase.from("social_job_employers")
        .select("id, name").in("id", employerIds);
      if (employersError) { setFeedError(employersError.message); setLoading(false); return; }
      for (const employer of employers ?? []) employerMap.set(employer.id, employer.name);
    }
    const personalMap = new Map<string, string | null>();
    if (selected === "personal" && ids.length) {
      const { data: personal, error: personalError } = await supabase.from("social_personal_profiles")
        .select("profile_id, avatar_path").in("profile_id", ids);
      if (personalError) { setFeedError(personalError.message); setLoading(false); return; }
      for (const entry of personal ?? []) personalMap.set(entry.profile_id, entry.avatar_path);
    }
    setPosts(records.map((post) => ({
      ...post,
      author: post.author_id ? authorMap.get(post.author_id) ?? null : null,
      employerName: post.employer_id ? employerMap.get(post.employer_id) ?? null : null,
      personalAvatarPath: post.author_id ? personalMap.get(post.author_id) ?? null : null,
      job: post.job_id ? jobMap.get(post.job_id) ?? null : null,
    })));
    const individualIds = records.filter(post => post.author_id && !post.employer_id).map(post => post.id);
    if (individualIds.length && experience === "individual") {
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from("social_post_likes").select("id, post_id, profile_id").in("post_id", individualIds).limit(10000),
        supabase.from("social_post_comments").select("id, post_id, profile_id, content, created_at").in("post_id", individualIds).order("created_at", { ascending: true }).limit(10000),
      ]);
      if (likesResult.error || commentsResult.error) {
        setFeedError(likesResult.error?.message || commentsResult.error?.message || "Could not load engagement.");
      } else {
        const loadedComments = (commentsResult.data ?? []) as PostComment[];
        setLikes((likesResult.data ?? []) as PostLike[]);
        setComments(loadedComments);
        const commentProfileIds = [...new Set(loadedComments.map(comment => comment.profile_id))];
        if (commentProfileIds.length) {
          const { data: commenters } = await supabase.from("social_profiles")
            .select("id, display_name, username, avatar_path").in("id", commentProfileIds);
          setCommentAuthors(Object.fromEntries(((commenters ?? []) as SocialProfile[]).map(person => [person.id, person])));
        }
      }
    }
    setLoading(false);
  }, [supabase, experience]);

  useEffect(() => {
    if (experience === "employer" || experience === "individual") {
      void loadFeed(activeContext);
    }
  }, [experience, activeContext, loadFeed]);

  async function publishPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (experience !== "individual") return;
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


  async function toggleLike(postId: string) {
    if (isEmployer || !me || engagementBusy) return;
    setEngagementBusy(postId);
    setEngagementError(previous => ({ ...previous, [postId]: "" }));
    const existing = likes.find(like => like.post_id === postId && like.profile_id === me.id);
    const result = existing
      ? await supabase.from("social_post_likes").delete().eq("id", existing.id)
      : await supabase.from("social_post_likes").insert({ post_id: postId, profile_id: me.id }).select("id, post_id, profile_id").single();
    if (result.error) setEngagementError(previous => ({ ...previous, [postId]: result.error!.message }));
    else if (existing) setLikes(previous => previous.filter(like => like.id !== existing.id));
    else if (result.data) setLikes(previous => [...previous, result.data as PostLike]);
    setEngagementBusy(null);
  }

  async function submitComment(postId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = (commentDrafts[postId] || "").trim();
    if (isEmployer || !me || !content || content.length > 2000 || engagementBusy) return;
    setEngagementBusy(postId);
    setEngagementError(previous => ({ ...previous, [postId]: "" }));
    const { data, error: commentError } = await supabase.from("social_post_comments")
      .insert({ post_id: postId, profile_id: me.id, content })
      .select("id, post_id, profile_id, content, created_at").single();
    if (commentError) setEngagementError(previous => ({ ...previous, [postId]: commentError.message }));
    else if (data) {
      setComments(previous => [...previous, data as PostComment]);
      setCommentAuthors(previous => ({ ...previous, [me.id]: me }));
      setCommentDrafts(previous => ({ ...previous, [postId]: "" }));
      setExpandedComments(previous => ({ ...previous, [postId]: true }));
    }
    setEngagementBusy(null);
  }


  if (experience === "checking") {
    return <div className="mx-auto w-full max-w-6xl p-6 text-sm text-slate-500">Loading Social experience…</div>;
  }

  if (experience === "unavailable") {
    return <div className="mx-auto w-full max-w-6xl p-6 text-sm text-rose-700">Social experience is unavailable. Please sign in again.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <section aria-label="Explore Aether products" className="flex w-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-sm lg:min-h-[90px] lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-5 lg:py-2">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <div className="relative h-[62px] w-[150px] shrink-0 overflow-hidden sm:w-[165px]" aria-label="Aether.os logo" role="img">
            <img src="/aether-logo-full.png" alt="" className="absolute left-1/2 top-1/2 h-[170%] w-[170%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
          </div>
          <p className="min-w-0 text-xs font-semibold leading-snug text-slate-100 sm:text-sm">Clarity. Focus. Execution. For all aspects of life</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          <Link href="https://aetheros.pro/political-public" className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-lg border border-violet-400/60 bg-violet-600 px-3 py-2 text-center text-xs font-bold !text-white transition hover:bg-violet-500">Aether Political</Link>
          <Link href="https://aetheros.pro/business-public" className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-lg border border-violet-400/60 bg-violet-600 px-3 py-2 text-center text-xs font-bold !text-white transition hover:bg-violet-500">Aether Business</Link>
          <Link href="https://aetheros.pro/login-social/employer-login" className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-lg border border-violet-400/60 bg-violet-600 px-3 py-2 text-center text-xs font-bold !text-white transition hover:bg-violet-500">Aether Social</Link>
        </div>
      </section>

      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-h-[58px] items-center rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
          <h1 className="text-lg font-bold text-slate-950">Aether Social Feed</h1>
        </div>
        {!isEmployer && <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Social experience">
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
        </div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-5">
          {!isEmployer && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
          </section>}

          {loading ? (
            <section className="flex min-h-[220px] items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500 shadow-sm"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading posts...</section>
          ) : feedError ? (
            <section className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm" role="alert">Could not load posts: {feedError}</section>
          ) : posts.length ? (
            <div className="space-y-4">
              {posts.map((post) => {
                const employerPost = Boolean(post.employer_id);
                const picture = employerPost ? null : avatarUrl(professional ? post.author?.avatar_path : post.personalAvatarPath);
                return <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const authorHref = employerPost && post.employer_id
                        ? `/social/profile/employer/${post.employer_id}`
                        : post.author_id
                          ? `/social/profile/${post.author_id}${post.context === "personal" ? "?view=personal" : ""}`
                          : null;
                      const authorName = employerPost ? (post.employerName || "Aether employer") : (post.author?.display_name || post.author?.username || "Aether member");
                      const avatar = <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-violet-700">
                        {picture ? <img src={picture} alt="" className="h-full w-full object-cover" /> : employerPost ? <BriefcaseBusiness className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                      </div>;
                      return authorHref ? <Link href={authorHref} aria-label={`View ${authorName}'s profile`} className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">{avatar}</Link> : avatar;
                    })()}
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const authorHref = employerPost && post.employer_id
                          ? `/social/profile/employer/${post.employer_id}`
                          : post.author_id
                            ? `/social/profile/${post.author_id}${post.context === "personal" ? "?view=personal" : ""}`
                            : null;
                        const authorName = employerPost ? (post.employerName || "Aether employer") : (post.author?.display_name || post.author?.username || "Aether member");
                        return authorHref ? <Link href={authorHref} className="block truncate text-sm font-bold text-slate-950 hover:text-violet-700 hover:underline focus-visible:underline">{authorName}</Link> : <p className="truncate text-sm font-bold text-slate-950">{authorName}</p>;
                      })()}
                      <p className="text-xs text-slate-500">{employerPost ? "Professional · Job Opportunity" : professional ? "Professional" : "Personal"} · {new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {employerPost && post.job_id ? (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/40">
                      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-100 to-white px-5 py-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">Now hiring</p>
                        <h3 className="mt-1 text-xl font-extrabold text-slate-950">{post.job?.title ?? "Job opportunity"}</h3>
                        {post.job?.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" />{post.job.location}</p>}
                      </div>
                      <div className="space-y-4 px-5 py-4">
                        {post.job?.description && <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{post.job.description}</p>}
                        {post.job && post.job.status === "published" && (!post.job.expires_at || new Date(post.job.expires_at) > new Date()) ? (
                          <Link href={`/social/jobs?job=${encodeURIComponent(post.job.id)}`} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800">
                            View Job <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : <p className="text-sm font-semibold text-slate-500">This opportunity is no longer available.</p>}
                      </div>
                    </div>
                  ) : <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{postContent(post.content)}</p>}
                  {!employerPost && post.author_id && !isEmployer && (
                    <div className="mt-5 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-4">
                        <button type="button" disabled={!me || engagementBusy === post.id}
                          onClick={() => void toggleLike(post.id)}
                          aria-pressed={likes.some(like => like.post_id === post.id && like.profile_id === me?.id)}
                          className={`inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition disabled:opacity-50 ${likes.some(like => like.post_id === post.id && like.profile_id === me?.id) ? "text-violet-700" : "text-slate-600 hover:text-violet-700"}`}>
                          <Heart className={`h-4 w-4 ${likes.some(like => like.post_id === post.id && like.profile_id === me?.id) ? "fill-current" : ""}`} />
                          {likes.filter(like => like.post_id === post.id).length} {likes.filter(like => like.post_id === post.id).length === 1 ? "Like" : "Likes"}
                        </button>
                        <button type="button" onClick={() => setExpandedComments(previous => ({ ...previous, [post.id]: !previous[post.id] }))}
                          aria-expanded={Boolean(expandedComments[post.id])}
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 hover:text-violet-700">
                          <MessageCircle className="h-4 w-4" /> {comments.filter(comment => comment.post_id === post.id).length} Comments
                        </button>
                      </div>
                      {engagementError[post.id] && <p role="alert" className="mt-2 text-xs text-rose-700">{engagementError[post.id]}</p>}
                      {expandedComments[post.id] && (
                        <div className="mt-3 space-y-3 border-t border-slate-100 pt-4">
                          {comments.filter(comment => comment.post_id === post.id).map(comment => {
                            const commenter = commentAuthors[comment.profile_id];
                            return <div key={comment.id} className="rounded-xl bg-slate-50 px-4 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <Link href={`/social/profile/${comment.profile_id}${post.context === "personal" ? "?view=personal" : ""}`} className="text-sm font-bold text-violet-700 hover:underline">
                                  {commenter?.display_name || commenter?.username || "Aether member"}
                                </Link>
                                <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{comment.content}</p>
                            </div>;
                          })}
                          <form onSubmit={event => void submitComment(post.id, event)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <textarea rows={2} maxLength={2000} value={commentDrafts[post.id] || ""}
                              onChange={event => setCommentDrafts(previous => ({ ...previous, [post.id]: event.target.value }))}
                              placeholder="Write a comment..." aria-label="Write a comment"
                              className="min-h-12 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400" />
                            <button type="submit" disabled={!me || !commentDrafts[post.id]?.trim() || engagementBusy === post.id}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-40">
                              {engagementBusy === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Comment
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </article>;
              })}
            </div>
          ) : (
            <section className="flex min-h-[270px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="rounded-2xl bg-violet-50 p-4 text-violet-700">{professional ? <Sparkles className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}</div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{professional ? "Your professional feed starts here" : "Your personal feed starts here"}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{professional ? (isEmployer ? "No professional posts yet." : "No professional posts yet. Share the first update.") : "No personal posts from you or people who have granted you access yet."}</p>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Quick Navigation</h2>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3"><Search className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Find your network</p><p className="text-xs text-slate-500">People and organization profiles</p><Link href="/social/network" className="mt-1 inline-block text-xs font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-900">Visit Network</Link></div></div>
              <div className="flex gap-3"><BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Jobs and hiring</p><p className="text-xs text-slate-500">Opportunities across the ecosystem</p><Link href="/social/jobs" className="mt-1 inline-block text-xs font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-900">View Jobs</Link></div></div>
              <div className="flex gap-3"><GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Aether Academy</p><p className="text-xs text-slate-500">Learn and grow with Aether</p><Link href="/aether-academy" className="mt-1 inline-block text-xs font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-900">Visit Academy</Link></div></div>
            </div>
          </section>
          <Link href="https://aetheros.pro/political-public" aria-label="Explore Aether Political" className="group block rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm transition hover:border-violet-500 hover:bg-violet-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden" aria-hidden="true">
                <img src="/aether-logo-full.png" alt="" className="absolute left-1/2 top-1/2 h-[170%] w-[170%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Aether Political</h3>
                <p className="mt-1 text-xs leading-5 text-slate-200">Run your campaign with clarity. Bring your team, data, and execution together.</p>
              </div>
            </div>
          </Link>
          <Link href="https://aetheros.pro/business-public" aria-label="Explore Aether Business" className="group block rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm transition hover:border-violet-500 hover:bg-violet-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden" aria-hidden="true">
                <img src="/aether-logo-full.png" alt="" className="absolute left-1/2 top-1/2 h-[170%] w-[170%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Aether Business</h3>
                <p className="mt-1 text-xs leading-5 text-slate-200">Keep your operations connected. Turn daily priorities into focused execution.</p>
              </div>
            </div>
          </Link>
          <Link href="https://aetheros.pro/login-social/employer-login" aria-label="Explore Aether Social" className="group block rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm transition hover:border-violet-500 hover:bg-violet-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden" aria-hidden="true">
                <img src="/aether-logo-full.png" alt="" className="absolute left-1/2 top-1/2 h-[170%] w-[170%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Aether Social</h3>
                <p className="mt-1 text-xs leading-5 text-slate-200">Hiring? Reach professionals with Aether. Post and manage jobs in one place.</p>
              </div>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
