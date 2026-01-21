import { createClientForRequest } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForRequest(request)
    await supabase.auth.signOut()
    
    // Clear auth cookies manually for Edge runtime
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  } catch (error) {
    console.error('[auth/signout] Error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
