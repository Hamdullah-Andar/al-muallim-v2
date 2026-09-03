import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/utils/supabase/server'
import CreateClassModal from '@/components/CreateClassModal'
import Link from 'next/link'

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Generate stable visual styling based on class name/id
function getClassVisuals(className: string, index: number) {
  const name = className.toLowerCase()
  const mockCategories = ["Quranic Studies", "Islamic History", "Arabic Language", "Spirituality"]
  const category = name.includes('quran') || name.includes('tajweed') 
    ? "Quranic Studies" 
    : name.includes('arab') || name.includes('lang')
      ? "Arabic Language"
      : name.includes('hist') || name.includes('andalus')
        ? "Islamic History"
        : mockCategories[index % mockCategories.length]

  const gradients = [
    "from-[#092B2B] to-[#0f4c4c]",
    "from-[#156969] to-[#1e8989]",
    "from-[#2c5e5e] to-[#3a7c7c]",
    "from-[#1b3d2f] to-[#2d5c48]"
  ]
  const gradient = gradients[index % gradients.length]

  const schedules = [
    "Mon, Wed 4:00 PM",
    "Tue, Thu 6:00 PM",
    "Sunday 10:00 AM",
    "Saturdays 2:00 PM"
  ]
  const schedule = schedules[index % schedules.length]

  return { category, gradient }
}

function formatClassSchedule(days: string[] | null, time: string | null): string {
  if (!days || days.length === 0) return 'Schedule not set'
  const timeStr = time ? ` \u2022 ${formatTime12h(time)}` : ''
  return days.join(', ') + timeStr
}

