import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'experimental-edge'

function redirectWwwToApex(request: NextRequest): NextResponse | null {
  const host = request.headers.get('host') || ''
  // Skip local/dev hosts
  if (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.includes('pages.dev') ||
    host.includes('workers.dev')
  ) {
    return null
  }

  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.slice(4)
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  return null
}

export async function middleware(request: NextRequest) {
  const wwwRedirect = redirectWwwToApex(request)
  if (wwwRedirect) return wwwRedirect

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/callback (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
