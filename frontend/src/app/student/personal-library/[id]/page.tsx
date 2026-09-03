import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookDetailClient from './BookDetailClient'

export const dynamic = 'force-dynamic'

export default async function StudentBookDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }> | { id: string }
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const resolvedParams = 'then' in params ? await params : params
  const { id } = resolvedParams

  const resolvedSearchParams = searchParams ? ('then' in searchParams ? await searchParams : searchParams) : {}
  const assignmentId = typeof resolvedSearchParams?.assignmentId === 'string' ? resolvedSearchParams.assignmentId : null
  const startRoba = typeof resolvedSearchParams?.startRoba === 'string' && !isNaN(Number(resolvedSearchParams.startRoba)) ? Number(resolvedSearchParams.startRoba) : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Try fetching dynamic book if stored in books table
  let initialBookData = null
  try {
    const { data: dbBook } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()
    if (dbBook) {
      initialBookData = dbBook
    }
  } catch (err) {
    console.warn('Could not fetch book from books table by ID:', err)
  }

  let initialLoggedPortionsToday = 0
  if (assignmentId) {
    const todayStr = new Date().toISOString().split('T')[0]
    try {
      const { data: prog } = await supabase
        .from('student_progress')
        .select('completed_value')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .eq('tracking_date', todayStr)
        .single()
        
      if (prog) {
        initialLoggedPortionsToday = prog.completed_value || 0
      }
    } catch (err) {
      console.warn('Could not fetch today progress:', err)
    }
  } else {
    // If no assignment ID, check book_progress table just to see if it was touched today?
    // The previous implementation didn't have independent daily tracking without an assignment.
    // For now, we will leave it as 0, or just rely on the assignments.
  }

  return (
    <BookDetailClient
      bookId={id}
      user={user}
      profile={profile}
      initialAssignmentId={assignmentId}
      initialStartRoba={startRoba}
      initialBookData={initialBookData}
      initialLoggedPortionsToday={initialLoggedPortionsToday}
    />
  )
}
