import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClassDetailClient from '@/components/student/ClassDetailClient'

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  // Await the params (Next.js 15 standard)
  const { id } = await params
  
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch the class details and the teacher's name
  const { data: classData, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (error || !classData) {
    // If the class doesn't exist or isn't accessible, bounce back to classes page
    redirect('/student/classes')
  }

  // 3. Fetch all assignments for this class
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', id)

  // 4. Fetch the student's progress for these assignments
  const assignmentIds = assignments?.map(a => a.id) || []
  let studentProgress: any[] = []
  if (assignmentIds.length > 0) {
    const { data: progress } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', user.id)
      .in('assignment_id', assignmentIds)
    
    if (progress) {
      studentProgress = progress
    }
  }

  // 5. Calculate course journey aggregate progress
  // Simple calculation: what percentage of all tracked records are completed?
  let progressPercentage = 0
  if (studentProgress.length > 0) {
    const completed = studentProgress.filter(p => p.is_completed).length
    progressPercentage = Math.round((completed / studentProgress.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24">
      {/* We pass the class data and dynamic data to a client component for all the interactive UI */}
      <ClassDetailClient 
        classData={classData} 
        initialAssignments={assignments || []} 
        initialProgress={studentProgress}
        progressPercentage={progressPercentage}
        studentId={user.id}
      />
    </div>
  )
}
