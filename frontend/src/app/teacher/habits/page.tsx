import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AssignmentsClient from './AssignmentsClient'

export const dynamic = 'force-dynamic'

export default async function TeacherHabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }



  // 1. Fetch Profile Data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 2. Fetch Teacher's Personal Habits (assignments with class_id null)
  const { data: teacherAssignments } = await supabase
    .from('assignments')
    .select('*')
    .is('class_id', null)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    
  let assignments: any[] = teacherAssignments || []

  // 3. Fetch progress for TODAY + all historical progress
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
      classMap={{}}
      initialProgress={enrichedProgress}
      todayDateStr={todayDateStr}
    />
  )
}
