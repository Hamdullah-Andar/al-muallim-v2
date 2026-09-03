'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const fullName = (formData.get('fullName') as string) || ''

  if (!fullName.trim()) {
    throw new Error("Full Name cannot be empty")
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  revalidatePath('/student/dashboard', 'page')
  revalidatePath('/teacher/dashboard', 'page')
  revalidatePath('/student', 'layout')
  revalidatePath('/teacher', 'layout')

  return { success: true }
}
