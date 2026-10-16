'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { Building2, BriefcaseBusiness, ExternalLink, Globe, Loader2, MapPin, Pencil, X, Check, Camera, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type EmployerContext = {
  employer: { id: string; name: string; employer_type: string | null; status: string }
  plan: 'needle' | 'haystack'
}
type EmployerDetails = {
  id: string
  name: string
  description: string | null
  website_url: string | null
  location: string | null
  logo_path: string | null
}
type Job = { id: string; title: string; location: string | null; status: string }
type EditFields = { name: string; description: string; website_url: string; location: string }

export default function EmployerProfilePage() {
  const [supabase] = useState(() => createClient())
  const [context, setContext] = useState<EmployerContext | null>(null)
  const [employer, setEmployer] = useState<EmployerDetails | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [saveError, setSaveError] = useState('')
  const [fields, setFields] = useState<EditFields>({ name: '', description: '', website_url: '', location: '' })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch('/api/social/employer-context', { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load employer context.')
        const resolved = result as EmployerContext
        const { data: details, error: detailsError } = await supabase
          .from('social_job_employers')
          .select('id, name, description, website_url, location, logo_path')
          .eq('id', resolved.employer.id)
          .single()
        if (detailsError) throw new Error(detailsError.message)
        const { data: listings, error: jobsError } = await supabase
          .from('social_job_listings')
          .select('id, title, location, status')
          .eq('employer_id', resolved.employer.id)
          .eq('status', 'published')
        if (jobsError) throw new Error(jobsError.message)
        if (!active) return
        setContext(resolved)
        setEmployer(details as EmployerDetails)
        setJobs((listings ?? []) as Job[])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load employer profile.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [supabase])

  function beginEdit() {
    if (!employer) return
    setFields({
      name: employer.name,
      description: employer.description ?? '',
      website_url: employer.website_url ?? '',
      location: employer.location ?? '',
    })
    setSaveError('')
    setEditing(true)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!employer || saving) return
    const name = fields.name.trim()
    const description = fields.description.trim()
    const location = fields.location.trim()
    const website_url = fields.website_url.trim()
    if (!name) { setSaveError('Organization name is required.'); return }
    if (website_url) {
      try {
        const url = new URL(website_url)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol')
      } catch { setSaveError('Website must be a valid http:// or https:// URL.'); return }
    }
    setSaving(true)
    setSaveError('')
    try {
      // This endpoint must verify employer context on the server before writing.
      const response = await fetch('/api/social/employer-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null, location: location || null, website_url: website_url || null }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Unable to save employer profile.')
      setEmployer(previous => previous ? {
        ...previous,
        name: result.employer?.name ?? name,
        description: result.employer?.description ?? (description || null),
        location: result.employer?.location ?? (location || null),
        website_url: result.employer?.website_url ?? (website_url || null),
      } : previous)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save employer profile.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !employer || photoBusy) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be smaller than 5 MB.')
      return
    }
    setPhotoBusy(true)
    setPhotoError('')
    try {
      const form = new FormData()
      form.append('photo', file)
      const response = await fetch('/api/social/employer-profile', { method: 'POST', body: form })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Unable to upload employer photo.')
      if (typeof result.logo_path !== 'string') throw new Error('Upload completed without a photo path.')
      setEmployer(previous => previous ? { ...previous, logo_path: result.logo_path } : previous)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to upload employer photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function removePhoto() {
    if (!employer?.logo_path || photoBusy) return
    setPhotoBusy(true)
    setPhotoError('')
    try {
      const response = await fetch('/api/social/employer-profile', { method: 'DELETE' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Unable to remove employer photo.')
      setEmployer(previous => previous ? { ...previous, logo_path: null } : previous)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to remove employer photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const logoUrl = employer?.logo_path
    ? supabase.storage.from('social-employer-avatars').getPublicUrl(employer.logo_path).data.publicUrl
    : null
  const inputClass = 'w-full rounded-lg border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-violet-400'
  const labelClass = 'mb-1 block text-xs font-semibold text-slate-300'

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-12 pt-5 text-slate-100 sm:px-6">
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

      {loading && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading your employer profile...</div>}
      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-200">{error}</p>}

      {!loading && employer && context && <>
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-lg">
          <div className="h-24 bg-gradient-to-r from-violet-900/80 via-indigo-800/50 to-slate-900 sm:h-32" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-11 flex flex-wrap items-end justify-between gap-4">
              <div className="relative h-24 w-24 shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#101b30] bg-[#263451] text-violet-200">
                  {logoUrl ? <img src={logoUrl} alt={`${employer.name} logo`} className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10" />}
                </div>
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}
                  aria-label={logoUrl ? 'Replace company photo' : 'Upload company photo'} title={logoUrl ? 'Replace company photo' : 'Upload company photo'}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#101b30] bg-violet-600 text-white shadow-lg hover:bg-violet-500 disabled:opacity-60">
                  {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="sr-only" aria-label="Company photo file" />
              </div>
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold capitalize text-violet-200">{context.plan} employer</span>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">{employer.name}</h2>
                <p className="mt-1 text-sm capitalize text-slate-400">{context.employer.employer_type?.replaceAll('_', ' ') || 'Organization'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/social/jobs/employers" className="inline-flex items-center gap-2 rounded-lg border border-violet-400/40 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/15"><BriefcaseBusiness className="h-3.5 w-3.5" /> Manage Jobs</Link>
                {!editing && <button type="button" onClick={beginEdit} className="inline-flex items-center gap-2 rounded-lg border border-violet-400/40 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/15"><Pencil className="h-3.5 w-3.5" /> Edit Profile</button>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Company photo · JPEG, PNG or WebP · Max 5 MB</span>
              {employer.logo_path && <button type="button" onClick={removePhoto} disabled={photoBusy} className="inline-flex items-center gap-1 font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Remove photo</button>}
            </div>
            {photoError && <p role="alert" className="mt-2 text-sm text-rose-300">{photoError}</p>}
            {!editing && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              {employer.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-300" />{employer.location}</span>}
              {employer.website_url && /^https?:\/\//i.test(employer.website_url) && <a href={employer.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-violet-300 hover:text-violet-200"><Globe className="h-4 w-4" />Website <ExternalLink className="h-3 w-3" /></a>}
            </div>}
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-base font-bold text-white">About Us</h3>
              {editing ? <form onSubmit={saveProfile} className="mt-4 space-y-4">
                <div><label htmlFor="employer-name" className={labelClass}>Organization name *</label><input id="employer-name" required maxLength={160} className={inputClass} value={fields.name} onChange={e => setFields(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="employer-location" className={labelClass}>Location</label><input id="employer-location" maxLength={160} className={inputClass} value={fields.location} onChange={e => setFields(f => ({ ...f, location: e.target.value }))} placeholder="City, State" /></div>
                  <div><label htmlFor="employer-website" className={labelClass}>Website</label><input id="employer-website" type="url" maxLength={2000} className={inputClass} value={fields.website_url} onChange={e => setFields(f => ({ ...f, website_url: e.target.value }))} placeholder="https://example.com" /></div>
                </div>
                <div><label htmlFor="employer-about" className={labelClass}>About your organization</label><textarea id="employer-about" rows={5} maxLength={4000} className={inputClass} value={fields.description} onChange={e => setFields(f => ({ ...f, description: e.target.value }))} placeholder="Tell people about your organization..." /></div>
                {saveError && <p role="alert" className="text-sm text-rose-300">{saveError}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" disabled={saving} onClick={() => { setEditing(false); setSaveError('') }} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"><X className="h-4 w-4" />Cancel</button>
                </div>
              </form> : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{employer.description || 'Your organization has not added a description yet.'}</p>}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#101b30] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Open Positions <span className="text-sm font-normal text-slate-400">({jobs.length})</span></h2><Link href="/social/jobs/employers" className="text-xs font-semibold text-violet-300 hover:underline">Manage listings</Link></div>
          {jobs.length === 0 ? <p className="text-sm text-slate-400">No published positions yet.</p> : <div className="divide-y divide-white/10">{jobs.map(job => <article key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><h3 className="font-semibold">{job.title}</h3>{job.location && <p className="mt-1 text-xs text-slate-400">{job.location}</p>}</div><Link href={`/social/jobs?job=${encodeURIComponent(job.id)}`} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"><BriefcaseBusiness className="h-4 w-4" />View Job</Link></article>)}</div>}
        </section>
      </>}
    </main>
  )
}
