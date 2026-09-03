'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleAssignmentProgress(assignmentId: string, isCompleted: boolean, completedValue: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  // Generate today's date string (YYYY-MM-DD)
  const todayDate = new Date().toISOString().split('T')[0]

  let finalCompletedValue = completedValue

  if (finalCompletedValue === null) {
    // Fetch existing progress and target assignment to compute proper value
    const { data: existingProg } = await supabase
      .from('student_progress')
      .select('is_completed, completed_value')
      .eq('student_id', user.id)
      .eq('assignment_id', assignmentId)
      .eq('tracking_date', todayDate)
      .maybeSingle()

    const { data: assignment } = await supabase
      .from('assignments')
      .select('content, target_count')
      .eq('id', assignmentId)
      .single()

    const target = assignment?.content?.target || assignment?.target_count || 1
    const currentVal = existingProg?.completed_value || 0

    if (isCompleted && existingProg?.is_completed) {
      // Student clicked "+ Log Extra" after already being done today!
      finalCompletedValue = currentVal + target
    } else if (isCompleted) {
      // First time completing today
      finalCompletedValue = Math.max(currentVal, target, 1)
    } else {
      finalCompletedValue = 0
    }
  }

  // Use Upsert! Because of our UNIQUE constraint in the DB, this safely inserts OR updates perfectly!
  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: isCompleted,
        completed_value: finalCompletedValue || 0
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Upsert Error:", error)
    throw new Error(`Failed to update progress: ${error.message} - ${error.details || ''}`)
  }

  // Refresh both student dashboard and analytics so data is always synced in real-time
  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
  revalidatePath('/student', 'layout')
}

export async function incrementZikrProgress(assignmentId: string, newCount: number, isCompleted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: isCompleted,
        completed_value: newCount
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Zikr Upsert Error:", error)
    throw new Error(`Failed to update zikr progress: ${error.message} - ${error.details || ''}`)
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
  revalidatePath('/student', 'layout')
}

export async function togglePrayerMask(assignmentId: string, maskValue: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  // Find all active classes where the student is currently enrolled
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(id, is_active)')
    .eq('student_id', user.id)

  const activeClassIds = (enrollments || [])
    .filter((e: any) => e.classes && e.classes.is_active !== false)
    .map((e: any) => e.class_id)
    .filter(Boolean)

  let prayerAssignmentIds = [assignmentId]
  if (activeClassIds.length > 0) {
    const { data: prayerAssignments } = await supabase
      .from('assignments')
      .select('id')
      .in('class_id', activeClassIds)
      .eq('is_daily', true)
      .or('category.ilike.prayer,title.ilike.%prayer%')

    if (prayerAssignments && prayerAssignments.length > 0) {
      prayerAssignmentIds = Array.from(new Set([
        assignmentId,
        ...prayerAssignments.map((a: any) => a.id)
      ]))
    }
  }

  const upsertRows = prayerAssignmentIds.map((id: string) => ({
    student_id: user.id,
    assignment_id: id,
    tracking_date: todayDate,
    is_completed: maskValue === 31, // 31 means all 5 prayers checked (1+2+4+8+16)
    completed_value: maskValue
  }))

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      upsertRows,
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) throw new Error("Failed to update prayer progress")

  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
  revalidatePath('/student', 'layout')
}

export async function updateMankiratProgress(assignmentId: string, sensesData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  // We check if it is 100% completed by checking if all percentages are 0
  const isCompleted = Object.values(sensesData).every((val) => val === 0)

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: isCompleted,
        progress_data: sensesData
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Munkarat Upsert Error:", error)
    throw new Error(`Failed to update munkarat progress: ${error.message} - ${error.details || ''}`)
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
  revalidatePath('/student', 'layout')
}

