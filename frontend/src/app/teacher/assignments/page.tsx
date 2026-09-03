import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AssignmentsListClient from './AssignmentsListClient'

export const dynamic = 'force-dynamic'

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all classes owned by teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, is_active')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const classIds = classes?.map(c => c.id) || []

  // Fetch all assignments across those classes
  let assignments: any[] = []
  if (classIds.length > 0) {
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
        created_at,
        classes (
          name
        )
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })

    assignments = fetchedAssignments || []
  }

  // Fetch all books for reading source select
  let books: any[] = []
  if (classIds.length > 0) {
    const { data: fetchedBooks } = await supabase
      .from('books')
      .select('id, title, category, class_id')
      .in('class_id', classIds)
    
    books = fetchedBooks || []
  }

  return (
    <AssignmentsListClient 
      initialAssignments={assignments}
      classes={classes || []}
      books={books}
    />
  )
}
