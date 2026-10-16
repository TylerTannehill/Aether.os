"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Building2, Loader2, Plus, RefreshCw, Save, Send, X } from "lucide-react";

type Employer = { id: string; name: string; employer_type: string; status: string };
type EmployerPlan = { plan_code?: string; slug?: string; plan?: string; code?: string } | string | null;
type Listing = {
  id: string; employer_id: string; title: string; description: string;
  category: string | null; location: string | null; work_arrangement: string | null;
  employment_type: string | null; experience_level: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string;
  salary_period: string | null; application_url: string | null; application_email: string | null;
  status: string; published_at: string | null; updated_at: string;
};
type FormData = {
  title: string; description: string; category: string; location: string;
  work_arrangement: string; employment_type: string; experience_level: string;
  salary_min: string; salary_max: string; salary_period: string;
  application_url: string; application_email: string;
};
const blank: FormData = {
  title: "", description: "", category: "", location: "", work_arrangement: "",
  employment_type: "", experience_level: "", salary_min: "", salary_max: "",
  salary_period: "", application_url: "", application_email: ""
};
const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
const labelClass = "block space-y-1.5 text-sm font-semibold text-slate-700";
const clean = (v: string) => v.trim() || null;
function formFromJob(j: Listing): FormData {
  return {
    title: j.title, description: j.description, category: j.category ?? "",
    location: j.location ?? "", work_arrangement: j.work_arrangement ?? "",
    employment_type: j.employment_type ?? "", experience_level: j.experience_level ?? "",
    salary_min: j.salary_min == null ? "" : String(j.salary_min),
    salary_max: j.salary_max == null ? "" : String(j.salary_max),
    salary_period: j.salary_period ?? "", application_url: j.application_url ?? "",
    application_email: j.application_email ?? ""
  };
}

