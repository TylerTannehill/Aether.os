import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store' }
const CACHE_MS = 2 * 60 * 60 * 1000
const MAX_JOBS = 200

type Job = {
  id: string
  employer_id: string
  title: string
  description: string
  category: string | null
  location: string | null
  work_arrangement: string | null
  employment_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  application_url: string | null
  application_email: string | null
  published_at: string | null
  expires_at: string | null
}

type Employer = {
  id: string
  name: string
  location: string | null
  description: string | null
}

type IndexedJob = Omit<Job, 'employer_id'> & {
  employer: Omit<Employer, 'id'>
  social_job_url: string
}

type CacheEntry = {
  jobs: IndexedJob[]
  refreshedAt: string
  expiresAt: number
}

// Best-effort process-local cache. Serverless instances may each have their own copy.
let cache: CacheEntry | null = null
let pendingLoad: Promise<CacheEntry> | null = null

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers })
}

function validApplicationUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

async function loadJobs(url: string, key: string): Promise<CacheEntry> {
  const admin = createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const now = new Date().toISOString()

  // Mirror Social's published, unexpired, newest-first, 200-job catalog.
  const { data: jobData, error: jobError } = await admin
    .from('social_job_listings')
    .select('id, employer_id, title, description, category, location, work_arrangement, employment_type, experience_level, salary_min, salary_max, salary_currency, salary_period, application_url, application_email, published_at, expires_at')
    .eq('status', 'published')
    .lte('published_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })
    .limit(MAX_JOBS)
  if (jobError) throw jobError

  const jobs = (jobData ?? []) as Job[]
  const employerIds = [...new Set(jobs.map(job => job.employer_id))]
  const employers = new Map<string, Employer>()

  if (employerIds.length) {
    const { data: employerData, error: employerError } = await admin
      .from('social_job_employers')
      .select('id, name, location, description')
      .in('id', employerIds)
      .eq('status', 'active')
    if (employerError) throw employerError
    for (const employer of (employerData ?? []) as Employer[]) {
      employers.set(employer.id, employer)
    }
  }

  const indexedJobs: IndexedJob[] = jobs.flatMap(job => {
    const employer = employers.get(job.employer_id)
    if (!employer) return []
    const { employer_id: _employerId, ...fields } = job
    return [{
      ...fields,
      application_url: validApplicationUrl(job.application_url),
      employer: {
        name: employer.name,
        location: employer.location,
        description: employer.description,
      },
      social_job_url: `/social/jobs?job=${encodeURIComponent(job.id)}`,
    }]
  })

  return {
    jobs: indexedJobs,
    refreshedAt: new Date().toISOString(),
    expiresAt: Date.now() + CACHE_MS,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return fail('Not authenticated', 401)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return fail('Social jobs service is not configured', 500)

    // Require an actual Personal profile, not merely a logged-in account.
    const admin = createAdminClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: personal, error: personalError } = await admin
      .from('personal_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (personalError) throw personalError
    if (!personal) return fail('Personal profile not found', 404)

    if (!cache || Date.now() >= cache.expiresAt) {
      if (!pendingLoad) {
        pendingLoad = loadJobs(url, key).finally(() => { pendingLoad = null })
      }
      cache = await pendingLoad
    }

    // An expiring job must never remain recommendable just because it is cached.
    const now = Date.now()
    const availableJobs = cache.jobs.filter(job =>
      (!job.published_at || new Date(job.published_at).getTime() <= now) &&
      (!job.expires_at || new Date(job.expires_at).getTime() > now)
    )

    return NextResponse.json({
      available: true,
      job_index: {
        total: availableJobs.length,
        jobs: availableJobs,
        refreshed_at: cache.refreshedAt,
      },
    }, { headers })
  } catch {
    return fail('Unable to load Social job index', 500)
  }
}
