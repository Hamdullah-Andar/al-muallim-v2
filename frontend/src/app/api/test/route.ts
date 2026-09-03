import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, teacher_id, profiles(full_name)')
    .eq('class_code', '100543')
    .single()

  return NextResponse.json({ classData, classError })
}
