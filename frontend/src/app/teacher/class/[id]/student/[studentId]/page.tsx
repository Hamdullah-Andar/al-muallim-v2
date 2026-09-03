import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getStudentActivityReport } from '../../actions'
import StudentReportClient from './StudentReportClient'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string; studentId: string }>
  searchParams: Promise<{ days?: string }>
}

export default async function StudentReportPage({ params, searchParams }: Props) {
  const { id: classId, studentId } = await params
  const { days: daysParam } = await searchParams

  const daysCount = daysParam === '30' ? 30 : 7

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  let reportData: any = null
  try {
    reportData = await getStudentActivityReport(classId, studentId, daysCount)
  } catch (err) {
    console.error('Failed to load report:', err)
    notFound()
  }

  return (
    <StudentReportClient
      classId={classId}
      studentId={studentId}
      initialDays={daysCount}
      report={reportData}
    />
  )
}
