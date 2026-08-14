import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  const publicRoutes = [
    '/',
    '/login',
    '/terms',
    '/privacy',
    '/update-password',
    '/abes-brief',
    '/explore-abe',
    '/security',
    '/public-faq',
    '/public-team-aether',
    '/public-sales',
    '/support',
    '/campaign-locked',

    // Academy
    '/aether-academy',
    '/aether-academy/comprehensive-guide',
    '/aether-academy/training-videos',
    '/aether-academy/articles',
    '/aether-academy/blog',
    '/aether-academy/patch-notes',
  ]

  const isPublicApiRoute =
    pathname === '/api/contact' ||
    pathname === '/api/auth/select-campaign' ||
    pathname === '/api/integrations/website/track' ||
    pathname.startsWith('/api/mobile/')

  const isPublicRoute = publicRoutes.includes(pathname)

  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(.*)$/)

  if (isPublicAsset || isPublicApiRoute) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }


  if (user && !isPublicRoute) {
    const organizationId = request.cookies.get('active_organization_id')?.value

    if (organizationId) {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: organization, error } = await adminSupabase
        .from('organizations')
        .select('is_locked')
        .eq('id', organizationId)
        .maybeSingle()

      if (error) {
        console.error('[Middleware] Organization lookup failed:', error)
      }

      if (
        organization?.is_locked &&
        pathname !== '/campaign-locked'
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/campaign-locked'
        return NextResponse.redirect(url)
      }
    }
  }


  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}