export async function syncLibraryPortionRead(
  isQuranBook: boolean,
  bookId: string,
  targetAssignmentId?: string | null,
  customBookTitle?: string,
  currentPageNumber?: number,
  fileUrl?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  // 1. Always record independent book reading progress in book_progress table
  try {
    const { data: existingBookProg } = await supabase
      .from('book_progress')
      .select('completed_portions, current_page, total_pages')
      .eq('student_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle()

    const prevPortions = existingBookProg?.completed_portions || 0
    const newPortions = prevPortions + 1
    const newPage = currentPageNumber || (existingBookProg?.current_page ? existingBookProg.current_page + 1 : newPortions)

    await supabase
      .from('book_progress')
      .upsert(
        {
          student_id: user.id,
          book_id: bookId,
          book_title: customBookTitle || (isQuranBook ? 'The Holy Quran' : 'Library Book'),
          file_url: fileUrl || null,
          current_page: newPage,
          completed_portions: newPortions,
          last_read_at: new Date().toISOString()
        },
        { onConflict: 'student_id, book_id' }
      )
  } catch (bookProgErr) {
    console.warn("Could not sync to book_progress:", bookProgErr)
  }

  // 2. Fetch student's assignments to find matching reading/quran tasks across all their classes
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')

  if (!assignments || assignments.length === 0) {
    revalidatePath('/student/dashboard')
    revalidatePath('/student/library')
    revalidatePath('/student', 'layout')
    return
  }

  // Find all matching reading/quran assignments for this student
  const matchedList = assignments.filter(a => {
    const titleLower = (a.title || '').toLowerCase()
    const linked = a.content?.linkedBookId || a.linked_book_id
    if (isQuranBook) {
      return linked === 'quran' || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('surah') || titleLower.includes('juz') || titleLower.includes('ayah')
    }
    const bookTitleLower = (customBookTitle || '').toLowerCase()
    return linked === bookId || (bookTitleLower && bookTitleLower.length > 2 && titleLower.includes(bookTitleLower)) || (bookId === '7' && (titleLower.includes('tafsir') || titleLower.includes('anwar'))) || (bookId === '9' && (titleLower.includes('hadith') || titleLower.includes('riyad')))
  })

  // Determine target assignment:
  // 1. If exact targetAssignmentId was passed from URL query parameter (clicked from a specific card), use that exact assignment right away!
  let matched = targetAssignmentId ? assignments.find(a => a.id === targetAssignmentId) : null

  // 2. If no targetAssignmentId (or not found), check today's progress across all matched assignments
  if (!matched && matchedList.length > 0) {
    const matchedIds = matchedList.map(a => a.id)
    const { data: progressRecords } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', user.id)
      .in('assignment_id', matchedIds)
      .eq('tracking_date', todayDate)

    const progMap: Record<string, any> = {}
    progressRecords?.forEach(p => {
      progMap[p.assignment_id] = p
    })

    // Pick the first matching assignment where completed_value < target (or not completed)
    matched = matchedList.find(a => {
      const prog = progMap[a.id]
      const target = a.content?.target || a.target_count || 1
      const current = prog?.completed_value || 0
      return current < target && !prog?.is_completed
    })

    // If all matching assignments are already completed, fallback to the first matched assignment
    if (!matched) {
      matched = matchedList[0]
    }
  }

  if (!matched) {
    revalidatePath('/student/dashboard')
    revalidatePath('/student/library')
    revalidatePath('/student', 'layout')
    return
  }

  // Get current progress for today for our selected assignment
  const { data: existingProg } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('assignment_id', matched.id)
    .eq('tracking_date', todayDate)
    .maybeSingle()

  const currentVal = existingProg?.completed_value || 0
  const newVal = currentVal + 1
  const target = matched.content?.target || matched.target_count || 1
  const isCompleted = newVal >= target

  const prevData = existingProg?.progress_data || {}
  const newProgressData = {
    ...prevData,
    book_id: bookId,
    book_title: customBookTitle || matched.title,
    file_url: fileUrl || prevData.file_url,
    current_page: currentPageNumber || newVal,
    last_read_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: matched.id,
        tracking_date: todayDate,
        is_completed: isCompleted,
        completed_value: newVal,
        progress_data: newProgressData
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Library Sync Upsert Error:", error)
    throw new Error(`Failed to sync progress: ${error.message}`)
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
  revalidatePath('/student/library')
  revalidatePath('/student', 'layout')
}

export async function createPersonalHabit(formData: FormData) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const category = formData.get('category') as string
  const title = formData.get('title') as string
  const trackingType = formData.get('trackingType') as string
  
  // Build the dynamic JSONB content based on the tracking type
  let content: any = { category }
  if (trackingType === 'counter') {
    content = {
      ...content,
      target: parseInt(formData.get('target') as string) || 1,
      unit: (formData.get('unit') as string) || 'Times',
      linkedBookId: (formData.get('linkedBookId') as string) || null,
      externalUrl: (formData.get('externalUrl') as string) || null,
      trackingType: 'counter'
    }
  } else if (trackingType === 'percentage') {
    content = {
      ...content,
      target: 0,
      unit: '%',
      startValue: 100,
      trackingType: 'percentage'
    }
  } else {
    content.trackingType = trackingType
  }

  // Insert into assignments table with NULL class_id
  const { error } = await supabase
    .from('assignments')
    .insert([
      {
        class_id: null,
        student_id: user.id,
        category,
        title,
        tracking_type: trackingType === 'percentage' ? 'counter' : trackingType,
        content,
        is_daily: true,
      }
    ])

  if (error) {
    console.error("Personal Habit Insert Error:", error)
    throw new Error(`Failed to create personal habit: ${error.message}`)
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/student/assignments')
}
