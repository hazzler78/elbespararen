import { createClientForRequest } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    try {
      const supabase = createClientForRequest(request)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[auth/callback] Error exchanging code:', error)
        return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
      }

      if (data?.session) {
        // Create response with redirect
        const response = NextResponse.redirect(new URL(next, request.url))
        
        // Supabase SSR handles cookies automatically, but we need to ensure they're set
        // The session is already stored in Supabase's cookie format
        // Middleware will handle refreshing the session
        
        return response
      } else {
        console.error('[auth/callback] No session returned')
        return NextResponse.redirect(new URL('/auth/signin?error=Failed to create session', request.url))
      }
    } catch (error) {
      console.error('[auth/callback] Exception:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(errorMessage)}`, request.url))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/signin?error=Missing authorization code', request.url))
}
