import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store' }

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers })
}

async function getContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Social connection service is not configured')

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile, error: profileError } = await admin
    .from('personal_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (profileError) throw profileError

  return { admin, user, personalProfileId: (profile?.id as string | undefined) ?? null, url }
}

async function currentConnection(ctx: NonNullable<Awaited<ReturnType<typeof getContext>>>) {
  if (!ctx.personalProfileId) return null

  const { data: connection, error } = await ctx.admin
    .from('personal_social_connections')
    .select('id, social_profile_id, created_at')
    .eq('personal_profile_id', ctx.personalProfileId)
    .maybeSingle()
  if (error) throw error
  if (!connection) return null

  const { data: socialProfile, error: socialError } = await ctx.admin
    .from('social_profiles')
    .select('id, auth_user_id, username, display_name')
    .eq('id', connection.social_profile_id)
    .maybeSingle()
  if (socialError) throw socialError

  // Do not treat a stale or mismatched link as an authorized connection.
  if (!socialProfile || socialProfile.auth_user_id !== ctx.user.id) return null

  return {
    id: connection.id,
    social_profile_id: socialProfile.id,
    username: socialProfile.username,
    display_name: socialProfile.display_name,
    connected_at: connection.created_at,
  }
}

export async function GET() {
  try {
    const ctx = await getContext()
    if (!ctx) return fail('Not authenticated', 401)
    if (!ctx.personalProfileId) return fail('Personal profile not found', 404)
    return NextResponse.json({ connection: await currentConnection(ctx) }, { headers })
  } catch {
    return fail('Unable to load Social connection', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getContext()
    if (!ctx) return fail('Not authenticated', 401)
    if (!ctx.personalProfileId) return fail('Personal profile not found', 404)

    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request', 400)
    const input = body as Record<string, unknown>
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const password = typeof input.password === 'string' ? input.password : ''
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return fail('Enter your Social email and password', 400)
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!anonKey) throw new Error('Supabase public key is not configured')

    // Isolated, server-only client: never changes the browser's Personal session.
    const verifier = createSupabaseClient(ctx.url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({
      email,
      password,
    })
    if (verifyError || !verified.user) return fail('Invalid Social email or password', 401)

    // Personal and Social use the same Supabase Auth identity.
    if (verified.user.id !== ctx.user.id) {
      return fail('That Social login belongs to a different account than your Personal login', 403)
    }

    const { data: socialProfile, error: socialError } = await ctx.admin
      .from('social_profiles')
      .select('id')
      .eq('auth_user_id', verified.user.id)
      .maybeSingle()
    if (socialError) throw socialError
    if (!socialProfile) return fail('Social profile not found', 404)

    const { data: otherClaim, error: claimError } = await ctx.admin
      .from('personal_social_connections')
      .select('personal_profile_id')
      .eq('social_profile_id', socialProfile.id)
      .maybeSingle()
    if (claimError) throw claimError
    if (otherClaim && otherClaim.personal_profile_id !== ctx.personalProfileId) {
      return fail('This Social profile is already connected to another Personal account', 409)
    }

    const { error: saveError } = await ctx.admin
      .from('personal_social_connections')
      .upsert(
        { personal_profile_id: ctx.personalProfileId, social_profile_id: socialProfile.id },
        { onConflict: 'personal_profile_id' },
      )
    if (saveError) {
      if (saveError.code === '23505') return fail('This Social profile is already connected', 409)
      throw saveError
    }

    return NextResponse.json({ success: true, connection: await currentConnection(ctx) }, { headers })
  } catch {
    return fail('Unable to connect Social account', 500)
  }
}

export async function DELETE() {
  try {
    const ctx = await getContext()
    if (!ctx) return fail('Not authenticated', 401)
    if (!ctx.personalProfileId) return fail('Personal profile not found', 404)

    const { error } = await ctx.admin
      .from('personal_social_connections')
      .delete()
      .eq('personal_profile_id', ctx.personalProfileId)
    if (error) throw error

    return NextResponse.json({ success: true, connection: null }, { headers })
  } catch {
    return fail('Unable to disconnect Social account', 500)
  }
}
