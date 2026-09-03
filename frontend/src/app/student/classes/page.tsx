import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClassesClient from './ClassesClient'

export const dynamic = 'force-dynamic'

export default async function JoinedClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch the user's profile to get name and id for the header
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 1. Fetch Enrolled Classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(name, description, teacher_id, is_active)')
    .eq('student_id', user.id)
    .eq('is_active', true)

  const rawClasses = enrollments || []
  const classIds = rawClasses.map((e: any) => e.class_id).filter(Boolean)
  
  // 2. Fetch Teacher Profiles
  const teacherIds = Array.from(new Set(rawClasses.map((e: any) => e.classes?.teacher_id).filter(Boolean)))
  
  let teacherMap: Record<string, string> = {}
  if (teacherIds.length > 0) {
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds as string[])
      
    teacherMap = (teachers || []).reduce((acc: Record<string, string>, t: any) => {
      acc[t.id] = t.full_name || 'Instructor'
      return acc
    }, {})
  }

  // 3. Compute real weekly completion rates per class (this week vs last week)
  // Window: yesterday back to 7 days ago (exclude today - class is still in morning)
  // Prior:  days 8-14 ago
  const buildDateRange = (startDaysAgo: number, endDaysAgo: number): string[] => {
    const dates: string[] = []
    for (let i = startDaysAgo; i >= endDaysAgo; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const thisWeekDates = buildDateRange(7, 1)   // yesterday → 7 days ago
  const lastWeekDates = buildDateRange(14, 8)  // 8 days ago → 14 days ago
  const allDates = [...thisWeekDates, ...lastWeekDates]

  // Map classId → { thisWeek: number, lastWeek: number } completion counts
  const classWeekMap: Record<string, { thisWeek: number; lastWeek: number; total: number }> = {}

  if (classIds.length > 0) {
    // Fetch all assignments for enrolled classes
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, class_id')
      .in('class_id', classIds)
      .eq('is_daily', true)

    const assignmentIds = (assignments || []).map((a: any) => a.id)
    // Build assignment → class mapping
    const assignmentClassMap: Record<string, string> = {}
    ;(assignments || []).forEach((a: any) => {
      assignmentClassMap[a.id] = a.class_id
    })

    // Count assignments per class (denominator for completion %)
    const assignmentsPerClass: Record<string, number> = {}
    ;(assignments || []).forEach((a: any) => {
      assignmentsPerClass[a.class_id] = (assignmentsPerClass[a.class_id] || 0) + 1
    })

    if (assignmentIds.length > 0) {
      // Single query for both weeks
      const { data: progressRecords } = await supabase
        .from('student_progress')
        .select('assignment_id, tracking_date, is_completed')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds)
        .in('tracking_date', allDates)
        .eq('is_completed', true)

      // Tally completions per class per week
      ;(progressRecords || []).forEach((p: any) => {
        const classId = assignmentClassMap[p.assignment_id]
        if (!classId) return
        if (!classWeekMap[classId]) classWeekMap[classId] = { thisWeek: 0, lastWeek: 0, total: 0 }
        if (thisWeekDates.includes(p.tracking_date)) classWeekMap[classId].thisWeek++
        if (lastWeekDates.includes(p.tracking_date)) classWeekMap[classId].lastWeek++
      })

      // Store total possible per class for % calculation (assignments × 7 days)
      classIds.forEach((classId: string) => {
        if (!classWeekMap[classId]) classWeekMap[classId] = { thisWeek: 0, lastWeek: 0, total: 0 }
        classWeekMap[classId].total = (assignmentsPerClass[classId] || 0) * 7
      })
    }
  }

  // 4. Prepare the enriched classes array
  const mockCategories = ["Quranic Studies", "Language", "History", "Spirituality"]
  const mockImages = [
    "https://placehold.co/600x400/092B2B/FFF?text=Quranic+Studies",
    "https://placehold.co/600x400/0f4c4c/FFF?text=Language",
    "https://placehold.co/600x400/156969/FFF?text=History",
    "https://placehold.co/600x400/1e8989/FFF?text=Spirituality"
  ]

  const mappedClasses = rawClasses.map((e: any, index: number) => {
    const classId = e.class_id
    const weekData = classWeekMap[classId]
    const thisWeekPct = weekData && weekData.total > 0
      ? Math.round((weekData.thisWeek / weekData.total) * 100)
      : 0
    const lastWeekPct = weekData && weekData.total > 0
      ? Math.round((weekData.lastWeek / weekData.total) * 100)
      : 0

    // Trend: 'up', 'down', or 'same'
    const trend: 'up' | 'down' | 'same' =
      thisWeekPct > lastWeekPct ? 'up' :
      thisWeekPct < lastWeekPct ? 'down' : 'same'

    return {
      id: classId,
      name: e.classes?.name || 'Unknown Class',
      description: e.classes?.description || '',
      teacherId: e.classes?.teacher_id,
      teacherName: teacherMap[e.classes?.teacher_id] || 'Dr. Instructor',
      category: mockCategories[index % mockCategories.length],
      imageUrl: mockImages[index % mockImages.length],
      progress: thisWeekPct,     // this week's habit completion %
      lastWeekProgress: lastWeekPct,
      trend,
      isActive: e.classes?.is_active !== false
    }
  })

  return (
    <ClassesClient 
      classes={mappedClasses}
      userId={user.id}
      userName={profile?.full_name || 'Student'}
    />
  )
}
