import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LibraryClient from './LibraryClient'

export const dynamic = 'force-dynamic'

export default async function StudentLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 1. Fetch active classes the student has joined
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(is_active)')
    .eq('student_id', user.id)

  // Include classes where is_active is true OR null (not explicitly archived)
  const classIds = (enrollments || [])
    .filter((e: any) => e.classes?.is_active !== false)
    .map((e: any) => e.class_id)
    .filter(Boolean)

  // 2. Fetch books assigned to those classes or global books
  let books: any[] = []
  
  try {
    if (classIds.length > 0) {
      const { data } = await supabase
        .from('books')
        .select('*')
        .or(`class_id.is.null,class_id.in.(${classIds.join(',')})`)
        .order('created_at', { ascending: false })
      if (data) books = data
    } else {
      const { data } = await supabase
        .from('books')
        .select('*')
        .is('class_id', null)
        .order('created_at', { ascending: false })
      if (data) books = data
    }
  } catch (err) {
    console.error("Error fetching library books:", err)
  }

  // If books were fetched from database, map them into initial resources format
  const mappedResources = books.map((b: any) => ({
    id: b.id,
    title: b.title || 'Untitled Book',
    author: b.author || 'Class Instructor',
    category: b.category || 'Quran & Tafsir',
    pages: b.pages || 100,
    rating: 5.0,
    coverColor: 'from-[#193a2c] to-[#0c1f17]',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    badgeText: (b.category || 'CLASS RESOURCE').toUpperCase(),
    description: b.description || 'Assigned reading resource provided by your class instructor.',
    file_url: b.file_url
  }))

  // 3. Fetch student reading progress from book_progress and student_progress
  let bookProgress: any[] = []
  try {
    const { data: bp } = await supabase
      .from('book_progress')
      .select('*')
      .eq('student_id', user.id)
      .order('last_read_at', { ascending: false })
    if (bp) bookProgress = bp
  } catch (err) {
    // book_progress table might not exist if migration isn't run yet
  }

  const { data: studentProgress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <LibraryClient
      user={user}
      profile={profile}
      initialResources={mappedResources}
      bookProgress={bookProgress}
      studentProgress={studentProgress || []}
    />
  )
}
