import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import ClassDetailClient from './ClassDetailClient'

export const dynamic = 'force-dynamic'

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the class and ensure this teacher owns it
  const { data: classData } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (!classData || classData.teacher_id !== user?.id) {
    notFound()
  }

  // Fetch ALL students (active + removed) so teacher can see both sections
  const { data: students } = await supabase
    .from('class_students')
    .select(`
      student_id,
      is_active,
      profiles!student_id ( full_name )
    `)
    .eq('class_id', id)
    .order('is_active', { ascending: false }) // active first

  // Fetch active assignments for this class
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', id)
    .order('created_at', { ascending: false })

  // Fetch books assigned/uploaded to this class (graceful fallback if migrations/02_class_books.sql not run yet)
  let books: any[] = []
  try {
    const { data: classBooks, error: booksError } = await supabase
      .from('books')
      .select('*')
      .eq('class_id', id)
      .order('created_at', { ascending: false })
    if (!booksError && classBooks) {
      books = classBooks
    } else if (booksError) {
      const { data: fallbackBooks } = await supabase
        .from('books')
        .select('*')
        .eq('uploaded_by', user?.id)
        .order('created_at', { ascending: false })
      if (fallbackBooks) books = fallbackBooks
    }
  } catch (err) {
    const { data: fallbackBooks } = await supabase
      .from('books')
      .select('*')
      .eq('uploaded_by', user?.id)
      .order('created_at', { ascending: false })
    if (fallbackBooks) books = fallbackBooks
  }

  return (
    <ClassDetailClient
      classData={classData}
      students={students || []}
      assignments={assignments || []}
      books={books || []}
    />
  )
}