function formatTime12h(time24: string): string {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the teacher's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  // Fetch the teacher's classes
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', user?.id)
    .order('created_at', { ascending: false })

  const classIds = classes?.map(c => c.id) || []
  const activeClasses = classes?.filter(c => c.is_active !== false) || []
  const activeClassIds = activeClasses.map(c => c.id)
  const activeClassCount = activeClasses.length

  // 1. Fetch real student counts for ACTIVE classes
  let totalUniqueStudents = 0
  const studentCountMap: Record<string, number> = {}

  if (activeClassIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('class_id, student_id')
      .in('class_id', activeClassIds)
      .eq('is_active', true)
    
    if (enrollments) {
      const uniqueStudentIds = new Set<string>()
      enrollments.forEach((e: any) => {
        uniqueStudentIds.add(e.student_id)
        studentCountMap[e.class_id] = (studentCountMap[e.class_id] || 0) + 1
      })
      totalUniqueStudents = uniqueStudentIds.size
    }
  }

  // 2. Fetch real completion rate today for ACTIVE classes
  let completionRate = 0
  let completedTodayCount = 0
  let totalExpectedTasks = 0

  if (activeClassIds.length > 0) {
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('id, class_id')
      .in('class_id', activeClassIds)
      .eq('is_daily', true)
    
    if (classAssignments && classAssignments.length > 0) {
      // Calculate total expected tasks today: 
      // Each daily assignment must be completed by every student in that class
      classAssignments.forEach((assign: any) => {
        const studentCountForClass = studentCountMap[assign.class_id] || 0
        totalExpectedTasks += studentCountForClass
      })

      const assignmentIds = classAssignments.map(a => a.id)
      const todayStr = new Date().toISOString().split('T')[0]
      
      const { data: progressToday } = await supabase
        .from('student_progress')
        .select('is_completed')
        .in('assignment_id', assignmentIds)
        .eq('tracking_date', todayStr)
        .eq('is_completed', true)
      
      if (progressToday) {
        completedTodayCount = progressToday.length
      }

      if (totalExpectedTasks > 0) {
        completionRate = Math.round((completedTodayCount / totalExpectedTasks) * 100)
      }
    }
  }

  // 3. Fetch real recent activity log for ACTIVE classes
  let recentActivities: any[] = []
  if (activeClassIds.length > 0) {
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('id, title, class_id, classes(name)')
      .in('class_id', activeClassIds)
    
    const assignmentIds = classAssignments?.map(a => a.id) || []
    
    if (assignmentIds.length > 0) {
      const { data: progressLogs } = await supabase
        .from('student_progress')
        .select(`
          student_id,
          assignment_id,
          updated_at,
          is_completed,
          profiles!student_id ( full_name )
        `)
        .in('assignment_id', assignmentIds)
        .order('updated_at', { ascending: false })
        .limit(5)
      
      if (progressLogs) {
        recentActivities = progressLogs.map((log: any) => {
          const assign = (classAssignments || []).find((a: any) => a.id === log.assignment_id)
          return {
            studentName: log.profiles?.full_name || 'A student',
            className: (Array.isArray(assign?.classes) ? (assign?.classes as any[])[0]?.name : (assign?.classes as any)?.name) || 'Class',
            assignmentTitle: assign?.title || 'Assignment',
            isCompleted: log.is_completed,
            timeAgo: formatTimeAgo(log.updated_at)
          }
        })
      }
    }
  }

  // 4. Fetch daily completion rate for the last 7 days to make the Heatmap live
  const weeklyProgressData: { dayName: string; heightPercent: number; count: number }[] = []
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  let thisWeekTotal = 0
  let lastWeekTotal = 0
  
  if (activeClassIds.length > 0) {
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('id, class_id')
      .in('class_id', activeClassIds)
      .eq('is_daily', true)
      
    const assignmentIds = classAssignments?.map(a => a.id) || []
    
    if (assignmentIds.length > 0) {
      // Build this week's dates: yesterday back to 7 days ago (excluding today)
      const dates: { dateStr: string; dayName: string }[] = []
      for (let i = 7; i >= 1; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayName = daysOfWeek[d.getDay()]
        dates.push({ dateStr, dayName })
      }

      // Prior week dates (days 8-14 ago) for week-over-week comparison
      const priorWeekDates: string[] = []
      for (let i = 14; i >= 8; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        priorWeekDates.push(d.toISOString().split('T')[0])
      }

      const dateStrings = dates.map(d => d.dateStr)
      const allDateStrings = [...dateStrings, ...priorWeekDates]

      const { data: progressRecords } = await supabase
        .from('student_progress')
        .select('tracking_date, is_completed')
        .in('assignment_id', assignmentIds)
        .in('tracking_date', allDateStrings)
        .eq('is_completed', true)

      const completionsByDate: Record<string, number> = {}
      progressRecords?.forEach(p => {
        completionsByDate[p.tracking_date] = (completionsByDate[p.tracking_date] || 0) + 1
      })

      dates.forEach(item => {
        const count = completionsByDate[item.dateStr] || 0
        const maxExpected = totalExpectedTasks || 10
        const heightPercent = maxExpected > 0 ? Math.min(100, Math.round((count / maxExpected) * 100)) : 0
        
        weeklyProgressData.push({
          dayName: item.dayName,
          heightPercent,
          count
        })
      })

      // Compute week-over-week totals
      thisWeekTotal = dateStrings.reduce((sum, d) => sum + (completionsByDate[d] || 0), 0)
      lastWeekTotal = priorWeekDates.reduce((sum, d) => sum + (completionsByDate[d] || 0), 0)
    }
  }

  if (weeklyProgressData.length === 0) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      weeklyProgressData.push({
        dayName: daysOfWeek[d.getDay()],
        heightPercent: 0,
        count: 0
      })
    }
  }

  // Build the week-over-week message string
  let weekOverWeekMessage: string
  if (thisWeekTotal === 0 && lastWeekTotal === 0) {
    weekOverWeekMessage = 'No activity tracked yet. Encourage students to complete their daily assignments!'
  } else if (lastWeekTotal === 0) {
    weekOverWeekMessage = `${thisWeekTotal} task${thisWeekTotal !== 1 ? 's' : ''} completed this week — great start!`
  } else {
    const diffPercent = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    if (diffPercent > 0) {
      weekOverWeekMessage = `Activity is ${diffPercent}% higher this week compared to last week. Keep up the great momentum!`
    } else if (diffPercent < 0) {
      weekOverWeekMessage = `Activity is ${Math.abs(diffPercent)}% lower this week compared to last week. Encourage your students!`
    } else {
      weekOverWeekMessage = 'Activity is consistent with last week. Keep up the great work!'
    }
  }

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Teacher'
  const activeClassesList = classes?.filter(c => c.is_active !== false) || []

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 font-arabic tracking-tight text-[#092B2B] dark:text-white">As-salamu alaykum, Dr. {firstName}</h1>
          <p className="text-sm text-gray-500 font-medium">
            {completedTodayCount > 0 
              ? `Your students have completed ${completedTodayCount} tasks this morning. Ready to start a new lesson?`
              : "No tasks completed yet this morning. Ready to start a new lesson?"}
          </p>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Students */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Students</p>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-extrabold text-[#092B2B] dark:text-white">{totalUniqueStudents}</h3>
            <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">Real-time count</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Completion Rate</p>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-extrabold text-[#092B2B] dark:text-white">{completionRate}%</h3>
          </div>
          <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        {/* Active Classes */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Classes</p>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-[#092B2B] dark:text-white">{activeClassCount}</span>
            <span className="text-xs font-bold opacity-60 text-gray-500">Total: {classes?.length || 0}</span>
          </div>
        </div>

      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">
        
        {/* Left Column (Active Classes & Heatmap) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Active Classes Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#092B2B] dark:text-white">Active Classes</h2>
              <Link href="/teacher/classes" className="text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline">
                View All
              </Link>
            </div>
            
            {activeClassesList.length === 0 ? (
              <div className="bg-white dark:bg-black/40 p-12 rounded-xl border border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">No Active Classes</h3>
                <p className="opacity-70 max-w-sm mb-8">You have no active classes at the moment. Create or activate a class to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeClassesList.slice(0, 4).map((c, index) => {
                  const { category, gradient } = getClassVisuals(c.name, index)
                  const studentCount = studentCountMap[c.id] || 0
                  const scheduleDisplay = formatClassSchedule(c.schedule_days, c.schedule_time)

                  return (
                    <div 
                      key={c.id}
                      className="group bg-white dark:bg-[#1a1a1a] rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/5 hover:shadow-md transition-all duration-300 flex flex-col min-w-0"
                    >
                      {/* Premium Header Banner */}
                      <div className={`h-32 bg-gradient-to-r ${gradient} relative flex items-end p-5 overflow-hidden`}>
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-white/90 backdrop-blur-sm text-[#092B2B] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                            {category}
                          </span>
                        </div>
                        {/* Decorative Background Pattern */}
                        <div className="absolute right-0 bottom-0 top-0 w-32 bg-white/5 rounded-l-full blur-xl transform translate-x-12"></div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-[#092B2B] dark:text-white mb-4 tracking-tight line-clamp-1">{c.name}</h3>
                        
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-gray-500 font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <span>{studentCount} Students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="truncate">{scheduleDisplay}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-auto">
                          <Link href={`/teacher/class/${c.id}`} className="flex-1">
                            <button className="w-full bg-[#bdf3df] hover:bg-[#a6edd4] dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-[#092B2B] dark:text-emerald-400 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                              Manage
                            </button>
                          </Link>
                          
                          <div className="bg-[#F4F7F7] dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-[#092B2B] dark:hover:text-white cursor-pointer transition-colors shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Student Progress Heatmap */}
          <div className="bg-primary-900 text-white p-8 rounded-xl shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-2">Student Progress Heatmap</h2>
              <p className="opacity-80 mb-8 max-w-md">{weekOverWeekMessage}</p>
              
              {/* Dynamic Live Graph Bars */}
              <div className="flex items-end justify-between gap-2 h-32 opacity-90">
                {weeklyProgressData.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group/bar">
                    <div 
                      title={`${day.count} tasks completed on ${day.dayName}`}
                      className="w-full bg-white/20 hover:bg-white rounded-t-sm transition-all cursor-pointer relative"
                      style={{ height: `${Math.max(8, day.heightPercent)}%` }}
                    >
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap mb-1.5 z-10 font-bold shadow-md">
                        {day.count} tasks
                      </span>
                    </div>
                    <span className="text-[10px] text-white/50 font-bold mt-2 uppercase tracking-wider">{day.dayName}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>

        </div>

        {/* Right Column (Upcoming / Activities) */}
        <div className="space-y-8">

          {/* Recent Activity Card */}
          <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-[#092B2B] dark:text-white">Recent Activity</h2>
            
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                 <svg className="w-12 h-12 text-black/20 dark:text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p className="opacity-60 text-sm font-medium text-gray-500">No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((act, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    {/* Student Initials */}
                    <div className="w-8 h-8 rounded-full bg-[#092B2B] dark:bg-emerald-600 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">
                      {act.studentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">
                        <strong className="text-gray-800 dark:text-white font-bold">{act.studentName}</strong> 
                        {act.isCompleted ? ' completed ' : ' updated '} 
                        <span className="text-[#092B2B] dark:text-emerald-400 font-bold">{act.assignmentTitle}</span> in <span className="italic">{act.className}</span>.
                      </p>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1 uppercase tracking-wider">{act.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}


