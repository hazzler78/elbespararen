import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const callbackUrl = requestUrl.searchParams.get('callbackUrl') || '/dashboard'
  
  const supabase = createClient()
  
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
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
  }

  if (data?.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.redirect(new URL('/auth/signin?error=Failed to initiate Google sign in', request.url))
}
