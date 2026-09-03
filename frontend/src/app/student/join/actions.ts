'use server'

import { createClient } from '@/utils/supabase/server'

export async function joinClass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const classCode = formData.get('classCode') as string

  if (!classCode || classCode.length !== 6) {
    return { error: 'Invalid class code format. It must be exactly 6 characters.' }
  }

  // 1. Find the class by code
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, teacher_id, is_active, profiles!classes_teacher_id_fkey(full_name)')
    .eq('class_code', classCode.toUpperCase())
    .single()

  if (classError || !classData) {
    console.error('Error fetching class:', classError)
    return { error: 'Class not found. Please verify the code with your teacher.' }
  }

  // 2. Check if the class is archived / closed
  if (classData.is_active === false) {
    return { 
      error: 'CLASS_CLOSED',
      className: classData.name,
      teacher: (classData as any).profiles?.full_name || 'the instructor'
    }
  }

  // 3. Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('class_students')
    .select('id')
    .eq('class_id', classData.id)
    .eq('student_id', user.id)
    .single()

  if (!existingEnrollment) {
    // 4. Enroll the student safely
    const { error: enrollError } = await supabase
      .from('class_students')
      .insert([
        { class_id: classData.id, student_id: user.id }
      ])

    if (enrollError) {
      console.error('Enrollment error:', enrollError)
      return { error: 'A server error occurred while trying to join the class.' }
    }
  }

  // Success! Return the class data so the UI can show the success modal
  return { success: true, classData: { name: classData.name, teacher: (classData as any).profiles?.full_name || 'your instructor' } }
}
