'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/*
  What is this file doing?
  This file contains our secure "Server Actions". Notice the `'use server'` at the very top?
  That tells Next.js: "NEVER send this code to the browser. Only run it on the secure backend server."

  When the user clicks the "Sign In" button on the Login page, the form will securely send 
  the email and password to this `login` function.
*/
export async function login(formData: FormData) {
  // 1. Create a fresh, secure connection to the database
  const supabase = await createClient()

  // 2. Grab the email and password the user typed into the form
  // HOW DOES THE DATA GET HERE?
  // Because we used `formAction={login}` on our button in page.tsx, Next.js automatically
  // packages all our <input> fields into this `formData` object. 
  // We use .get() and the HTML `name` attribute (like name="email") to pull the exact text they typed!
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 3. Ask Supabase to log them in with those credentials!
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // If they typed the wrong password (or the account doesn't exist), 
    // we redirect them back to the login page and attach an error message to the URL.
    redirect('/login?message=' + encodeURIComponent('Incorrect email or password'))
  }

  // 4. If successful, we clear the Next.js cache so it knows the user's status changed,
  // and we redirect them into the VIP area: the dashboard!
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
