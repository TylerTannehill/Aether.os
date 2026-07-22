import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
  ]

  const isPublicApiRoute =
    pathname === '/api/auth/select-campaign' ||
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

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
