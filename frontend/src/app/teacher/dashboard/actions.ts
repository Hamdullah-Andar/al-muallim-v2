'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNewClass(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Ensure the user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to create a class.' }
  }

  // 2. Grab the inputs from the form
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  // 3. Parse schedule fields (optional)
  const scheduleDaysRaw = formData.get('schedule_days') as string
  const scheduleTime = (formData.get('schedule_time') as string) || null

  let scheduleDays: string[] = []
  try {
    const parsed = JSON.parse(scheduleDaysRaw || '[]')
    if (Array.isArray(parsed)) scheduleDays = parsed
  } catch {
    scheduleDays = []
  }

  // 4. Insert the new class into the database
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      teacher_id: user.id,
      name,
      description,
      schedule_days: scheduleDays,
      schedule_time: scheduleTime || null
      // We DO NOT pass class_code here! 
      // The Supabase Database Trigger will automatically generate it, 
      // check for duplicates, and then return it back to us via .select()!
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating class:', error)
    return { error: 'Failed to create class. Please try again.' }
  }

  // 5. Tell Next.js to refresh the dashboard data so the new class shows up!
  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/classes')
  
  // 6. Return the new class data so the UI can display the Class Code!
  return { success: true, class: newClass }
}
