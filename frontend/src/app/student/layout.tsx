import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import StudentLayoutClient from '@/components/student/StudentLayoutClient'

export default async function StudentLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') {
    redirect('/teacher/dashboard')
  }

  // Check if student is enrolled in any active classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes!inner(is_active)')
    .eq('student_id', user.id)
    .eq('classes.is_active', true)
    .limit(1)

  const hasClasses = Boolean(enrollments && enrollments.length > 0)

  return (
    <StudentLayoutClient
      profileName={profile?.full_name || 'Student'}
      userEmail={profile?.email || user.email || ''}
      hasClasses={hasClasses}
      modal={modal}
    >
      {children}
    </StudentLayoutClient>
  )
}
