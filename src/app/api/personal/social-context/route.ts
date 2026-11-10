import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store' }

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers })
}

type Claim = { membership_id: string }
type Membership = { id: string; organization_id: string; role: string | null; created_at: string | null }
type Organization = { id: string; product_context: string | null }

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return fail('Not authenticated', 401)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return fail('Social context service is not configured', 500)

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

    const { data: connection, error: connectionError } = await admin
      .from('personal_social_connections')
      .select('social_profile_id')
      .eq('personal_profile_id', personal.id)
      .maybeSingle()
    if (connectionError) throw connectionError
    if (!connection) return NextResponse.json({ connected: false, professional_context: null }, { headers })

    const { data: profile, error: profileError } = await admin
      .from('social_profiles')
      .select('id, auth_user_id, display_name, username, bio')
      .eq('id', connection.social_profile_id)
      .maybeSingle()
    if (profileError) throw profileError
    // A stale or mismatched link must not expose another person's profile.
    if (!profile || profile.auth_user_id !== user.id) {
      return NextResponse.json({ connected: false, professional_context: null }, { headers })
    }

    const [experienceResult, educationResult, claimsResult] = await Promise.all([
      admin.from('social_professional_experience')
        .select('company_name, job_title, employment_type, location, location_type, start_date, end_date, is_current, description')
        .eq('profile_id', profile.id)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false }),
      admin.from('social_professional_education')
        .select('entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
        .eq('profile_id', profile.id)
        .order('display_order', { ascending: true }),
      admin.from('social_aether_claims')
        .select('membership_id')
        .eq('profile_id', profile.id),
    ])
    if (experienceResult.error) throw experienceResult.error
    if (educationResult.error) throw educationResult.error
    if (claimsResult.error) throw claimsResult.error

    const claimIds = [...new Set(((claimsResult.data ?? []) as Claim[]).map(row => row.membership_id))]
    let verified: Array<{ product: 'Political' | 'Business'; role: string; months: number | null }> = []

    if (claimIds.length) {
      const { data: membershipData, error: membershipError } = await admin
        .from('organization_members')
        .select('id, organization_id, role, created_at')
        .in('id', claimIds)
      if (membershipError) throw membershipError
      const memberships = (membershipData ?? []) as Membership[]
      const orgIds = [...new Set(memberships.map(row => row.organization_id))]

      if (orgIds.length) {
        const { data: orgData, error: orgError } = await admin
          .from('organizations')
          .select('id, product_context')
          .in('id', orgIds)
        if (orgError) throw orgError
        const orgById = new Map(((orgData ?? []) as Organization[]).map(org => [org.id, org]))

        verified = memberships.flatMap(member => {
          const org = orgById.get(member.organization_id)
          const productContext = org?.product_context?.toLowerCase() ?? null
          // In the existing schema, null is the legacy Political context.
          if (!org || ![null, 'political', 'business'].includes(productContext)) return []
          const start = member.created_at ? new Date(member.created_at) : null
          const months = start && !Number.isNaN(start.getTime())
            ? Math.max(0, Math.round((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
            : null
          return [{
            product: productContext === 'business' ? 'Business' as const : 'Political' as const,
            role: member.role ?? 'general_user',
            months,
          }]
        })
      }
    }

    return NextResponse.json({
      connected: true,
      professional_context: {
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        experience: experienceResult.data ?? [],
        education: educationResult.data ?? [],
        aether_verified: {
          political: verified.some(item => item.product === 'Political'),
          business: verified.some(item => item.product === 'Business'),
          experience: verified,
        },
        refreshed_at: new Date().toISOString(),
      },
    }, { headers })
  } catch {
    return fail('Unable to load Social professional context', 500)
  }
}
