"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Search,
  RefreshCw,
  SlidersHorizontal,
  GraduationCap,
} from "lucide-react";

type Employer = { id: string; name: string; location: string | null; description: string | null };
type Job = {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  category: string | null;
  location: string | null;
  work_arrangement: string | null;
  employment_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string | null;
  application_url: string | null;
  application_email: string | null;
  published_at: string | null;
};

const arrangementLabels: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };
const typeLabels: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", temporary: "Temporary", internship: "Internship",
};
const periodLabels: Record<string, string> = { hour: "hour", year: "year", month: "month", week: "week", contract: "contract" };

function salaryText(job: Job) {
  if (job.salary_min == null && job.salary_max == null) return null;
  const currency = job.salary_currency || "USD";
  const fmt = (amount: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(amount);
  const range = job.salary_min != null && job.salary_max != null
    ? `${fmt(job.salary_min)}–${fmt(job.salary_max)}`
    : job.salary_min != null ? `From ${fmt(job.salary_min)}` : `Up to ${fmt(job.salary_max!)}`;
  return `${range}${job.salary_period ? ` / ${periodLabels[job.salary_period] ?? job.salary_period}` : ""}`;
}

function safeApplicationUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

export default function SocialJobsPage() {
  const [supabase] = useState(() => createClient());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employers, setEmployers] = useState<Record<string, Employer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [arrangement, setArrangement] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestedJobId, setRequestedJobId] = useState<string | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("job");
    if (requested && /^[0-9a-f-]{36}$/i.test(requested)) setRequestedJobId(requested);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const now = new Date().toISOString();
    const { data, error: jobsError } = await supabase.from("social_job_listings")
      .select("id, employer_id, title, description, category, location, work_arrangement, employment_type, experience_level, salary_min, salary_max, salary_currency, salary_period, application_url, application_email, published_at")
      .eq("status", "published")
      .lte("published_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("published_at", { ascending: false })
      .limit(200);

    if (jobsError) {
      setError(jobsError.message);
      setLoading(false);
      return;
    }

    const records = (data ?? []) as Job[];
    const ids = [...new Set(records.map((job) => job.employer_id))];
    if (ids.length) {
      const { data: employerData, error: employerError } = await supabase.from("social_job_employers")
        .select("id, name, location, description")
        .in("id", ids)
        .eq("status", "active");
      if (employerError) {
        setError(employerError.message);
        setLoading(false);
        return;
      }
      const employerMap: Record<string, Employer> = {};
      for (const employer of (employerData ?? []) as Employer[]) employerMap[employer.id] = employer;
      setEmployers(employerMap);
      setJobs(records.filter((job) => Boolean(employerMap[job.employer_id])));
    } else {
      setEmployers({});
      setJobs([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (loading || !requestedJobId) return;
    if (jobs.some((job) => job.id === requestedJobId)) {
      setQuery("");
      setArrangement("all");
      setEmploymentType("all");
      setSelectedId(requestedJobId);
    }
    setRequestedJobId(null);
  }, [loading, jobs, requestedJobId]);

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const employer = employers[job.employer_id];
    const haystack = [job.title, job.description, job.category, job.location, employer?.name].join(" ").toLowerCase();
    return haystack.includes(query.trim().toLowerCase())
      && (arrangement === "all" || job.work_arrangement === arrangement)
      && (employmentType === "all" || job.employment_type === employmentType);
  }), [jobs, employers, query, arrangement, employmentType]);

  const selectedJob = filteredJobs.find((job) => job.id === selectedId) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6 bg-gradient-to-r from-[#17132e] via-[#23214d] to-[#172c49] px-6 py-6 sm:px-8 sm:py-7">
          <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-100/80">Aether Social</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            <BriefcaseBusiness className="h-9 w-9" /> Jobs
          </h1>
          <p className="mt-2 text-sm text-violet-100">Explore opportunities across businesses, campaigns, and beyond.</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-sm font-medium text-violet-100">Expand your knowledge. Build your future.</p>
            <a
              href="/aether-academy"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#17132e] transition hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <GraduationCap className="h-4 w-4" /> Explore Aether Academy
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <SlidersHorizontal className="h-4 w-4 text-violet-600" /> Find your next opportunity
          </div>
          <button type="button" onClick={() => void loadJobs()} disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh jobs
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative block">
            <span className="sr-only">Search jobs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Job title, company, or location"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
          </label>
          <label>
            <span className="sr-only">Work arrangement</span>
            <select value={arrangement} onChange={(event) => setArrangement(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400">
              <option value="all">All locations</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Employment type</span>
            <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400">
              <option value="all">All job types</option>
              {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <section className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading opportunities…
        </section>
      ) : error ? (
        <section role="alert" className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
          Could not load jobs: {error}
        </section>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <section className="space-y-3" aria-label="Job listings">
            <p className="px-1 text-sm font-semibold text-slate-600">
              {filteredJobs.length} {filteredJobs.length === 1 ? "opportunity" : "opportunities"}
            </p>
            {filteredJobs.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <BriefcaseBusiness className="mx-auto h-9 w-9 text-violet-500" />
                <h2 className="mt-4 text-lg font-bold text-slate-950">{jobs.length ? "No matching jobs" : "No jobs posted yet"}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {jobs.length ? "Try another search or adjust your filters." : "When employers publish opportunities, they’ll appear here."}
                </p>
              </div>
            ) : filteredJobs.map((job) => {
              const employer = employers[job.employer_id];
              return (
                <button type="button" key={job.id} onClick={() => { setSelectedId(job.id); window.history.replaceState(window.history.state, "", `/social/jobs?job=${encodeURIComponent(job.id)}`); }}
                  aria-pressed={selectedJob?.id === job.id}
                  className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md ${selectedJob?.id === job.id ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-violet-50 p-3 text-violet-700"><Building2 className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-slate-950">{job.title}</h2>
                      <p className="mt-1 text-sm text-slate-600">{employer?.name}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    {job.location && <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{job.location}</span>}
                    {job.work_arrangement && <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{arrangementLabels[job.work_arrangement] ?? job.work_arrangement}</span>}
                    {job.employment_type && <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">{typeLabels[job.employment_type] ?? job.employment_type}</span>}
                  </div>
                  {salaryText(job) && <p className="mt-3 text-sm font-semibold text-slate-800">{salaryText(job)}</p>}
                  <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">{job.description}</p>
                  <p className="mt-3 text-xs font-semibold text-violet-700">View details →</p>
                </button>
              );
            })}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-6" aria-label="Job details">
            {selectedJob ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Job details</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{selectedJob.title}</h2>
                <p className="mt-2 font-semibold text-slate-700">{employers[selectedJob.employer_id]?.name}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {(selectedJob.location || employers[selectedJob.employer_id]?.location) && (
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{selectedJob.location || employers[selectedJob.employer_id]?.location}</p>
                  )}
                  {selectedJob.work_arrangement && <p>{arrangementLabels[selectedJob.work_arrangement] ?? selectedJob.work_arrangement}</p>}
                  {selectedJob.employment_type && <p>{typeLabels[selectedJob.employment_type] ?? selectedJob.employment_type}</p>}
                  {selectedJob.experience_level && <p>Experience: {selectedJob.experience_level}</p>}
                  {salaryText(selectedJob) && <p className="font-semibold text-slate-900">{salaryText(selectedJob)}</p>}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {safeApplicationUrl(selectedJob.application_url) && (
                    <a href={safeApplicationUrl(selectedJob.application_url)!} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800">
                      Apply on website <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {selectedJob.application_email && (
                    <a href={`mailto:${selectedJob.application_email}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50">
                      Apply by email <Mail className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="font-bold text-slate-950">About the role</h3>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{selectedJob.description}</p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <BriefcaseBusiness className="h-9 w-9 text-violet-500" />
                <h2 className="mt-4 font-bold text-slate-950">Explore job details</h2>
                <p className="mt-2 text-sm text-slate-500">Select a listing to learn more and find out how to apply.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
