import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store' }

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers })
}

async function getContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

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

  return { admin, profileId: profile?.id as string | undefined }
}

type ConnectionRow = { id: string; membership_id: string; created_at: string }
type MemberRow = { id: string; organization_id: string; role: string | null }
type OrgRow = { id: string; product_context: string | null }

async function listConnections(ctx: NonNullable<Awaited<ReturnType<typeof getContext>>>) {
  if (!ctx.profileId) return []

  const { data: connections, error: connectionError } = await ctx.admin
    .from('personal_connections')
    .select('id, membership_id, created_at')
    .eq('personal_profile_id', ctx.profileId)
    .order('created_at', { ascending: false })
  if (connectionError) throw connectionError

  const rows = (connections ?? []) as ConnectionRow[]
  if (!rows.length) return []

  const { data: memberships, error: memberError } = await ctx.admin
    .from('organization_members')
    .select('id, organization_id, role')
    .in('id', rows.map(row => row.membership_id))
  if (memberError) throw memberError

  const members = (memberships ?? []) as MemberRow[]
  if (!members.length) return []

  const { data: organizations, error: orgError } = await ctx.admin
    .from('organizations')
    .select('id, product_context')
    .in('id', [...new Set(members.map(member => member.organization_id))])
  if (orgError) throw orgError

  const memberById = new Map(members.map(member => [member.id, member]))
  const orgById = new Map(((organizations ?? []) as OrgRow[]).map(org => [org.id, org]))

  return rows.flatMap(row => {
    const member = memberById.get(row.membership_id)
    const org = member && orgById.get(member.organization_id)
    if (!member || !org || ![null, 'political', 'business'].includes(org.product_context?.toLowerCase() ?? null)) return []
    return [{
      id: row.id,
      product: org.product_context?.toLowerCase() === 'business' ? 'Business' : 'Political',
      role: member.role ?? 'general_user',
      connected_at: row.created_at,
    }]
  })
}

export async function GET() {
  try {
    const ctx = await getContext()
    if (!ctx) return fail('Not authenticated', 401)
    if (!ctx.profileId) return fail('Personal profile not found', 404)
    return NextResponse.json({ connections: await listConnections(ctx) }, { headers })
  } catch {
    return fail('Unable to load Personal connections', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getContext()
    if (!ctx) return fail('Not authenticated', 401)
    if (!ctx.profileId) return fail('Personal profile not found', 404)

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request', 400)
    const input = body as Record<string, unknown>
    const slug = typeof input.organization_slug === 'string' ? input.organization_slug.trim().toLowerCase() : ''
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120 || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail('Enter a valid organization slug and membership email', 400)
    }

    const { data: organization, error: orgError } = await ctx.admin
      .from('organizations')
      .select('id, product_context')
      .ilike('slug', slug)
      .maybeSingle()
    if (orgError) throw orgError
    if (!organization || ![null, 'political', 'business'].includes(organization.product_context?.toLowerCase() ?? null)) {
      return fail('No matching Aether membership found', 404)
    }

    const { data: members, error: memberError } = await ctx.admin
      .from('organization_members')
      .select('id, membership_email')
      .eq('organization_id', organization.id)
      .ilike('membership_email', email)
      .limit(10)
    if (memberError) throw memberError

    const member = (members ?? []).find(row =>
      typeof row.membership_email === 'string' && row.membership_email.trim().toLowerCase() === email
    )
    if (!member) return fail('No matching Aether membership found', 404)

    // Check whether this membership has already been claimed by a Personal profile.
    const { data: existing, error: existingError } = await ctx.admin
      .from('personal_connections')
      .select('id, personal_profile_id')
      .eq('membership_id', member.id)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing) {
      if (existing.personal_profile_id !== ctx.profileId) return fail('This membership is already connected to another Personal account', 409)
      return NextResponse.json({ success: true, connections: await listConnections(ctx) }, { headers })
    }

    const { error: saveError } = await ctx.admin
      .from('personal_connections')
      .insert({ personal_profile_id: ctx.profileId, membership_id: member.id })
    if (saveError) {
      if (saveError.code === '23505') return fail('This membership is already connected', 409)
      throw saveError
    }

    return NextResponse.json({ success: true, connections: await listConnections(ctx) }, { headers })
  } catch {
    return fail('Unable to connect Aether membership', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getContext()
    if (!ctx) return fail('Not authenticated', 401)
    if (!ctx.profileId) return fail('Personal profile not found', 404)

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request', 400)
    const id = (body as Record<string, unknown>).connection_id
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid connection ID', 400)

    const { error } = await ctx.admin
      .from('personal_connections')
      .delete()
      .eq('id', id)
      .eq('personal_profile_id', ctx.profileId)
    if (error) throw error

    return NextResponse.json({ success: true, connections: await listConnections(ctx) }, { headers })
  } catch {
    return fail('Unable to disconnect Aether membership', 500)
  }
}
