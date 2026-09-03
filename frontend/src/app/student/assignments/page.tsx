import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AssignmentsClient from './AssignmentsClient'

export const dynamic = 'force-dynamic'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // 1. Fetch Profile Data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 2. Fetch Enrolled Classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(id, name, description, teacher_id)')
    .eq('student_id', user.id)
    .eq('is_active', true)

  const classIds = enrollments?.map(e => e.class_id) || []
  
  // Create a map of classes by ID for quick badge display
  const classMap: Record<string, { id: string; name: string; description: string }> = {}
  enrollments?.forEach((e: any) => {
    if (e.classes) {
      classMap[e.class_id] = {
        id: e.class_id,
        name: e.classes.name || 'Class',
        description: e.classes.description || ''
      }
    }
  })

  // 3. Fetch all assignments across enrolled classes
  let assignments: any[] = []
  if (classIds.length > 0) {
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('*')
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
    assignments = classAssignments || []
  }

  // 4. Fetch progress for TODAY + all historical progress and book progress for starting point calculation
  const todayDateStr = new Date().toISOString().split('T')[0]
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('tracking_date', todayDateStr)

  const { data: allHistoryProgress } = await supabase
    .from('student_progress')
    .select('assignment_id, completed_value, tracking_date')
    .eq('student_id', user.id)

  const { data: bookProgressRows } = await supabase
    .from('book_progress')
    .select('*')
    .eq('student_id', user.id)

  const enrichedProgress = assignments?.map(a => {
    const todayProg = progress?.find(p => p.assignment_id === a.id) || {
      assignment_id: a.id,
      completed_value: 0,
      is_completed: false
    }

    const pastProg = allHistoryProgress?.filter(p => p.assignment_id === a.id && p.tracking_date < todayDateStr) || []
    const pastCompletedSum = pastProg.reduce((sum, p) => sum + (p.completed_value || 0), 0)
    
    const linkedId = a.content?.linkedBookId || a.linked_book_id
    const bookProg = linkedId ? bookProgressRows?.find(bp => bp.book_id === linkedId) : null
    const bookProgPage = bookProg ? (bookProg.completed_portions || bookProg.current_page || 0) : 0

    const startingPoint = Math.max(pastCompletedSum + 1, bookProgPage + 1, 1)

    return {
      ...todayProg,
      starting_point: startingPoint,
      past_completed_sum: pastCompletedSum
    }
  }) || []

  return (
    <AssignmentsClient
      user={user}
      profile={profile}
      assignments={assignments}
      classMap={classMap}
      initialProgress={enrichedProgress}
      todayDateStr={todayDateStr}
    />
  )
}
