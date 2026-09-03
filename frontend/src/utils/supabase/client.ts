import { createBrowserClient } from '@supabase/ssr'

/*
  What is this file doing?
  This file creates a "Supabase Client". Think of it as a dedicated phone line 
  between our Next.js frontend (the browser) and our Supabase database.
  
  Whenever we want to log a user in, or fetch their assignments, we will import 
  this `createClient()` function to make the call!
*/
export function createClient() {
  // createBrowserClient is a special function provided by Supabase for Next.js.
  // It automatically securely grabs the URL and Key from the .env.local file you just made!
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
