import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function TeacherAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch teacher's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch all classes owned by teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, is_active, class_code, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const activeClasses = (classes || []).filter(c => c.is_active !== false)
  const activeClassIds = activeClasses.map(c => c.id)

  // 1. Fetch enrolled students with profile information
  let enrollments: any[] = []
  if (activeClassIds.length > 0) {
    const { data: classStudents } = await supabase
      .from('class_students')
      .select(`
        class_id,
        student_id,
        joined_at,
        profiles!student_id ( id, full_name, email )
      `)
      .in('class_id', activeClassIds)

    enrollments = classStudents || []
  }

  // 2. Fetch assignments across active classes
  let assignments: any[] = []
  if (activeClassIds.length > 0) {
    const { data: fetchedAssignments } = await supabase
      .from('assignments')
      .select(`
        id,
        class_id,
        category,
        title,
        tracking_type,
        content,
        is_daily,
        classes ( name )
      `)
      .in('class_id', activeClassIds)

    assignments = fetchedAssignments || []
  }

  // 3. Fetch progress logs for the last 30 days
  let progressRecords: any[] = []
  const assignmentIds = assignments.map(a => a.id)
  
  if (assignmentIds.length > 0) {
    // 30 days ago date string
    const d30 = new Date()
    d30.setDate(d30.getDate() - 30)
    const startDateStr = d30.toISOString().split('T')[0]

    const { data: fetchedProgress } = await supabase
      .from('student_progress')
      .select('assignment_id, student_id, tracking_date, completed_value, is_completed, updated_at')
      .in('assignment_id', assignmentIds)
      .gte('tracking_date', startDateStr)

    progressRecords = fetchedProgress || []
  }

  // 4. Fetch attendance records for the last 30 days
  let attendanceRecords: any[] = []
  if (activeClassIds.length > 0) {
    const d30 = new Date()
    d30.setDate(d30.getDate() - 30)
    const startDateStr = d30.toISOString().split('T')[0]

    try {
      const { data: fetchedAtt } = await supabase
        .from('class_attendance')
        .select('class_id, student_id, attendance_date, status')
        .in('class_id', activeClassIds)
        .gte('attendance_date', startDateStr)

      attendanceRecords = fetchedAtt || []
    } catch (err) {
      console.warn("Could not fetch class_attendance:", err)
    }
  }

  // Map enrolled students to clean array
  const formattedStudents = enrollments.map((e: any) => {
    const classObj = activeClasses.find(c => c.id === e.class_id)
    return {
      studentId: e.student_id,
      fullName: e.profiles?.full_name || 'Student',
      email: e.profiles?.email || '',
      classId: e.class_id,
      className: classObj?.name || 'Class',
      joinedAt: e.joined_at
    }
  })

  // Map assignments to clean array
  const formattedAssignments = assignments.map((a: any) => ({
    id: a.id,
    classId: a.class_id,
    className: a.classes?.name || 'Class',
    category: a.category || 'General',
    title: a.title,
    trackingType: a.tracking_type,
    isDaily: a.is_daily !== false
  }))

  return (
    <AnalyticsClient
      teacherName={profile?.full_name || 'Teacher'}
      classes={activeClasses.map(c => ({ id: c.id, name: c.name, code: c.class_code }))}
      students={formattedStudents}
      assignments={formattedAssignments}
      progressRecords={progressRecords}
      attendanceRecords={attendanceRecords}
    />
  )
}
