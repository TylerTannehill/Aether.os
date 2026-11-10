import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const STATUSES = ['active', 'busy', 'inactive', 'break', 'lunch', 'potato'] as const
type Status = (typeof STATUSES)[number]
type Product = 'Political' | 'Business'
const WINDOW_MS = 24 * 60 * 60 * 1000
const TWO_HOURS = 2 * 60 * 60 * 1000
const PAGE_SIZE = 1000
const CHUNK_SIZE = 100

type Engagement = { likes_received: number; comments_received: number; refreshed_at: string }
const engagementCache = new Map<string, { expires: number; data: Engagement }>()

type Member = {
  id: string
  organization_id: string
  role: string | null
  profile_status: string | null
  profile_status_changed_at: string | null
}
type History = {
  organization_member_id: string
  status: string
  started_at: string
  ended_at: string
}

function overlapSeconds(start: string, end: string, windowStart: number, now: number) {
  const a = Date.parse(start)
  const b = Date.parse(end)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.min(b, now) - Math.max(a, windowStart)) / 1000
}

/** Server-only, authenticated Personal context. Never accept a profile ID from a caller. */
export async function getYouContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Personal connections are not configured')
  const admin = createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile, error: profileError } = await admin
    .from('personal_profiles').select('id').eq('auth_user_id', user.id).maybeSingle()
  if (profileError) throw profileError
  if (!profile) throw new Error('Personal profile not found')

  const [goalsResult, notesResult, connectionsResult] = await Promise.all([
    admin.from('personal_goals').select('id, text, progress')
      .eq('personal_profile_id', profile.id).order('created_at', { ascending: true }),
    admin.from('personal_notes').select('content')
      .eq('personal_profile_id', profile.id).maybeSingle(),
    admin.from('personal_connections').select('membership_id')
      .eq('personal_profile_id', profile.id),
  ])
  if (goalsResult.error) throw goalsResult.error
  if (notesResult.error) throw notesResult.error
  if (connectionsResult.error) throw connectionsResult.error

  const ids = [...new Set((connectionsResult.data ?? []).map(row => row.membership_id))]
  const memberships: Array<{
    product: Product
    membership_id: string
    role: string
    current_status: string | null
    status_started_at: string | null
    current_duration_seconds: number | null
    last_24h_seconds: Record<Status, number>
  }> = []

  if (ids.length) {
    const { data: memberData, error: memberError } = await admin
      .from('organization_members')
      .select('id, organization_id, role, profile_status, profile_status_changed_at')
      .in('id', ids)
    if (memberError) throw memberError
    const members = (memberData ?? []) as Member[]

    if (members.length) {
      const { data: orgData, error: orgError } = await admin
        .from('organizations').select('id, product_context')
        .in('id', [...new Set(members.map(member => member.organization_id))])
      if (orgError) throw orgError
      const orgById = new Map((orgData ?? []).map(org => [org.id, org.product_context]))
      const permitted = members.flatMap(member => {
        if (!orgById.has(member.organization_id)) return []
        const productContext = orgById.get(member.organization_id)?.toLowerCase() ?? null
        if (productContext !== null && productContext !== 'political' && productContext !== 'business') return []
        return [{ member, product: (productContext === 'business' ? 'Business' : 'Political') as Product }]
      })

      if (permitted.length) {
        const now = Date.now()
        const windowStart = now - WINDOW_MS
        const { data: historyData, error: historyError } = await admin
          .from('organization_member_status_history')
          .select('organization_member_id, status, started_at, ended_at')
          .in('organization_member_id', permitted.map(item => item.member.id))
          .gt('ended_at', new Date(windowStart).toISOString())
          .lt('started_at', new Date(now).toISOString())
        if (historyError) throw historyError
        const history = (historyData ?? []) as History[]

        for (const { member, product } of permitted) {
          const totals = Object.fromEntries(STATUSES.map(status => [status, 0])) as Record<Status, number>
          for (const item of history) {
            if (item.organization_member_id !== member.id || !STATUSES.includes(item.status as Status)) continue
            totals[item.status as Status] += overlapSeconds(item.started_at, item.ended_at, windowStart, now)
          }
          const current = member.profile_status?.toLowerCase() ?? null
          const startedAt = member.profile_status_changed_at
          if (current && STATUSES.includes(current as Status) && startedAt) {
            totals[current as Status] += overlapSeconds(startedAt, new Date(now).toISOString(), windowStart, now)
          }
          memberships.push({
            product,
            membership_id: member.id,
            role: member.role ?? 'general_user',
            current_status: current,
            status_started_at: startedAt,
            current_duration_seconds: startedAt
              ? Math.round(overlapSeconds(startedAt, new Date(now).toISOString(), 0, now))
              : null,
            last_24h_seconds: Object.fromEntries(
              STATUSES.map(status => [status, Math.round(totals[status])]),
            ) as Record<Status, number>,
          })
        }
      }
    }
  }

  // Social professional context is available only through an explicitly linked,
  // same-user Social profile. A stale or mismatched connection yields no context.
  const { data: socialLink, error: socialLinkError } = await admin
    .from('personal_social_connections')
    .select('social_profile_id')
    .eq('personal_profile_id', profile.id)
    .maybeSingle()
  if (socialLinkError) throw socialLinkError

  let socialAggregates: (Engagement & { unread_dms: number; unread_refreshed_at: string }) | null = null
  let professionalContext: {
    display_name: string | null
    username: string | null
    bio: string | null
    experience: unknown[]
    education: unknown[]
    aether_verified: {
      political: boolean
      business: boolean
      experience: Array<{ product: Product; role: string; months: number | null }>
    }
    refreshed_at: string
  } | null = null

  if (socialLink) {
    const { data: socialProfile, error: socialProfileError } = await admin
      .from('social_profiles')
      .select('id, auth_user_id, display_name, username, bio')
      .eq('id', socialLink.social_profile_id)
      .maybeSingle()
    if (socialProfileError) throw socialProfileError

    if (socialProfile && socialProfile.auth_user_id === user.id) {
      const [experienceResult, educationResult, claimsResult] = await Promise.all([
        admin.from('social_professional_experience')
          .select('company_name, job_title, employment_type, location, location_type, start_date, end_date, is_current, description')
          .eq('profile_id', socialProfile.id)
          .order('is_current', { ascending: false })
          .order('start_date', { ascending: false }),
        admin.from('social_professional_education')
          .select('entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
          .eq('profile_id', socialProfile.id)
          .order('display_order', { ascending: true }),
        admin.from('social_aether_claims')
          .select('membership_id')
          .eq('profile_id', socialProfile.id),
      ])
      if (experienceResult.error) throw experienceResult.error
      if (educationResult.error) throw educationResult.error
      if (claimsResult.error) throw claimsResult.error

      const claimIds = [...new Set((claimsResult.data ?? []).map(row => row.membership_id))]
      const verified: Array<{ product: Product; role: string; months: number | null }> = []
      if (claimIds.length) {
        const { data: claimedMembers, error: claimedMembersError } = await admin
          .from('organization_members')
          .select('id, organization_id, role, created_at')
          .in('id', claimIds)
        if (claimedMembersError) throw claimedMembersError
        const claimedOrgIds = [...new Set((claimedMembers ?? []).map(row => row.organization_id))]
        if (claimedOrgIds.length) {
          const { data: claimedOrgs, error: claimedOrgsError } = await admin
            .from('organizations')
            .select('id, product_context')
            .in('id', claimedOrgIds)
          if (claimedOrgsError) throw claimedOrgsError
          const claimedOrgById = new Map((claimedOrgs ?? []).map(org => [org.id, org.product_context]))
          for (const member of claimedMembers ?? []) {
            if (!claimedOrgById.has(member.organization_id)) continue
            const context = claimedOrgById.get(member.organization_id)?.toLowerCase() ?? null
            if (context !== null && context !== 'political' && context !== 'business') continue
            const start = member.created_at ? new Date(member.created_at) : null
            verified.push({
              product: context === 'business' ? 'Business' : 'Political',
              role: member.role ?? 'general_user',
              months: start && !Number.isNaN(start.getTime())
                ? Math.max(0, Math.round((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
                : null,
            })
          }
        }
      }

      // Social engagement: mirror the existing aggregates endpoint. Only counts and
      // read metadata are retrieved; post and DM contents are never fetched.
      const socialProfileId = socialProfile.id as string
      const cacheKey = `${user.id}:${socialProfileId}`
      const cached = engagementCache.get(cacheKey)
      let engagement: Engagement
      if (cached && cached.expires > Date.now()) {
        engagement = cached.data
      } else {
        const postIds: string[] = []
        for (let start = 0; ; start += PAGE_SIZE) {
          const { data, error } = await admin.from('social_posts').select('id')
            .eq('author_id', socialProfileId).order('id').range(start, start + PAGE_SIZE - 1)
          if (error) throw error
          const rows = data ?? []
          postIds.push(...rows.map(row => row.id))
          if (rows.length < PAGE_SIZE) break
        }
        let likes = 0
        let comments = 0
        for (let i = 0; i < postIds.length; i += CHUNK_SIZE) {
          const ids = postIds.slice(i, i + CHUNK_SIZE)
          const [likesResult, commentsResult] = await Promise.all([
            admin.from('social_post_likes').select('id', { count: 'exact', head: true }).in('post_id', ids),
            admin.from('social_post_comments').select('id', { count: 'exact', head: true }).in('post_id', ids),
          ])
          if (likesResult.error) throw likesResult.error
          if (commentsResult.error) throw commentsResult.error
          likes += likesResult.count ?? 0
          comments += commentsResult.count ?? 0
        }
        engagement = { likes_received: likes, comments_received: comments, refreshed_at: new Date().toISOString() }
        engagementCache.set(cacheKey, { data: engagement, expires: Date.now() + TWO_HOURS })
      }

      const conversations: Array<{
        id: string; member_a: string; member_b: string;
        member_a_read_at: string | null; member_b_read_at: string | null
      }> = []
      for (let start = 0; ; start += PAGE_SIZE) {
        const { data, error } = await admin.from('social_dm_conversations')
          .select('id,member_a,member_b,member_a_read_at,member_b_read_at')
          .or(`member_a.eq.${socialProfileId},member_b.eq.${socialProfileId}`)
          .order('id').range(start, start + PAGE_SIZE - 1)
        if (error) throw error
        const rows = data ?? []
        conversations.push(...rows)
        if (rows.length < PAGE_SIZE) break
      }

      const otherIds = [...new Set(conversations.map(c => c.member_a === socialProfileId ? c.member_b : c.member_a))]
      const allowed = new Set<string>()
      const blocked = new Set<string>()
      for (let i = 0; i < otherIds.length; i += CHUNK_SIZE) {
        const ids = otherIds.slice(i, i + CHUNK_SIZE)
        const [outgoing, incoming, blockedByMe, blockedMe] = await Promise.all([
          admin.from('social_connections').select('requester_id,recipient_id')
            .eq('requester_id', socialProfileId).in('recipient_id', ids)
            .eq('status', 'accepted').eq('requester_grants_personal', true).eq('recipient_grants_personal', true),
          admin.from('social_connections').select('requester_id,recipient_id')
            .eq('recipient_id', socialProfileId).in('requester_id', ids)
            .eq('status', 'accepted').eq('requester_grants_personal', true).eq('recipient_grants_personal', true),
          admin.from('social_user_blocks').select('blocked_id').eq('blocker_id', socialProfileId).in('blocked_id', ids),
          admin.from('social_user_blocks').select('blocker_id').eq('blocked_id', socialProfileId).in('blocker_id', ids),
        ])
        for (const result of [outgoing, incoming, blockedByMe, blockedMe]) if (result.error) throw result.error
        for (const row of outgoing.data ?? []) allowed.add(row.recipient_id)
        for (const row of incoming.data ?? []) allowed.add(row.requester_id)
        for (const row of blockedByMe.data ?? []) blocked.add(row.blocked_id)
        for (const row of blockedMe.data ?? []) blocked.add(row.blocker_id)
      }

      let unreadDms = 0
      for (const c of conversations) {
        const other = c.member_a === socialProfileId ? c.member_b : c.member_a
        if (!allowed.has(other) || blocked.has(other)) continue
        const readAt = c.member_a === socialProfileId ? c.member_a_read_at : c.member_b_read_at
        let query = admin.from('social_dm_messages').select('id', { count: 'exact', head: true })
          .eq('conversation_id', c.id).neq('sender_id', socialProfileId)
        if (readAt) query = query.gt('created_at', readAt)
        const result = await query
        if (result.error) throw result.error
        unreadDms += result.count ?? 0
      }
      socialAggregates = { ...engagement, unread_dms: unreadDms, unread_refreshed_at: new Date().toISOString() }

      professionalContext = {
        display_name: socialProfile.display_name,
        username: socialProfile.username,
        bio: socialProfile.bio,
        experience: experienceResult.data ?? [],
        education: educationResult.data ?? [],
        aether_verified: {
          political: verified.some(item => item.product === 'Political'),
          business: verified.some(item => item.product === 'Business'),
          experience: verified,
        },
        refreshed_at: new Date().toISOString(),
      }
    }
  }

  return {
    as_of: new Date().toISOString(),
    window_hours: 24,
    personal: {
      goals: goalsResult.data ?? [],
      notes: notesResult.data?.content ?? '',
    },
    connected_work: memberships,
    social: { connected: professionalContext !== null, professional_context: professionalContext, social_aggregates: socialAggregates },
  }
}
