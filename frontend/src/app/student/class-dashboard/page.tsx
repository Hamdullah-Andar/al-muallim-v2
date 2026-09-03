import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AssignmentCard from '@/components/student/AssignmentCard'
import ZikrTrackerRow from '@/components/ui/ZikrTrackerRow'
import AcademicTaskCard from '@/components/ui/AcademicTaskCard'
import MankiratTracker from '@/components/ui/MankiratTracker'
import DailyPrayersCard from '@/components/ui/DailyPrayersCard'
import { calculateStudentStats } from '@/utils/gamification'
import { getNextPrayer } from '@/utils/prayerTimes'

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch Profile Data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 2. Fetch the active classes this student is enrolled in
  const { data: enrollments } = await supabase.from('class_students').select('class_id, classes(name, teacher_id, is_active)').eq('student_id', user.id).eq('is_active', true)
  
  // Filter out any explicitly archived classes (is_active === false)
  const activeEnrollments = enrollments?.filter((e: any) => e.classes && e.classes.is_active !== false) || []
  
  const classIds = activeEnrollments.map((e: any) => e.class_id)
  
  // Also keep full class objects for the "Joined Classes" section
  const joinedClasses = activeEnrollments.map((e: any) => ({
    id: e.class_id,
    name: e.classes.name,
    teacherId: e.classes.teacher_id
  }))

  // 3. Fetch all active assignments for those classes
  let assignments: any[] = []
  if (classIds.length > 0) {
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('*, classes(name)')
      .in('class_id', classIds)
      .eq('is_daily', true)
      .order('created_at', { ascending: true })
    assignments = classAssignments || []
  }

  // 4. Fetch the student's progress for TODAY + all historical progress & book_progress for starting point calculation
  const todayDate = new Date().toISOString().split('T')[0]
  
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('tracking_date', todayDate)

  const { data: allHistoryProgress } = await supabase
    .from('student_progress')
    .select('assignment_id, completed_value, tracking_date')
    .eq('student_id', user.id)

  const { data: bookProgressRows } = await supabase
    .from('book_progress')
    .select('*')
    .eq('student_id', user.id)

  // Create a quick lookup map + attach computed starting point
  const progressMap: Record<string, any> = {}
  assignments?.forEach(a => {
    const todayProg = progress?.find(p => p.assignment_id === a.id) || {
      assignment_id: a.id,
      completed_value: 0,
      is_completed: false
    }

    const pastProg = allHistoryProgress?.filter(p => p.assignment_id === a.id && p.tracking_date < todayDate) || []
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

  // 5. Group assignments cleanly by category
  const groupedAssignments = assignments.reduce((acc: any, assignment) => {
    if (!acc[assignment.category]) acc[assignment.category] = []
    acc[assignment.category].push(assignment)
    return acc
  }, {})
  
  const categories = Object.keys(groupedAssignments).sort()

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

  // Fetch ALL-TIME Gamification Stats & Live Prayer Times
  const { currentStreak, completedTasks } = await calculateStudentStats(supabase, user.id, 'class');
  const nextPrayer = await getNextPrayer();

  // Fetch library books for personal reading goals
  const { data: libraryBooks } = await supabase.from('books').select('*').order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-in fade-in duration-500 font-sans">
      
      {/* 1. Header Row */}
      <PageHeader
        breadcrumb="ACADEMY CLASSES / DASHBOARD"
        title={`Assalamu Alaikum, ${profile?.full_name?.split(" ")[0] || "Student"}`}
        subtitle="Welcome to your Academy Classes Space."
      />
      {/* 2. Top Stats Row (Streak & Overall Completion) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Streak Card */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between border-l-8 border-l-[#0a6c4c]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#bdf3df] flex items-center justify-center text-primary-800">
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13.07 4.8 13.56 2.84C13.65 2.5 13.31 2.19 13.01 2.36C12.19 2.84 11.45 3.48 10.84 4.2C8.75 6.64 8.04 9.94 8.72 13C8.77 13.25 8.44 13.43 8.24 13.26C7.54 12.65 7.04 11.85 6.77 10.96C6.68 10.65 6.22 10.64 6.09 10.93C5.1 13.24 5.37 16.03 6.94 18.06C8.21 19.7 10.02 20.72 12.03 20.93C15.11 21.25 18.23 19.52 19.5 16.66C20.31 14.86 19.56 12.65 17.66 11.2V11.2Z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Daily Streak</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentStreak} Days</h3>
            </div>
          </div>
          {completedTasksToday > 0 && (
            <div className="text-sm font-bold text-primary-800">+{completedTasksToday} today</div>
          )}
        </div>

        {/* Overall Completion Card */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between border-l-8 border-l-[#0a6c4c]">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             </div>
             <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Completion</p>
               <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</h3>
             </div>
           </div>
           
           {/* Custom Pill Progress Bar matching the screenshot */}
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

      {/* 3. The Two Columns (Alternating Assignments by Creation Order) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* LEFT COLUMN: 1st, 3rd, 5th... assignments */}
        <div className="space-y-6">
           <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Assignments (Part 1)</h2>
             <span className="text-xs font-bold text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
           </div>
           
           {leftAssignments.length === 0 ? (
             <div className="bg-white dark:bg-black/40 p-8 rounded-3xl text-center border border-dashed border-black/10 dark:border-white/10">
               <p className="text-gray-500 text-sm">No tasks assigned for today.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {leftAssignments.map(renderAssignmentCard)}
             </div>
           )}
        </div>

        {/* RIGHT COLUMN: 2nd, 4th, 6th... assignments */}
        <div className="space-y-6">
           <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Assignments (Part 2)</h2>
             <Link href="/student/assignments" className="text-xs font-bold text-primary-600 hover:underline">View All</Link>
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
      
      {/* 4. Joined Classes Redesign */}
      <div>
         <div className="flex justify-between items-end mb-6">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">Joined Classes</h2>
         </div>
         
         {joinedClasses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/student/join" className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[24px] p-8 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50 transition-all h-[320px]">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Browse More Classes</h3>
              </Link>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {joinedClasses.map((c: any, index: number) => {
                 // Alternate images for the aesthetic
                 const imageUrl = index % 2 === 0 
                   ? "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?auto=format&fit=crop&q=80&w=800" // Quran/Islamic geometric
                   : "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=800" // Architecture/Mosque
                   
                 return (
                   <div key={c.id} className="bg-white dark:bg-black/40 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all h-[320px]">
                     {/* Top Image Half */}
                     <div className="h-40 relative overflow-hidden bg-gray-100">
                        <img src={imageUrl} alt="Class cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                           <span className="bg-[#bdf3df] text-[#0a6c4c] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Intermediate</span>
                        </div>
                     </div>
                     
                     {/* Bottom Details Half */}
                     <div className="p-6 flex-grow flex flex-col justify-between">
                       <div>
                         <h3 className="font-bold text-lg mb-1 group-hover:text-primary-600 transition-colors">{c.name}</h3>
                         <p className="text-xs text-gray-500 line-clamp-2">Deep dive into the linguistics and context of the Surah.</p>
                       </div>
                       
                       <div className="mt-4 flex justify-between items-center">
                          <div className="flex -space-x-2">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.id}1`} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white dark:border-black" alt="Student" />
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.id}2`} className="w-8 h-8 rounded-full bg-green-100 border-2 border-white dark:border-black" alt="Student" />
                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-black flex items-center justify-center text-[8px] font-bold text-gray-500">+14</div>
                          </div>
                          <button className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors flex items-center gap-1">
                            Enter Class <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                          </button>
                       </div>
                     </div>
                   </div>
                 )
               })}

               {/* Browse More Card */}
               <Link href="/student/join" className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[24px] p-8 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50 transition-all h-[320px]">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/30 flex items-center justify-center mb-4 border border-blue-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Browse More Classes</h3>
               </Link>
            </div>
         )}
      </div>

    </div>
  )
}


