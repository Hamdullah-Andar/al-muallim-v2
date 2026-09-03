import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClassesListClient from './ClassesListClient'

export const dynamic = 'force-dynamic'

export default async function TeacherClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the teacher's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch all classes owned by teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const classIds = classes?.map(c => c.id) || []

  // 1. Fetch student count map
  const studentCountMap: Record<string, number> = {}
  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('class_id')
      .in('class_id', classIds)
      .eq('is_active', true)
    
    enrollments?.forEach((e: any) => {
      studentCountMap[e.class_id] = (studentCountMap[e.class_id] || 0) + 1
    })
  }

  // 2. Fetch daily assignments count map
  const dailyAssignmentCountMap: Record<string, number> = {}
  if (classIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('class_id')
      .in('class_id', classIds)
      .eq('is_daily', true)
    
    assignments?.forEach((a: any) => {
      dailyAssignmentCountMap[a.class_id] = (dailyAssignmentCountMap[a.class_id] || 0) + 1
    })
  }

  // Map to final client structure
  const mappedClasses = (classes || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    classCode: c.class_code,
    isActive: c.is_active !== false,
    studentCount: studentCountMap[c.id] || 0,
    dailyAssignmentsCount: dailyAssignmentCountMap[c.id] || 0,
    createdAt: c.created_at,
    schedule_days: c.schedule_days || [],
    schedule_time: c.schedule_time || null
  }))

  return (
    <ClassesListClient 
      classes={mappedClasses}
      teacherName={profile?.full_name || 'Teacher'}
    />
  )
}
