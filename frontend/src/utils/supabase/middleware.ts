import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/*
  What is this file doing?
  This file creates the "Middleware" logic. Middleware runs on EVERY single page load 
  before the page is even sent to the user.
  
  Its main job is to:
  1. Check if the user's login token (cookie) is still valid, and refresh it if it's expiring.
  2. Protect our routes! If a random person tries to go to `/dashboard`, it will kick them back to `/login`.
*/
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create the Supabase client and pass it the cookies from the incoming request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This actually reaches out to Supabase to verify the user is who they say they are
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ROUTE PROTECTION LOGIC
  // Check if the user is trying to access the login or signup pages
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  
  // If the user is NOT logged in, and they are NOT on the login page or the home page...
  if (!user && !isAuthRoute && request.nextUrl.pathname !== '/') {
    // KICK THEM OUT! Redirect them to the login page.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If the user IS logged in, but they try to go back to the login page...
  if (user && isAuthRoute) {
    // Redirect them to their dashboard because they are already logged in!
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // We will build this page later
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
