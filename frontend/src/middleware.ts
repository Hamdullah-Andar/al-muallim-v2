import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/*
  What is this file doing?
  This is the official Next.js Middleware file. It MUST be placed exactly here in the `src/` folder.
  Every time a user clicks a link or loads a page, Next.js calls this function.
  
  We are simply telling Next.js to run our Supabase `updateSession` function 
  to verify the user's login status before letting them see the page!
*/
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files like JS and CSS)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * We ignore these so we don't waste database calls on loading simple images!
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
