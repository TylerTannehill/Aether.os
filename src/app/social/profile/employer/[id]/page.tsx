'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, BriefcaseBusiness, Building2, ExternalLink, Globe, Loader2, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Employer = {
  id: string
  name: string
  employer_type: string | null
  description: string | null
  website_url: string | null
  location: string | null
  logo_path: string | null
  status: string
}
type Job = { id: string; title: string; location: string | null; status: string }

export default function PublicEmployerProfilePage() {
  const params = useParams()
  const employerId = typeof params.id === 'string' ? params.id : ''
  const [supabase] = useState(() => createClient())
  const [employer, setEmployer] = useState<Employer | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      setEmployer(null)
      setJobs([])
      try {
        if (!/^[0-9a-f-]{36}$/i.test(employerId)) throw new Error('Employer profile not found.')
        const { data: details, error: detailsError } = await supabase
          .from('social_job_employers')
          .select('id, name, employer_type, description, website_url, location, logo_path, status')
          .eq('id', employerId)
          .eq('status', 'active')
          .maybeSingle()
        if (detailsError) throw new Error(detailsError.message)
        if (!details) throw new Error('Employer profile not found.')

        const now = new Date().toISOString()
        const { data: listings, error: jobsError } = await supabase
          .from('social_job_listings')
          .select('id, title, location, status')
          .eq('employer_id', employerId)
          .eq('status', 'published')
          .lte('published_at', now)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('published_at', { ascending: false })
        if (jobsError) throw new Error(jobsError.message)
        if (!active) return
        setEmployer(details as Employer)
        setJobs((listings ?? []) as Job[])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load employer profile.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [employerId, supabase])

  const logoUrl = employer?.logo_path
    ? supabase.storage.from('social-employer-avatars').getPublicUrl(employer.logo_path).data.publicUrl
    : null
  const website = (() => {
    if (!employer?.website_url) return null
    try {
      const url = new URL(employer.website_url)
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
    } catch { return null }
  })()

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-12 pt-5 sm:px-6">
      <Link href="/social/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      {loading && <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading employer profile...</div>}
      {!loading && error && <div role="alert" className="rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-700">{error}</div>}

      {!loading && employer && (
        <>
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] text-slate-100 shadow-lg">
            <div className="h-24 bg-gradient-to-r from-violet-900/80 via-indigo-800/50 to-slate-900 sm:h-32" />
            <div className="px-5 pb-6 sm:px-7">
              <div className="-mt-11 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#101b30] bg-[#263451] text-violet-200">
                {logoUrl ? <img src={logoUrl} alt={`${employer.name} logo`} className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10" />}
              </div>
              <h1 className="mt-3 text-2xl font-bold text-white">{employer.name}</h1>
              <p className="mt-1 text-sm capitalize text-slate-400">{employer.employer_type?.replaceAll('_', ' ') || 'Organization'}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                {employer.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-300" />{employer.location}</span>}
                {website && <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-violet-300 hover:text-violet-200"><Globe className="h-4 w-4" />Website <ExternalLink className="h-3 w-3" /></a>}
              </div>
              <div className="mt-6 border-t border-white/10 pt-5">
                <h2 className="text-base font-bold text-white">About Us</h2>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{employer.description || 'This organization has not added a description yet.'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#101b30] p-5 text-slate-100">
            <h2 className="mb-4 font-bold">Open Positions <span className="text-sm font-normal text-slate-400">({jobs.length})</span></h2>
            {jobs.length === 0 ? <p className="text-sm text-slate-400">No open positions currently listed.</p> : (
              <div className="divide-y divide-white/10">
                {jobs.map(job => (
                  <article key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      {job.location && <p className="mt-1 text-xs text-slate-400">{job.location}</p>}
                    </div>
                    <Link href={`/social/jobs?job=${encodeURIComponent(job.id)}`} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500">
                      <BriefcaseBusiness className="h-4 w-4" /> View Job
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
