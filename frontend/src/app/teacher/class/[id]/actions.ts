'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClassSchedule(
  classId: string,
  scheduleDays: string[],
  scheduleTime: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')

  const { error } = await supabase
    .from('classes')
    .update({
      schedule_days: scheduleDays,
      schedule_time: scheduleTime || null
    })
    .eq('id', classId)
    .eq('teacher_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/classes')
}

export async function removeStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')

  const { data: classRow } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!classRow) throw new Error('Not authorized')

  const { error } = await supabase
    .from('class_students')
    .update({ is_active: false })
    .eq('class_id', classId)
    .eq('student_id', studentId)

  if (error) throw new Error(error.message)
  revalidatePath(`/teacher/class/${classId}`)
}

export async function restoreStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')

  const { data: classRow } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!classRow) throw new Error('Not authorized')

  const { error } = await supabase
    .from('class_students')
    .update({ is_active: true })
    .eq('class_id', classId)
    .eq('student_id', studentId)

  if (error) throw new Error(error.message)
  revalidatePath(`/teacher/class/${classId}`)
}

export async function createAssignment(formData: FormData) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const classId = formData.get('classId') as string
  const category = formData.get('category') as string
  const title = formData.get('title') as string
  const trackingType = formData.get('trackingType') as string
  
  // Build the dynamic JSONB content based on the tracking type
  let content: any = { category } // Preserve original category name (e.g. 'Nawafil')
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

  // Insert into our newly migrated dynamic assignments table
  const { error } = await supabase
    .from('assignments')
    .insert([
      {
        class_id: classId,
        category,
        title,
        tracking_type: trackingType === 'percentage' ? 'counter' : trackingType,
        // target and unit are stored inside the content JSONB column (content.target, content.unit)
        // ZikrTrackerRow reads from assignment.content?.target to get the correct value
        content,
        is_daily: true // Automatically regenerates every day!
      }
    ])

  if (error) {
    console.error('Database Error:', error)
    throw new Error(`Database Error: ${error.message || JSON.stringify(error)}`)
  }

  // Refresh the page so the new assignment shows up instantly
  revalidatePath(`/teacher/class/${classId}`)
}

