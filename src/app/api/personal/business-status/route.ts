import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store' }
const STATUSES = ['active', 'busy', 'inactive', 'break', 'lunch', 'potato'] as const
type Status = (typeof STATUSES)[number]
const WINDOW_MS = 24 * 60 * 60 * 1000

type Connection = { membership_id: string }
type Membership = {
  id: string
  organization_id: string
  profile_status: string | null
  profile_status_changed_at: string | null
}
type Organization = { id: string; product_context: string | null }
type History = { organization_member_id: string; status: string; started_at: string; ended_at: string }

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers })
}

function durationInWindow(start: string, end: string, windowStart: number, now: number) {
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0
  return Math.max(0, Math.min(endMs, now) - Math.max(startMs, windowStart))
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return fail('Not authenticated', 401)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Personal connections are not configured')
    const admin = createAdminClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profile, error: profileError } = await admin
      .from('personal_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (!profile) return fail('Personal profile not found', 404)

    const { data: connections, error: connectionsError } = await admin
      .from('personal_connections')
      .select('membership_id')
      .eq('personal_profile_id', profile.id)
    if (connectionsError) throw connectionsError
    const membershipIds = [...new Set(((connections ?? []) as Connection[]).map(c => c.membership_id))]
    if (!membershipIds.length) return NextResponse.json({ window_hours: 24, memberships: [] }, { headers })

    const { data: members, error: memberError } = await admin
      .from('organization_members')
      .select('id, organization_id, profile_status, profile_status_changed_at')
      .in('id', membershipIds)
    if (memberError) throw memberError
    const memberships = (members ?? []) as Membership[]
    if (!memberships.length) return NextResponse.json({ window_hours: 24, memberships: [] }, { headers })

    const { data: orgs, error: orgError } = await admin
      .from('organizations')
      .select('id, product_context')
      .in('id', [...new Set(memberships.map(m => m.organization_id))])
    if (orgError) throw orgError
    const orgById = new Map(((orgs ?? []) as Organization[]).map(o => [o.id, o]))
    // Business memberships must have an explicit Business product context.
    const businessMembers = memberships.filter(m => {
      const org = orgById.get(m.organization_id)
      return !!org && org.product_context?.toLowerCase() === 'business'
    })
    if (!businessMembers.length) return NextResponse.json({ window_hours: 24, memberships: [] }, { headers })

    const now = Date.now()
    const windowStart = now - WINDOW_MS
    const { data: history, error: historyError } = await admin
      .from('organization_member_status_history')
      .select('organization_member_id, status, started_at, ended_at')
      .in('organization_member_id', businessMembers.map(m => m.id))
      .gt('ended_at', new Date(windowStart).toISOString())
      .lt('started_at', new Date(now).toISOString())
    if (historyError) throw historyError

    const result = businessMembers.map(member => {
      const totals = Object.fromEntries(STATUSES.map(status => [status, 0])) as Record<Status, number>
      for (const row of (history ?? []) as History[]) {
        if (row.organization_member_id !== member.id || !STATUSES.includes(row.status as Status)) continue
        totals[row.status as Status] += durationInWindow(row.started_at, row.ended_at, windowStart, now)
      }
      const current = member.profile_status?.toLowerCase() ?? null
      const startedAt = member.profile_status_changed_at
      if (current && STATUSES.includes(current as Status) && startedAt) {
        totals[current as Status] += durationInWindow(startedAt, new Date(now).toISOString(), windowStart, now)
      }
      return {
        membership_id: member.id,
        current_status: current,
        status_started_at: startedAt,
        current_duration_seconds: startedAt ? Math.round(durationInWindow(startedAt, new Date(now).toISOString(), 0, now) / 1000) : null,
        last_24h_seconds: Object.fromEntries(STATUSES.map(status => [status, Math.round(totals[status] / 1000)])),
      }
    })

    return NextResponse.json({ window_hours: 24, as_of: new Date(now).toISOString(), memberships: result }, { headers })
  } catch (error) {
    console.error('Unable to load Business status context', error)
    return fail('Unable to load Business status context', 500)
  }
}
