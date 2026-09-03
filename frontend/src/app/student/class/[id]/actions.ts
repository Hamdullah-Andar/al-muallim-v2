'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logZikrSession(
  studentId: string, 
  assignmentId: string, 
  count: number, 
  date: string,
  classId: string
) {
  const supabase = await createClient()

  // Find if progress already exists for this date
  const { data: existingProgress } = await supabase
    .from('student_progress')
    .select('id, completed_value')
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .eq('tracking_date', date)
    .maybeSingle()

  let newCompletedValue = count
  if (existingProgress) {
    newCompletedValue = (existingProgress.completed_value || 0) + count
  }

  // Get the target to see if it's fully completed
  const { data: assignment } = await supabase
    .from('assignments')
    .select('content')
    .eq('id', assignmentId)
    .maybeSingle()
  
  const target = assignment?.content?.target || 0
  const isCompleted = newCompletedValue >= target

  if (existingProgress) {
    const { error: updateError } = await supabase
      .from('student_progress')
      .update({
        completed_value: newCompletedValue,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
    if (updateError) {
      console.error('Error updating zikr progress:', updateError)
      throw new Error(updateError.message)
    }
  } else {
    const { error: insertError } = await supabase
      .from('student_progress')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        tracking_date: date,
        completed_value: newCompletedValue,
        is_completed: isCompleted
      })
    if (insertError) {
      console.error('Error inserting zikr progress:', insertError)
      throw new Error(insertError.message)
    }
  }

  revalidatePath(`/student/class/${classId}`)
  revalidatePath(`/student/dashboard`)
  revalidatePath(`/student/assignments`)
  revalidatePath('/student', 'layout')
  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/analytics')
  return { success: true }
}

export async function togglePrayer(
  studentId: string,
  assignmentId: string,
  prayerName: string,
  checked: boolean,
  date: string,
  classId: string
) {
  const supabase = await createClient()

  // Find existing progress
  const { data: existingProgress } = await supabase
    .from('student_progress')
    .select('id, progress_data, completed_value')
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .eq('tracking_date', date)
    .maybeSingle()

  const currentData = existingProgress?.progress_data || {}
  
  // ============================================================================
  // BITMASK HYDRATION (Crucial for Dashboard Sync)
  // The Analytics Dashboard reads prayer completion using a bitmask.
  // Fajr = 1, Dhuhr = 2, Asr = 4, Maghrib = 8, Isha = 16.
  // If `progress_data` is empty but `completed_value` exists, we must decode
  // the bitmask back into a boolean object so the UI can toggle it properly.
  // ============================================================================
  if (Object.keys(currentData).length === 0 && existingProgress?.completed_value) {
    const m = existingProgress.completed_value;
    if ((m & 1) !== 0) currentData['Fajr'] = true;
    if ((m & 2) !== 0) currentData['Dhuhr'] = true;
    if ((m & 4) !== 0) currentData['Asr'] = true;
    if ((m & 8) !== 0) currentData['Maghrib'] = true;
    if ((m & 16) !== 0) currentData['Isha'] = true;
  }

  const newData = { ...currentData, [prayerName]: checked }
  
  // ============================================================================
  // BITMASK CALCULATION
  // We re-calculate the mathematical bitmask from the updated JSON object.
  // This ensures that when we save `completed_value`, the global Dashboard
  // can instantly read it correctly without parsing JSON.
  // ============================================================================
  let mask = 0;
  if (newData['Fajr']) mask |= 1;
  if (newData['Dhuhr']) mask |= 2;
  if (newData['Asr']) mask |= 4;
  if (newData['Maghrib']) mask |= 8;
  if (newData['Isha']) mask |= 16;
  
  // 31 is the sum of 1 + 2 + 4 + 8 + 16 (All 5 prayers completed)
  const isCompleted = mask === 31;

  if (existingProgress) {
    const { error: updateError } = await supabase
      .from('student_progress')
      .update({
        progress_data: newData,
        completed_value: mask,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
    if (updateError) {
      console.error('Error updating prayer progress:', updateError)
      throw new Error(updateError.message)
    }
  } else {
    const { error: insertError } = await supabase
      .from('student_progress')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        tracking_date: date,
        progress_data: newData,
        completed_value: mask,
        is_completed: isCompleted
      })
    if (insertError) {
      console.error('Error inserting prayer progress:', insertError)
      throw new Error(insertError.message)
    }
  }

  revalidatePath(`/student/class/${classId}`)
  revalidatePath(`/student/dashboard`)
  revalidatePath(`/student/assignments`)
  revalidatePath('/student', 'layout')
  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/analytics')
  return { success: true }
}

export async function logExtraReadingSession(
  studentId: string, 
  assignmentId: string, 
  count: number, 
  date: string,
  classId: string
) {
  const supabase = await createClient()

  // Find existing progress for today
  const { data: existingProgress } = await supabase
    .from('student_progress')
    .select('id, completed_value')
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .eq('tracking_date', date)
    .maybeSingle()

  const { data: assignment } = await supabase
    .from('assignments')
    .select('title, content, target_count, linked_book_id')
    .eq('id', assignmentId)
    .maybeSingle()
  
  const target = assignment?.content?.target || assignment?.target_count || 1

  let newCompletedValue = count
  if (existingProgress) {
    newCompletedValue = (existingProgress.completed_value || 0) + count
  }
  const isCompleted = newCompletedValue >= target

  if (existingProgress) {
    const { error: updateError } = await supabase
      .from('student_progress')
      .update({
        completed_value: newCompletedValue,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
    if (updateError) {
      console.error('Error updating reading progress:', updateError)
      throw new Error(updateError.message)
    }
  } else {
    const { error: insertError } = await supabase
      .from('student_progress')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        tracking_date: date,
        completed_value: newCompletedValue,
        is_completed: isCompleted
      })
    if (insertError) {
      console.error('Error inserting reading progress:', insertError)
      throw new Error(insertError.message)
    }
  }

  // Also sync with book_progress so global starting points across the app increment properly
  const linkedBookId = assignment?.content?.linkedBookId || assignment?.linked_book_id
  const titleLower = (assignment?.title || '').toLowerCase()
  const isQuran = linkedBookId === 'quran' || titleLower.includes('quran') || titleLower.includes('recit')
  const bookId = isQuran ? 'quran' : (linkedBookId || null)

  if (bookId && bookId !== 'external') {
    const { data: existingBookProg } = await supabase
      .from('book_progress')
      .select('completed_portions, current_page')
      .eq('student_id', studentId)
      .eq('book_id', bookId)
      .maybeSingle()

    const prevPortions = existingBookProg?.completed_portions || 0
    const newPortions = prevPortions + count
    const newPage = existingBookProg?.current_page ? existingBookProg.current_page + count : newPortions

    await supabase
      .from('book_progress')
      .upsert(
        {
          student_id: studentId,
          book_id: bookId,
          book_title: isQuran ? 'The Holy Quran' : (assignment?.title || 'Library Book'),
          current_page: newPage,
          completed_portions: newPortions,
          last_read_at: new Date().toISOString()
        },
        { onConflict: 'student_id, book_id' }
      )
  }

  revalidatePath(`/student/class/${classId}`)
  revalidatePath(`/student/dashboard`)
  revalidatePath(`/student/assignments`)
  revalidatePath(`/student/analytics`)
  revalidatePath('/student', 'layout')
  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/analytics')
  return { success: true }
}
