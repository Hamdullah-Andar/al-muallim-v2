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

  const classIds = (enrollments || [])
    .filter((e: any) => e.classes?.is_active !== false)
    .map((e: any) => e.class_id)
    .filter(Boolean)

  // 3-TIER RULE: Fetch Personal Books (uploaded_by = user.id AND class_id IS NULL) + Enrolled Class Books
  let books: any[] = []
  
  try {
    let query = supabase.from('books').select('*')
    if (classIds.length > 0) {
      query = query.or(`and(class_id.is.null,uploaded_by.eq.${user.id}),class_id.in.(${classIds.join(',')})`)
    } else {
      query = query.is('class_id', null).eq('uploaded_by', user.id)
    }
    const { data } = await query.order('created_at', { ascending: false })
    books = data || []
  } catch (err) {
    console.error("Library fetch error:", err)
  }

  // Map into initial resources format
  const mappedResources = books.map((b: any) => ({
    id: b.id,
    title: b.title || 'Untitled Book',
    author: b.author || 'Class Instructor',
    category: b.category || 'Quran & Tafsir',
    pages: b.pages || 100,
    file_url: b.file_url || b.fileUrl || '',
    description: b.description || '',
    rating: 5.0,
    reviewsCount: '12',
    type: 'pdf',
    badge: b.class_id ? 'Class Resource' : 'Personal Book'
  }))

  return (
    <LibraryClient
      user={user}
      profile={profile}
      initialResources={mappedResources}
    />
  )
}
