import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LibraryClient from './LibraryClient'

export const dynamic = 'force-dynamic'

export default async function TeacherLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch teacher profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch teacher's active classes
  const { data: teacherClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id)

  const teacherClassIds = teacherClasses?.map(c => c.id) || []

  // 3-TIER RULE: Fetch Personal Books (uploaded_by = user.id AND class_id IS NULL) + Teacher's Class Books
  let books: any[] = []
  
  try {
    let query = supabase.from('books').select('*')
    if (teacherClassIds.length > 0) {
      query = query.or(`and(class_id.is.null,uploaded_by.eq.${user.id}),class_id.in.(${teacherClassIds.join(',')})`)
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