export async function uploadClassBook(formData: FormData) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const classId = formData.get('classId') as string
  const title = formData.get('title') as string
  const author = (formData.get('author') as string) || 'Class Instructor'
  const category = (formData.get('category') as string) || 'Quran & Tafsir'
  const pagesStr = formData.get('pages') as string
  const pages = pagesStr ? parseInt(pagesStr, 10) : 100
  const description = (formData.get('description') as string) || 'Class reading material provided by your instructor.'
  let fileUrl = (formData.get('fileUrl') as string) || ''

  const pdfFile = formData.get('pdfFile') as File | null
  if (pdfFile && pdfFile.size > 0 && pdfFile.name !== 'undefined') {
    const fileName = `class_${classId}/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('library-pdfs')
      .upload(fileName, pdfFile, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      // Fallback or re-throw if no URL
      if (!fileUrl) throw new Error(`Could not upload PDF: ${uploadError.message}`)
    } else if (uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('library-pdfs')
        .getPublicUrl(fileName)
      fileUrl = publicUrl
    }
  }

  if (!fileUrl) {
    fileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }

  const { error } = await supabase
    .from('books')
    .insert([
      {
        class_id: classId,
        title,
        author,
        category,
        pages,
        description,
        file_url: fileUrl,
        uploaded_by: user.id
      }
    ])

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to upload book: ' + error.message)
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/student/library')
}

export async function deleteClassBook(bookId: string, classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('uploaded_by', user.id)

  if (error) {
    console.error('Delete Book Error:', error)
    throw new Error('Failed to delete book')
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/student/library')
}

export async function toggleClassActiveStatus(classId: string, isActive: boolean) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  // Ensure the user owns this class
  const { data: classData } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .single()
    
  if (classData?.teacher_id !== user.id) {
    throw new Error("Not authorized to modify this class")
  }

  const { error } = await supabase
    .from('classes')
    .update({ is_active: isActive })
    .eq('id', classId)

  if (error) {
    console.error('Update Class Status Error:', error)
    throw new Error('Failed to update class status')
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/teacher/dashboard')
}

export async function deleteAssignment(assignmentId: string, classId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    console.error('Delete Assignment Error:', error)
    throw new Error('Failed to delete assignment')
  }

  if (classId) {
    revalidatePath(`/teacher/class/${classId}`)
  }
  revalidatePath('/teacher/assignments')
}

export async function getStudentActivityReport(
  classId: string,
  studentId: string,
  daysCount: number = 7
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  // Verify class teacher
  const { data: classData } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()
  if (!classData) throw new Error("Not authorized or class not found")

  // Fetch student profile
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', studentId)
    .single()

  // Generate date list (excluding today as daily activities might be in progress)
  const dates: string[] = []
  for (let i = daysCount; i >= 1; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  // Fetch class assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)

  const classAssignments = assignments || []
  const assignmentIds = classAssignments.map(a => a.id)

  let progressRecords: any[] = []
  if (assignmentIds.length > 0 && dates.length > 0) {
    const { data: records } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds)
      .in('tracking_date', dates)

    progressRecords = records || []
  }

  // Progress Map: key = `${assignment_id}_${tracking_date}`
  const progressMap = new Map<string, any>()
  progressRecords.forEach(r => {
    progressMap.set(`${r.assignment_id}_${r.tracking_date}`, r)
  })

  // 1. Overall stats
  const totalPossibleHabitEntries = classAssignments.length * dates.length
  let completedHabitEntries = 0
  
  // Calculate per date details & daily trend
  const dailyTrend = dates.map(date => {
    let dayCompleted = 0
    classAssignments.forEach(a => {
      const rec = progressMap.get(`${a.id}_${date}`)
      if (rec?.is_completed) {
        dayCompleted++
        completedHabitEntries++
      }
    })

    const dateObj = new Date(date + 'T00:00:00')
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const total = classAssignments.length
    const pct = total > 0 ? Math.round((dayCompleted / total) * 100) : 0

    return {
      date,
      formattedDate,
      dayName,
      completed: dayCompleted,
      total,
      percentage: pct
    }
  })

  // Calculate Active Days (days with at least 1 habit completed)
  const activeDaysCount = dailyTrend.filter(d => d.completed > 0).length

  // Calculate Streak (consecutive active days backwards from yesterday)
  let streak = 0
  for (let i = dailyTrend.length - 1; i >= 0; i--) {
    if (dailyTrend[i].completed > 0) {
      streak++
    } else {
      break
    }
  }

  // 2. Category Breakdown
  const categoryMap = new Map<string, {
    category: string
    completedCount: number
    totalTarget: number
    totalValueSum: number
    unit: string
    averagePercentage?: number
  }>()

  classAssignments.forEach(a => {
    const cat = a.category || 'General'
    const unit = a.content?.unit || a.unit || (cat === 'Zikr' ? 'Times' : cat === 'Sport' ? 'Minutes' : '')
    const targetPerAssignment = cat === 'Prayer' ? 5 * dates.length : dates.length
    
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        category: cat,
        completedCount: 0,
        totalTarget: 0,
        totalValueSum: 0,
        unit
      })
    }

    const catData = categoryMap.get(cat)!
    catData.totalTarget += targetPerAssignment

    dates.forEach(date => {
      const rec = progressMap.get(`${a.id}_${date}`)
      if (rec?.is_completed) {
        catData.completedCount++
      }
      if (rec?.completed_value) {
        catData.totalValueSum += Number(rec.completed_value) || 0
      }
    })
  })

  const categoryBreakdown = Array.from(categoryMap.values()).map(c => {
    let percentage = c.totalTarget > 0 ? Math.round((c.completedCount / c.totalTarget) * 100) : 0
    if (c.category === 'Prayer') {
      percentage = c.totalTarget > 0 ? Math.round((c.totalValueSum / c.totalTarget) * 100) : 0
    }
    return {
      ...c,
      percentage
    }
  })

  // 3. Habit-by-Habit Breakdown & Best/Worst Habits
  const habitBreakdown = classAssignments.map(a => {
    let completedCount = 0
    let valueSum = 0
    dates.forEach(date => {
      const rec = progressMap.get(`${a.id}_${date}`)
      if (rec?.is_completed) completedCount++
      if (rec?.completed_value) valueSum += Number(rec.completed_value) || 0
    })

    const isPrayer = a.category === 'Prayer'
    const isPct = a.tracking_type === 'percentage'
    const targetVal = isPrayer ? 5 : (a.content?.target ?? a.target_count ?? 0)
    const unit = isPrayer ? 'Prayers' : (a.content?.unit || a.unit || '')
    const totalDays = isPrayer ? (5 * dates.length) : dates.length
    const percentage = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0

    return {
      id: a.id,
      title: a.title,
      category: a.category,
      trackingType: a.tracking_type,
      targetVal,
      unit,
      completedDays: completedCount,
      totalDays,
      percentage,
      totalValueSum: valueSum
    }
  })

  // Sort habits by percentage to identify top and lowest
  const sortedHabits = [...habitBreakdown].sort((a, b) => b.percentage - a.percentage)
  const topHabit = sortedHabits[0] || null
  const lowestHabit = sortedHabits[sortedHabits.length - 1] || null

  const overallPercentage = totalPossibleHabitEntries > 0
    ? Math.round((completedHabitEntries / totalPossibleHabitEntries) * 100)
    : 0

  // Fetch attendance records for this student in range
  let attendanceRecords: any[] = []
  if (dates.length > 0) {
    const { data: attData } = await supabase
      .from('class_attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .in('attendance_date', dates)

    attendanceRecords = attData || []
  }

  const presentCount = attendanceRecords.filter(a => a.status === 'present').length
  const lateCount = attendanceRecords.filter(a => a.status === 'late').length
  const absentCount = attendanceRecords.filter(a => a.status === 'absent').length
  const excusedCount = attendanceRecords.filter(a => a.status === 'excused').length
  const totalMarkedDays = attendanceRecords.length
  const attendanceRate = daysCount > 0 ? Math.round(((presentCount + (lateCount * 0.5)) / daysCount) * 100) : 0

  return {
    studentName: studentProfile?.full_name || 'Student',
    studentEmail: studentProfile?.email || '',
    className: classData.name,
    daysCount,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    overallPercentage,
    completedHabitEntries,
    totalPossibleHabitEntries,
    activeDaysCount,
    totalDays: dates.length,
    streak,
    categoryBreakdown,
    habitBreakdown,
    dailyTrend,
    topHabit,
    lowestHabit,
    attendanceStats: {
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      totalMarkedDays,
      attendanceRate
    }
  }
}

// ----------------------------------------------------------------------
// ATTENDANCE SERVER ACTIONS
// ----------------------------------------------------------------------

export async function saveClassAttendance(
  classId: string,
  attendanceDate: string,
  records: { studentId: string; status: string; notes?: string }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  // Verify class teacher
  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()
  if (!classData) throw new Error("Not authorized or class not found")

  if (!records || records.length === 0) return { success: true, count: 0 }

  const rowsToUpsert = records.map(r => ({
    class_id: classId,
    student_id: r.studentId,
    attendance_date: attendanceDate,
    status: r.status,
    notes: r.notes || null,
    marked_by: user.id,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('class_attendance')
    .upsert(rowsToUpsert, { onConflict: 'class_id, student_id, attendance_date' })

  if (error) {
    console.error("Failed to save class attendance:", error)
    throw new Error(error.message || "Failed to save attendance")
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/teacher/analytics')
  return { success: true, count: rowsToUpsert.length }
}

export async function getClassAttendanceForDate(classId: string, attendanceDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const { data } = await supabase
    .from('class_attendance')
    .select('*')
    .eq('class_id', classId)
    .eq('attendance_date', attendanceDate)

  return data || []
}

export async function getClassAttendanceHistory(classId: string, daysCount: number = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysCount)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data } = await supabase
    .from('class_attendance')
    .select('*')
    .eq('class_id', classId)
    .gte('attendance_date', startDateStr)
    .order('attendance_date', { ascending: false })

  return data || []
}