export default function SocialJobsEmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [employerId, setEmployerId] = useState("");
  const [plan, setPlan] = useState<EmployerPlan>(null);
  const [promotedJobIds, setPromotedJobIds] = useState<string[]>([]);
  const [promotionStatusReady, setPromotionStatusReady] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [individualPreview, setIndividualPreview] = useState(false);
  const [form, setForm] = useState<FormData>({ ...blank });

  const load = useCallback(async () => {
    setLoading(true); setError(""); setIndividualPreview(false);
    try {
      // Employer identity is resolved by the authenticated server endpoint.
      // Do not rediscover organization membership through browser-side queries.
      const response = await fetch("/api/social/employer-context", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const result: { employer?: Employer; plan?: EmployerPlan; error?: string } = await response.json();
      if (!response.ok || !result.employer) {
        // Individual sessions have no selected employer organization.
        // Preview only the static management layout, never employer data.
        if (response.status === 403 && result.error === "No active employer organization selected") {
          setEmployers([]);
          setEmployerId("");
          setListings([]);
          setIndividualPreview(true);
          return;
        }
        throw new Error(result.error || "Could not load employer access.");
      }
      setIndividualPreview(false);
      setEmployers([result.employer]);
      setEmployerId(result.employer.id);
      setPlan(result.plan ?? null);
    } catch (e) {
      setEmployers([]);
      setEmployerId("");
      setPlan(null);
      setListings([]);
      setError(e instanceof Error ? e.message : "Could not load employer access.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadListings = useCallback(async () => {
    if (!employerId) { setListings([]); setPromotedJobIds([]); setPromotionStatusReady(false); return; }
    try {
      const response = await fetch("/api/social/employer-jobs", {
        method: "GET", credentials: "same-origin", cache: "no-store",
      });
      const result: { listings?: Listing[]; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load job listings.");
      setListings(result.listings ?? []);
      // The publishing endpoint supplies the authoritative already-promoted IDs.
      setPromotionStatusReady(false);
      try {
        const promoResponse = await fetch("/api/social/employer-jobs?promotions=1", { method: "GET", credentials: "same-origin", cache: "no-store" });
        if (promoResponse.ok) {
          const promoResult: { promoted_job_ids?: string[] } = await promoResponse.json();
          setPromotedJobIds(promoResult.promoted_job_ids ?? []);
          setPromotionStatusReady(true);
        }
      } catch { /* Keep promotions disabled until the endpoint is available. */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load job listings.");
    }
  }, [employerId]);
  useEffect(() => { void loadListings(); }, [loadListings]);

  function startNew() { setEditingId(null); setForm({ ...blank }); setFormOpen(true); setError(""); setNotice(""); }
  function startEdit(job: Listing) { setEditingId(job.id); setForm(formFromJob(job)); setFormOpen(true); setError(""); setNotice(""); }
  function field(key: keyof FormData, value: string) { setForm(old => ({ ...old, [key]: value })); }

  async function save(publish: boolean) {
    if (!employerId || working) return;
    setError(""); setNotice("");
    if (!form.title.trim() || !form.description.trim()) { setError("A job title and description are required."); return; }
    if (publish && !form.application_url.trim() && !form.application_email.trim()) {
      setError("Add an application website or email before publishing."); return;
    }
    if (form.application_url.trim()) {
      try { const u = new URL(form.application_url.trim()); if (!["http:", "https:"].includes(u.protocol)) throw Error(); }
      catch { setError("Application website must be a valid http or https URL."); return; }
    }
    if (form.salary_min && (!Number.isFinite(Number(form.salary_min)) || Number(form.salary_min) < 0)) { setError("Enter a valid minimum salary."); return; }
    if (form.salary_max && (!Number.isFinite(Number(form.salary_max)) || Number(form.salary_max) < 0)) { setError("Enter a valid maximum salary."); return; }
    if (form.salary_min && form.salary_max && Number(form.salary_max) < Number(form.salary_min)) { setError("Maximum salary cannot be below minimum salary."); return; }
    const existing = listings.find(j => j.id === editingId);
    const status = publish ? "published" : (existing?.status === "published" ? "published" : "draft");
    const payload = {
      title: form.title.trim(), description: form.description.trim(), category: clean(form.category),
      location: clean(form.location), work_arrangement: clean(form.work_arrangement),
      employment_type: clean(form.employment_type), experience_level: clean(form.experience_level),
      salary_min: form.salary_min === "" ? null : Number(form.salary_min),
      salary_max: form.salary_max === "" ? null : Number(form.salary_max),
      salary_period: clean(form.salary_period), salary_currency: "USD",
      application_url: clean(form.application_url), application_email: clean(form.application_email),
      status, ...(publish && !existing?.published_at ? { published_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString()
    };
    setWorking(true);
    try {
      const response = await fetch("/api/social/employer-jobs", {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...(editingId ? { id: editingId } : {}) }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save job.");
      setFormOpen(false); setEditingId(null); setForm({ ...blank });
      setNotice(publish ? "Job submitted for publishing." : "Job saved.");
      await loadListings();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save job."); }
    finally { setWorking(false); }
  }

  async function changeStatus(job: Listing, status: "published" | "paused" | "closed") {
    if (working || !employerId) return;
    setWorking(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/social/employer-jobs", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, status }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update listing.");
      setNotice(`Listing ${status}.`);
      await loadListings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update listing.");
    }
    setWorking(false);
  }

  const currentPlan = typeof plan === "string" ? plan : (plan?.plan_code ?? plan?.slug ?? plan?.plan ?? plan?.code ?? "");
  const isHaystack = currentPlan.toLowerCase() === "haystack";

  async function promoteJob(job: Listing) {
    if (!isHaystack || !promotionStatusReady || job.status !== "published" || promotedJobIds.includes(job.id) || working || promotingId) return;
    setPromotingId(job.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/social/employer-jobs", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote_job", job_id: job.id }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not promote this job.");
      setPromotedJobIds(previous => previous.includes(job.id) ? previous : [...previous, job.id]);
      setNotice(`“${job.title}” was posted to the Professional feed.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not promote this job.");
    } finally { setPromotingId(null); }
  }

  const currentEmployer = employers.find(e => e.id === employerId);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12 text-slate-900">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#17132e] via-[#23214d] to-[#172c49] px-6 py-7 text-white shadow-xl sm:px-8">
        <Link href="/social/jobs" className="inline-flex items-center gap-2 text-xs font-semibold text-violet-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Jobs</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">Aether Social · Employers</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-black sm:text-4xl"><BriefcaseBusiness className="h-9 w-9" /> Manage Job Postings</h1>
            <p className="mt-2 text-sm text-violet-100">Create, publish, and manage opportunities for your organization.</p></div>
          {currentEmployer?.status === "active" && <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#20183c] hover:bg-violet-100"><Plus className="h-4 w-4" /> New job posting</button>}
        </div>
      </section>

      {loading ? <div className="flex items-center justify-center rounded-2xl bg-white p-12 text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking employer access…</div>
      : individualPreview ? (
        <div className="space-y-5">
          <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Employer workspace preview</p>
            <h2 className="mt-3 text-xl font-black text-slate-950">A look behind the scenes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Employers use this space to create and manage their job postings. You're viewing a read-only preview as an Individual; posting and management actions are unavailable.
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting as</p>
                <p className="font-bold text-slate-700">Employer accounts only</p>
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black">Job postings</h2>
            <div className="mt-5 rounded-2xl bg-slate-50 px-6 py-12 text-center">
              <BriefcaseBusiness className="mx-auto h-9 w-9 text-violet-500" />
              <h3 className="mt-3 font-bold">Employer management view</h3>
              <p className="mt-2 text-sm text-slate-500">Private employer listings and drafts aren't available in this preview.</p>
            </div>
          </section>
        </div>
      ) : employers.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-lg font-bold">No linked employer yet</h2><p className="mt-2 text-sm text-slate-600">Your active employer could not be loaded. See the error below, or sign in through the Social Employer login.</p></div>
      : <>
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-violet-600" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting as</p>
            {employers.length === 1 ? <p className="font-bold">{currentEmployer?.name}</p> : <select className={inputClass} value={employerId} onChange={e => { setEmployerId(e.target.value); setFormOpen(false); }}>{employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>}</div></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-700">{currentEmployer?.status ?? "Unknown"} employer</span>
        </section>
        {currentEmployer?.status !== "active" && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This employer record is not active, so posting is unavailable. Employer activation and access will be connected in the next phase.</div>}
        {currentEmployer?.status === "active" && <>
          {formOpen && <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-black">{editingId ? "Edit job posting" : "New job posting"}</h2><button type="button" onClick={() => setFormOpen(false)} aria-label="Close editor"><X className="h-5 w-5" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>Job title *<input className={inputClass} value={form.title} onChange={e => field("title", e.target.value)} placeholder="e.g. Operations Manager" /></label>
              <label className={labelClass}>Category<input className={inputClass} value={form.category} onChange={e => field("category", e.target.value)} placeholder="e.g. Operations" /></label>
              <label className={labelClass}>Location<input className={inputClass} value={form.location} onChange={e => field("location", e.target.value)} placeholder="City, state, or nationwide" /></label>
              <label className={labelClass}>Work arrangement<select className={inputClass} value={form.work_arrangement} onChange={e => field("work_arrangement", e.target.value)}><option value="">Not specified</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
              <label className={labelClass}>Employment type<select className={inputClass} value={form.employment_type} onChange={e => field("employment_type", e.target.value)}><option value="">Not specified</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option></select></label>
              <label className={labelClass}>Experience level<select className={inputClass} value={form.experience_level} onChange={e => field("experience_level", e.target.value)}><option value="">Not specified</option><option value="entry">Entry</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="executive">Executive</option></select></label>
              <label className={labelClass}>Minimum salary (USD)<input type="number" min="0" className={inputClass} value={form.salary_min} onChange={e => field("salary_min", e.target.value)} /></label>
              <label className={labelClass}>Maximum salary (USD)<input type="number" min="0" className={inputClass} value={form.salary_max} onChange={e => field("salary_max", e.target.value)} /></label>
              <label className={labelClass}>Salary period<select className={inputClass} value={form.salary_period} onChange={e => field("salary_period", e.target.value)}><option value="">Not specified</option><option value="hour">Per hour</option><option value="year">Per year</option><option value="month">Per month</option><option value="week">Per week</option><option value="contract">Per contract</option></select></label>
              <label className={labelClass}>Application website<input className={inputClass} value={form.application_url} onChange={e => field("application_url", e.target.value)} placeholder="https://…" /></label>
              <label className={labelClass}>Application email<input type="email" className={inputClass} value={form.application_email} onChange={e => field("application_email", e.target.value)} placeholder="hiring@example.com" /></label>
              <label className={`${labelClass} md:col-span-2`}>Job description *<textarea rows={8} className={inputClass} value={form.description} onChange={e => field("description", e.target.value)} placeholder="Describe the role, responsibilities, and qualifications…" /></label>
            </div>
            <p className="mt-3 text-xs text-slate-500">A website or email is required to publish, but not to save a draft.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button disabled={working} onClick={() => void save(false)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"><Save className="h-4 w-4" /> {editingId && listings.find(j => j.id === editingId)?.status === "published" ? "Save changes" : "Save draft"}</button>
              <button disabled={working} onClick={() => void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"><Send className="h-4 w-4" /> Publish job</button>
            </div>
          </section>}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Your job postings <span className="text-sm font-semibold text-slate-500">({listings.length})</span></h2><button onClick={() => void loadListings()} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-violet-700"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
            {listings.length === 0 ? <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center"><BriefcaseBusiness className="mx-auto h-9 w-9 text-violet-500" /><h3 className="mt-3 font-bold">No job postings yet</h3><p className="mt-2 text-sm text-slate-500">Create your first listing to get started.</p></div>
            : <div className="space-y-3">{listings.map(job => <article key={job.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{job.title}</h3><p className="mt-1 text-xs text-slate-500">{job.location || "Location not specified"} · Updated {new Date(job.updated_at).toLocaleDateString()}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold capitalize text-violet-700">{job.status}</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => startEdit(job)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">Edit</button>
                {["draft", "paused"].includes(job.status) && <button disabled={working} onClick={() => void changeStatus(job, "published")} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Publish</button>}
                {isHaystack && job.status === "published" && (promotedJobIds.includes(job.id)
                  ? <span className="inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">Posted in Feed</span>
                  : <button disabled={working || !!promotingId || !promotionStatusReady} onClick={() => void promoteJob(job)} title={!promotionStatusReady ? "Feed promotion service is not available yet" : undefined} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{promotingId === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Post in Feed</button>)}
                {job.status === "published" && <button disabled={working} onClick={() => void changeStatus(job, "paused")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-50">Pause</button>}
                {["published", "paused"].includes(job.status) && <button disabled={working} onClick={() => void changeStatus(job, "closed")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-50">Close</button>}
              </div>
            </article>)}</div>}
          </section>
        </>}
      </>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
    </div>
  );
}
