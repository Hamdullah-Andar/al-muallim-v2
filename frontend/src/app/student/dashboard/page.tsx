import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import AcademicTaskCard from '@/components/ui/AcademicTaskCard'
import ZikrTrackerRow from '@/components/ui/ZikrTrackerRow'
import MankiratTracker from '@/components/ui/MankiratTracker'
import DailyPrayersCard from '@/components/ui/DailyPrayersCard'
import CreateHabitButton from '@/components/student/CreateHabitButton'
import { calculateStudentStats } from '@/utils/gamification'
import { getNextPrayer } from '@/utils/prayerTimes'

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
  const supabase = await createClient()

  // 0. Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Fetch Profile Data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch ONLY Personal assignments for Student (class_id IS NULL)
  const { data: classAssignments } = await supabase
    .from('assignments')
    .select('*')
    .is('class_id', null)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    
  let assignments: any[] = classAssignments || []

  // 3. Fetch TODAY'S Progress for Student
  const todayDateStr = new Date().toISOString().split('T')[0]
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('tracking_date', todayDateStr)

  const { data: allHistoryProgress } = await supabase
    .from('student_progress')
    .select('assignment_id, completed_value, tracking_date')
    .eq('student_id', user.id)

  const { data: bookProgressRows } = await supabase
    .from('book_progress')
    .select('*')
    .eq('student_id', user.id)

  // Fast progress map lookup for rendered cards
  const progressMap: Record<string, any> = {}
  assignments.forEach(a => {
    const todayProg = progress?.find(p => p.assignment_id === a.id) || {
      assignment_id: a.id,
      completed_value: 0,
      is_completed: false
    }

    const pastProg = allHistoryProgress?.filter(p => p.assignment_id === a.id && p.tracking_date < todayDateStr) || []
    const pastCompletedSum = pastProg.reduce((sum, p) => sum + (p.completed_value || 0), 0)
    
    const linkedId = a.content?.linkedBookId || a.linked_book_id
    const bookProg = linkedId ? bookProgressRows?.find(bp => bp.book_id === linkedId) : null
    const bookProgPage = bookProg ? (bookProg.completed_portions || bookProg.current_page || 0) : 0

    const startingPoint = Math.max(pastCompletedSum + 1, bookProgPage + 1, 1)

    progressMap[a.id] = {
      ...todayProg,
      starting_point: startingPoint,
      past_completed_sum: pastCompletedSum
    }
  })

  const prayerAssignment = assignments.find(a => a.category?.toLowerCase() === 'prayer')
  const prayerProgress = prayerAssignment ? progress?.find(p => p.assignment_id === prayerAssignment.id) : null

  const nonPrayerAssignments = assignments.filter(a => a.category?.toLowerCase() !== 'prayer')
  const leftAssignments = nonPrayerAssignments.filter((_, idx) => idx % 2 === 0)
  const rightAssignments = nonPrayerAssignments.filter((_, idx) => idx % 2 === 1)

  const renderAssignmentCard = (assignment: any) => {
    const tLower = (assignment.title || '').toLowerCase()
    const isFiveSense = assignment.category?.toLowerCase() === 'munkarat' && (
      tLower.includes('5-sense') || tLower.includes('five sense') || tLower.includes('avoid munkarat') || tLower === 'munkarat' || tLower.includes('senses')
    )

    if (isFiveSense) {
      return <MankiratTracker key={assignment.id} assignment={assignment} initialProgress={progressMap[assignment.id]} />
    }
    if (assignment.category?.toLowerCase() === 'zikr') {
      return <ZikrTrackerRow key={assignment.id} assignment={assignment} initialProgress={progressMap[assignment.id]} />
    }
    return <AcademicTaskCard key={assignment.id} assignment={assignment} initialProgress={progressMap[assignment.id]} />
  }

  // Calculate high-level progress stats for TODAY
  const totalTasks = assignments.length
  const assignmentIds = new Set(assignments.map(a => a.id))
  const completedTasksToday = progress?.filter(p => p.is_completed && assignmentIds.has(p.assignment_id)).length || 0
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasksToday / totalTasks) * 100)

  // Fetch Gamification Stats & Live Prayer Times
  const { currentStreak } = await calculateStudentStats(supabase, user.id, 'personal')
  const nextPrayer = await getNextPrayer()

  // 4. Fetch student's enrolled classes to match 3-Tier Book Access
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(is_active)')
    .eq('student_id', user.id)

  const studentClassIds = (enrollments || [])
    .filter((e: any) => e.classes?.is_active !== false)
    .map((e: any) => e.class_id)
    .filter(Boolean)

  // Fetch library books for personal reading goals (3-Tier Rule)
  let libraryBooks: any[] = []
  try {
    let q = supabase.from('books').select('*')
    if (studentClassIds.length > 0) {
      q = q.or(`and(class_id.is.null,uploaded_by.eq.${user.id}),class_id.in.(${studentClassIds.join(',')})`)
    } else {
      q = q.is('class_id', null).eq('uploaded_by', user.id)
    }
    const { data } = await q.order('created_at', { ascending: false })
    libraryBooks = data || []
  } catch (err) {}

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-in fade-in duration-500 font-sans">
      
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="STUDENT PORTAL / TAQWA SPACE"
        title={`Assalamu Alaikum, ${profile?.full_name?.split(" ")[0] || "Student"}`}
        subtitle="Welcome to your Personal Taqwa Space."
        actions={<CreateHabitButton books={libraryBooks || []} />}
      />

      {/* 2. Top Stats Row (Streak & Overall Completion) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Streak Card */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between border-l-8 border-l-[#0a6c4c]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#bdf3df] flex items-center justify-center text-primary-800">
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13.07 4.8 13.56 2.84C13.65 2.5 13.31 2.19 13.01 2.36C12.19 2.84 11.45 3.48 10.84 4.2C8.75 6.64 8.04 9.94 8.72 13C8.77 13.25 8.44 13.43 8.24 13.26C7.54 12.65 7.04 11.85 6.77 10.96C6.68 10.65 6.22 10.64 6.09 10.93C5.1 13.24 5.37 16.03 6.94 18.06C8.21 19.7 10.02 20.72 12.03 20.93C15.11 14.86 19.56 12.65 17.66 11.2V11.2Z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Daily Streak</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentStreak} Days</h3>
            </div>
          </div>
        </div>

        {/* Completion Card */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between border-l-8 border-l-sky-500">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             </div>
             <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Completion</p>
               <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</h3>
             </div>
           </div>
           
           <div className="w-32 sm:w-48 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#0a6c4c] rounded-full transition-all duration-1000 ease-out" 
               style={{ width: `${completionPercentage}%` }}
             ></div>
           </div>
        </div>
      </div>

      {/* 2.5 Daily Prayers Full Width Card */}
      {prayerAssignment && (
         <DailyPrayersCard 
           assignment={prayerAssignment} 
           initialProgress={prayerProgress} 
           nextPrayer={nextPrayer} 
         />
      )}

      {/* 3. The Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
           <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Assignments (Part 1)</h2>
             <span className="text-xs font-bold text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
           </div>
           
           {leftAssignments.length === 0 ? (
             <div className="bg-white dark:bg-black/40 p-8 rounded-3xl text-center border border-dashed border-black/10 dark:border-white/10">
               <p className="text-gray-500 text-sm">No tasks assigned for today. Click "+ Create Habit" to get started!</p>
             </div>
           ) : (
             <div className="space-y-4">
                {leftAssignments.map(renderAssignmentCard)}
             </div>
           )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
           <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Assignments (Part 2)</h2>
             <a href="/student/habits" className="text-xs font-bold text-primary-600 hover:underline">View All</a>
           </div>
           
           {rightAssignments.length === 0 ? (
             <div className="bg-white dark:bg-black/40 p-8 rounded-3xl text-center border border-dashed border-black/10 dark:border-white/10">
               <p className="text-gray-500 text-sm">No more tasks assigned for today.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {rightAssignments.map(renderAssignmentCard)}
             </div>
           )}
        </div>

      </div>

    </div>
  )
}
