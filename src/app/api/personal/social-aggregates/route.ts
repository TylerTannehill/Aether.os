import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }
const TWO_HOURS = 2 * 60 * 60 * 1000
const PAGE_SIZE = 1000
const CHUNK_SIZE = 100

type Engagement = { likes_received: number; comments_received: number; refreshed_at: string }
const engagementCache = new Map<string, { expires: number; data: Engagement }>()

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return fail('Not authenticated', 401)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return fail('Social aggregates service is not configured', 500)
    const admin = createAdminClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: personal, error: personalError } = await admin.from('personal_profiles')
      .select('id').eq('auth_user_id', user.id).maybeSingle()
    if (personalError) throw personalError
    if (!personal) return fail('Personal profile not found', 404)

    const { data: connection, error: connectionError } = await admin.from('personal_social_connections')
      .select('social_profile_id').eq('personal_profile_id', personal.id).maybeSingle()
    if (connectionError) throw connectionError
    if (!connection) return NextResponse.json({ connected: false, social_aggregates: null }, { headers })

    const { data: profile, error: profileError } = await admin.from('social_profiles')
      .select('id, auth_user_id').eq('id', connection.social_profile_id).maybeSingle()
    if (profileError) throw profileError
    if (!profile || profile.auth_user_id !== user.id) {
      return NextResponse.json({ connected: false, social_aggregates: null }, { headers })
    }

    const profileId = profile.id as string
    const cacheKey = `${user.id}:${profileId}`
    const cached = engagementCache.get(cacheKey)
    let engagement: Engagement

    if (cached && cached.expires > Date.now()) {
      engagement = cached.data
    } else {
      // Fetch post IDs only; never fetch post content.
      const postIds: string[] = []
      for (let start = 0; ; start += PAGE_SIZE) {
        const { data, error } = await admin.from('social_posts').select('id')
          .eq('author_id', profileId).order('id').range(start, start + PAGE_SIZE - 1)
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
      // Best-effort in-process cache; serverless instances may refresh independently.
      engagementCache.set(cacheKey, { data: engagement, expires: Date.now() + TWO_HOURS })
    }

    // Only metadata: conversation participants, read timestamps, and message counts.
    const conversations: Array<{
      id: string; member_a: string; member_b: string;
      member_a_read_at: string | null; member_b_read_at: string | null
    }> = []
    for (let start = 0; ; start += PAGE_SIZE) {
      const { data, error } = await admin.from('social_dm_conversations')
        .select('id,member_a,member_b,member_a_read_at,member_b_read_at')
        .or(`member_a.eq.${profileId},member_b.eq.${profileId}`)
        .order('id').range(start, start + PAGE_SIZE - 1)
      if (error) throw error
      const rows = data ?? []
      conversations.push(...rows)
      if (rows.length < PAGE_SIZE) break
    }

    // Reproduce Social's mutual-access rule and additionally exclude blocked members.
    const otherIds = [...new Set(conversations.map(c => c.member_a === profileId ? c.member_b : c.member_a))]
    const allowed = new Set<string>()
    const blocked = new Set<string>()
    for (let i = 0; i < otherIds.length; i += CHUNK_SIZE) {
      const ids = otherIds.slice(i, i + CHUNK_SIZE)
      const [outgoing, incoming, blockedByMe, blockedMe] = await Promise.all([
        admin.from('social_connections').select('requester_id,recipient_id')
          .eq('requester_id', profileId).in('recipient_id', ids)
          .eq('status', 'accepted').eq('requester_grants_personal', true).eq('recipient_grants_personal', true),
        admin.from('social_connections').select('requester_id,recipient_id')
          .eq('recipient_id', profileId).in('requester_id', ids)
          .eq('status', 'accepted').eq('requester_grants_personal', true).eq('recipient_grants_personal', true),
        admin.from('social_user_blocks').select('blocked_id').eq('blocker_id', profileId).in('blocked_id', ids),
        admin.from('social_user_blocks').select('blocker_id').eq('blocked_id', profileId).in('blocker_id', ids),
      ])
      for (const result of [outgoing, incoming, blockedByMe, blockedMe]) if (result.error) throw result.error
      for (const row of outgoing.data ?? []) allowed.add(row.recipient_id)
      for (const row of incoming.data ?? []) allowed.add(row.requester_id)
      for (const row of blockedByMe.data ?? []) blocked.add(row.blocked_id)
      for (const row of blockedMe.data ?? []) blocked.add(row.blocker_id)
    }

    let unreadDms = 0
    for (const c of conversations) {
      const other = c.member_a === profileId ? c.member_b : c.member_a
      if (!allowed.has(other) || blocked.has(other)) continue
      const readAt = c.member_a === profileId ? c.member_a_read_at : c.member_b_read_at
      let query = admin.from('social_dm_messages').select('id', { count: 'exact', head: true })
        .eq('conversation_id', c.id).neq('sender_id', profileId)
      if (readAt) query = query.gt('created_at', readAt)
      const result = await query
      if (result.error) throw result.error
      unreadDms += result.count ?? 0
    }

    return NextResponse.json({
      connected: true,
      social_aggregates: {
        ...engagement,
        unread_dms: unreadDms,
        unread_refreshed_at: new Date().toISOString(),
      },
    }, { headers })
  } catch {
    return fail('Unable to load Social aggregates', 500)
  }
}
