'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowDown, ArrowLeft, Loader2, ShieldCheck, UserRound } from 'lucide-react'

type Profile = { id: string; display_name: string | null; username: string | null; bio: string | null; avatar_path: string | null }
type Experience = { id: string; company_name: string; job_title: string; employment_type: string | null; location: string | null; location_type: string | null; start_date: string; end_date: string | null; is_current: boolean; description: string | null }
type Education = { id: string; entry_type: 'high_school' | 'college' | 'certification'; institution_name: string; degree: string | null; field_of_study: string | null; issuing_organization: string | null; start_date: string | null; end_date: string | null; issue_date: string | null; expiration_date: string | null; credential_url: string | null; description: string | null; display_order: number }

function monthLabel(value: string | null) {
  if (!value) return 'Present'
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function MemberProfessionalDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experience, setExperience] = useState<Experience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [experienceError, setExperienceError] = useState('')
  const [educationError, setEducationError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setProfile(null)
      setExperience([])
      setEducation([])
      setError('')
      setExperienceError('')
      setEducationError('')
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        setError('This profile link is invalid.')
        setLoading(false)
        return
      }
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError || !auth.user) {
        window.location.replace('/login-social')
        return
      }
      const profileResult = await supabase.from('social_profiles')
        .select('id, display_name, username, bio, avatar_path')
        .eq('id', id).maybeSingle()
      if (!active) return
      if (profileResult.error || !profileResult.data) {
        setError(profileResult.error?.message || 'This Social profile is unavailable.')
        setLoading(false)
        return
      }
      setProfile(profileResult.data as Profile)
      const [experienceResult, educationResult] = await Promise.all([
        supabase.from('social_professional_experience')
          .select('id, company_name, job_title, employment_type, location, location_type, start_date, end_date, is_current, description')
          .eq('profile_id', id).order('is_current', { ascending: false }).order('start_date', { ascending: false }),
        supabase.from('social_professional_education')
          .select('id, entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
          .eq('profile_id', id).order('display_order', { ascending: true }),
      ])
      if (!active) return
      if (experienceResult.error) setExperienceError('Experience could not be loaded: ' + experienceResult.error.message)
      else setExperience((experienceResult.data ?? []) as Experience[])
      if (educationResult.error) setEducationError('Education could not be loaded: ' + educationResult.error.message)
      else setEducation(((educationResult.data ?? []) as Education[]).sort((a, b) => {
        const aDate = a.entry_type === 'certification' ? a.issue_date : a.start_date
        const bDate = b.entry_type === 'certification' ? b.issue_date : b.start_date
        if (!aDate && !bDate) return a.display_order - b.display_order
        if (!aDate) return 1
        if (!bDate) return -1
        return bDate.localeCompare(aDate) || a.display_order - b.display_order
      }))
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [id, supabase])

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('social-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-4 text-slate-100 sm:px-6">
      <Link href={`/social/profile/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      <section aria-labelledby="professional-hero-title" className="mb-5 rounded-2xl border border-white/10 bg-[#101b30] px-5 py-7 shadow-lg sm:px-8 sm:py-9">
        <div className="grid items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)_150px]">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400/50 bg-[#263451] text-violet-200">
              {avatarUrl ? <img src={avatarUrl} alt={`${profile?.display_name || 'Member'}'s professional profile picture`} className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10" />}
            </div>
          </div>
          <div className="text-center">
            <h1 id="professional-hero-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{profile?.display_name || 'Professional Profile'}</h1>
            {profile?.username && <p className="mt-2 text-sm text-violet-300">@{profile.username}</p>}
            <nav aria-label="Jump to professional profile sections" className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {([['About', 'about'], ['Experience', 'experience'], ['Education', 'education']] as const).map(([title, section]) => (
                <a key={section} href={`#${section}`} className="inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-400/60 hover:bg-violet-500/20">
                  {title} <ArrowDown className="h-3.5 w-3.5" />
                </a>
              ))}
            </nav>
          </div>
          <div className="hidden sm:block" aria-hidden="true" />
        </div>
      </section>
      {loading ? <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        : error ? <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>
        : profile && <div className="space-y-4">
          <section id="about" className="scroll-mt-24 rounded-xl border border-white/10 bg-[#101b30] p-4 sm:p-5">
            <h2 className="mb-3 text-base font-bold">About</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{profile.bio || 'No professional bio added yet.'}</p>
            <div className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{profile.display_name || 'No display name yet'}</span><span className="mx-2">·</span>
              <span>{profile.username ? `@${profile.username}` : 'No username yet'}</span>
            </div>
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100"><ShieldCheck className="h-4 w-4 text-violet-300" /> Aether Verified</h3>
              <p className="mt-1 text-xs text-slate-400">Political and Business experience verification is coming later.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(['Political', 'Business'] as const).map(category => <div key={category} className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
                  <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-xs text-slate-400">—</span><span className="text-sm font-semibold">{category} Experience</span></div>
                  <p className="mt-2 text-xs text-slate-400">Role: Not yet connected</p><p className="mt-1 text-xs text-slate-400">Time: Not yet available</p>
                </div>)}
              </div>
            </div>
          </section>
          <section id="experience" className="scroll-mt-24 rounded-xl border border-white/10 bg-[#101b30] p-4 sm:p-5">
            <h2 className="mb-4 font-bold">Experience <span className="text-sm font-normal text-slate-400">({experience.length})</span></h2>
            {experienceError ? <p role="alert" className="text-sm text-rose-300">{experienceError}</p> : experience.length === 0 ? <p className="text-sm text-slate-300">No experience added yet.</p>
              : <div className="divide-y divide-white/10">{experience.map(item => <article id={`experience-${item.id}`} key={item.id} className="py-4 first:pt-0 last:pb-0">
                <h3 className="font-semibold">{item.job_title}</h3>
                <p className="text-sm text-slate-300">{item.company_name}{item.employment_type ? ` · ${item.employment_type}` : ''}</p>
                <p className="mt-1 text-xs text-slate-400">{monthLabel(item.start_date)} – {item.is_current ? 'Present' : monthLabel(item.end_date)}{item.location ? ` · ${item.location}` : ''}{item.location_type ? ` · ${item.location_type}` : ''}</p>
                {item.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{item.description}</p>}
              </article>)}</div>}
          </section>
          <section id="education" className="scroll-mt-24 rounded-xl border border-white/10 bg-[#101b30] p-4 sm:p-5">
            <h2 className="mb-4 font-bold">Education &amp; Certifications <span className="text-sm font-normal text-slate-400">({education.length})</span></h2>
            {educationError ? <p role="alert" className="text-sm text-rose-300">{educationError}</p> : education.length === 0 ? <p className="text-sm text-slate-300">No education or certifications added.</p>
              : <div className="divide-y divide-white/10">{education.map(item => <article key={item.id} className="py-4 first:pt-0 last:pb-0">
                <p className="mb-1 text-xs font-semibold text-violet-300">{item.entry_type === 'high_school' ? 'High School' : item.entry_type === 'college' ? 'College / University' : 'Certification'}</p>
                <h3 className="break-words font-semibold">{item.institution_name}</h3>
                {item.entry_type === 'college' && (item.degree || item.field_of_study) && <p className="mt-1 text-sm text-slate-300">{[item.degree, item.field_of_study].filter(Boolean).join(' · ')}</p>}
                {item.entry_type === 'certification' && item.issuing_organization && <p className="mt-1 text-sm text-slate-300">{item.issuing_organization}</p>}
                {item.entry_type === 'certification' ? (item.issue_date || item.expiration_date) && <p className="mt-1 text-xs text-slate-400">{item.issue_date ? `Issued ${monthLabel(item.issue_date)}` : ''}{item.expiration_date ? ` · Expires ${monthLabel(item.expiration_date)}` : ''}</p>
                  : (item.start_date || item.end_date) && <p className="mt-1 text-xs text-slate-400">{[item.start_date ? monthLabel(item.start_date) : null, item.end_date ? monthLabel(item.end_date) : null].filter(Boolean).join(' – ')}</p>}
                {item.credential_url && /^https?:\/\//i.test(item.credential_url) && <a href={item.credential_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-xs font-semibold text-violet-300 hover:underline">View credential ↗</a>}
                {item.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{item.description}</p>}
              </article>)}</div>}
          </section>
          <p className="text-xs text-slate-500">Professional experience and education are visible to signed-in Social members.</p>
        </div>}
    </main>
  )
}
