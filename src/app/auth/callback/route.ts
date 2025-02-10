import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    // @ts-expect-error - Supabase client typing issue
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { 
            name: string; 
            value: string; 
            options?: {
              domain?: string;
              path?: string;
              maxAge?: number;
              httpOnly?: boolean;
              secure?: boolean;
              sameSite?: 'strict' | 'lax' | 'none';
            };
          }[]) {
            const response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
            return response
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = new URL(next, request.url)
      const response = NextResponse.redirect(redirectUrl)
      // Copy cookies from the supabase response to maintain session state
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        response.cookies.set('access_token', session.access_token)
      }
      return response
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
} 