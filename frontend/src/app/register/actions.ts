'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function registerUser(formData: FormData) {
  const supabase = await createClient()

  // Get data from our form fields
  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string // 'student' or 'teacher'

  if (!email || !password || !fullName || !role) {
    return redirect('/register?message=Please fill out all fields')
  }

  // Register the user with Supabase Auth
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // This 'data' object is critical! 
      // Our custom PostgreSQL trigger will grab this metadata and insert it into our 'profiles' table!
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    return redirect(`/register?message=${encodeURIComponent(error.message)}`)
  }

  // After successful registration, redirect them back to the login page
  revalidatePath('/login')
  redirect('/login?message=Account created successfully! Please sign in.')
}
