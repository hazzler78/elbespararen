import { createClientForRequest } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const callbackUrl = requestUrl.searchParams.get('callbackUrl') || '/dashboard'
  
  try {
    const supabase = createClientForRequest(request)
    
    // Get the origin for redirect URL
    const origin = requestUrl.origin
    const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error('[auth/signin/google] Error:', error)
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
    }

    if (data?.url) {
      return NextResponse.redirect(data.url)
    }

    return NextResponse.redirect(new URL('/auth/signin?error=Failed to initiate Google sign in', request.url))
  } catch (error) {
    console.error('[auth/signin/google] Exception:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=Failed to initiate Google sign in', request.url))
  }
}
