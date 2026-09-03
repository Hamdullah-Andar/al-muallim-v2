'use client'


import PageHeader from '@/components/ui/PageHeader'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type ClassItem = { id: string; name: string; code: string }
type StudentItem = { studentId: string; fullName: string; email: string; classId: string; className: string; joinedAt: string }
type AssignmentItem = { id: string; classId: string; className: string; category: string; title: string; trackingType: string; isDaily: boolean }
type ProgressItem = { assignment_id: string; student_id: string; tracking_date: string; completed_value?: number; is_completed: boolean; updated_at: string }
type AttendanceItem = { class_id: string; student_id: string; attendance_date: string; status: string }

export default function AnalyticsClient({
  teacherName,
  classes,
  students,
  assignments,
  progressRecords,
  attendanceRecords = []
}: {
  teacherName: string
  classes: ClassItem[]
  students: StudentItem[]
  assignments: AssignmentItem[]
  progressRecords: ProgressItem[]
  attendanceRecords?: AttendanceItem[]
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d')

  // Days count based on timeframe selection
  const daysCount = timeframe === '7d' ? 7 : 30

  // Filtered dataset base
  const filteredClasses = useMemo(() => {
    return selectedClassId === 'all' 
      ? classes 
      : classes.filter(c => c.id === selectedClassId)
  }, [classes, selectedClassId])

  const filteredAssignments = useMemo(() => {
    return selectedClassId === 'all'
      ? assignments
      : assignments.filter(a => a.classId === selectedClassId)
  }, [assignments, selectedClassId])

  const filteredStudents = useMemo(() => {
    return selectedClassId === 'all'
      ? students
      : students.filter(s => s.classId === selectedClassId)
  }, [students, selectedClassId])

  const assignmentIdSet = useMemo(() => {
    return new Set(filteredAssignments.map(a => a.id))
  }, [filteredAssignments])

  // Extract all unique active categories dynamically from filtered assignments
  const activeCategories = useMemo(() => {
    const cats = Array.from(new Set(filteredAssignments.map(a => a.category || 'General'))).sort()
    return cats.length > 0 ? cats : ['Prayer', 'Zikr', 'Reading']
  }, [filteredAssignments])

  // Get date strings array for the selected timeframe window (excludes today)
  const dateRange = useMemo(() => {
    const dates: { dateStr: string; displayLabel: string; shortDay: string }[] = []
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = daysCount; i >= 1; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const shortDay = daysOfWeek[d.getDay()]
      const month = d.toLocaleString('default', { month: 'short' })
      const dayNum = d.getDate()
      
      dates.push({
        dateStr,
        displayLabel: `${shortDay}, ${month} ${dayNum}`,
        shortDay: `${month} ${dayNum}`
      })
    }
    return dates
  }, [daysCount])

  const dateSet = useMemo(() => new Set(dateRange.map(d => d.dateStr)), [dateRange])

  // Filter progress records within selected date range and class filter
  const relevantProgress = useMemo(() => {
    return progressRecords.filter(p => {
      const pDate = p.tracking_date ? String(p.tracking_date).split('T')[0] : ''
      const isDone = Boolean(p.is_completed) || (p.completed_value != null && Number(p.completed_value) > 0)
      return (
        assignmentIdSet.has(p.assignment_id) && 
        dateSet.has(pDate) &&
        isDone
      )
    })
  }, [progressRecords, assignmentIdSet, dateSet])

  // Filter attendance records within selected date range (strictly aligned with completed date window)
  const relevantAttendance = useMemo(() => {
    return attendanceRecords.filter(a => {
      const aDate = a.attendance_date ? String(a.attendance_date).split('T')[0] : ''
      return dateSet.has(aDate)
    })
  }, [attendanceRecords, dateSet])

  // 1. Calculate overall metrics
  const uniqueStudentsCount = useMemo(() => {
    const ids = new Set(filteredStudents.map(s => s.studentId))
    return ids.size
  }, [filteredStudents])

  const totalExpectedInPeriod = useMemo(() => {
    let expected = 0
    filteredClasses.forEach(c => {
      const classStudentsCount = students.filter(s => s.classId === c.id).length
      const classDailyAssignments = assignments.filter(a => a.classId === c.id && a.isDaily)
      
      classDailyAssignments.forEach(a => {
        const cat = a.category || 'General'
        if (cat === 'Prayer') {
          expected += classStudentsCount * 5 * daysCount
        } else {
          expected += classStudentsCount * daysCount
        }
      })
    })
    return expected
  }, [filteredClasses, students, assignments, daysCount])

  const totalCompletedInPeriod = relevantProgress.length

  const overallCompletionRate = totalExpectedInPeriod > 0
    ? Math.min(100, Math.round((totalCompletedInPeriod / totalExpectedInPeriod) * 100))
    : 0

  // 2. Class Performance Comparison Matrix
  const classPerformanceList = useMemo(() => {
    return classes.map(c => {
      const classStudents = students.filter(s => s.classId === c.id)
      const classAssignments = assignments.filter(a => a.classId === c.id)
      const classAssignIds = new Set(classAssignments.map(a => a.id))
      
      let expected = 0
      classAssignments.filter(a => a.isDaily).forEach(a => {
        const cat = a.category || 'General'
        if (cat === 'Prayer') {
          expected += classStudents.length * 5 * daysCount
        } else {
          expected += classStudents.length * daysCount
        }
      })

      const completed = progressRecords.filter(p => {
        const pDate = p.tracking_date ? String(p.tracking_date).split('T')[0] : ''
        const isDone = Boolean(p.is_completed) || (p.completed_value != null && Number(p.completed_value) > 0)
        return classAssignIds.has(p.assignment_id) && dateSet.has(pDate) && isDone
      }).length

      const rate = expected > 0 ? Math.min(100, Math.round((completed / expected) * 100)) : 0

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        studentCount: classStudents.length,
        habitCount: classAssignments.length,
        completed,
        rate
      }
    })
  }, [classes, students, assignments, progressRecords, dateSet, daysCount])

  const topClass = useMemo(() => {
    if (classPerformanceList.length === 0) return null
    return [...classPerformanceList].sort((a, b) => b.rate - a.rate)[0]
  }, [classPerformanceList])

  // 3. Daily Completion Trend Data
  const dailyTrendData = useMemo(() => {
    return dateRange.map(d => {
      const dayCompleted = relevantProgress.filter(p => {
        const pDate = p.tracking_date ? String(p.tracking_date).split('T')[0] : ''
        return pDate === d.dateStr
      }).length

      let expectedPerDay = 0
      filteredClasses.forEach(c => {
        const classStudentsCount = students.filter(s => s.classId === c.id).length
        const classDailyAssignments = assignments.filter(a => a.classId === c.id && a.isDaily)
        
        classDailyAssignments.forEach(a => {
          const cat = a.category || 'General'
          if (cat === 'Prayer') {
            expectedPerDay += classStudentsCount * 5
          } else {
            expectedPerDay += classStudentsCount
          }
        })
      })

      const rate = expectedPerDay > 0 
        ? Math.min(100, Math.round((dayCompleted / expectedPerDay) * 100)) 
        : 0

      return {
        dateStr: d.dateStr,
        label: d.shortDay,
        fullLabel: d.displayLabel,
        completedCount: dayCompleted,
        rate
      }
    })
  }, [dateRange, relevantProgress, filteredClasses, students, assignments])

  // 4. Category Performance Breakdown
  const categoryBreakdown = useMemo(() => {
    const categoriesMap: Record<string, { title: string; totalAssigned: number; completedCount: number }> = {}

    filteredAssignments.forEach(a => {
      const catName = a.category || 'General'
      if (!categoriesMap[catName]) {
        categoriesMap[catName] = { title: catName, totalAssigned: 0, completedCount: 0 }
      }
      categoriesMap[catName].totalAssigned += 1
    })

    relevantProgress.forEach(p => {
      const assign = assignments.find(a => a.id === p.assignment_id)
      if (assign) {
        const catName = assign.category || 'General'
        if (categoriesMap[catName]) {
          categoriesMap[catName].completedCount += 1
        }
      }
    })

    return Object.values(categoriesMap).map(cat => {
      const percent = totalCompletedInPeriod > 0
        ? Math.round((cat.completedCount / totalCompletedInPeriod) * 100)
        : 0

      return {
        name: cat.title,
        assigned: cat.totalAssigned,
        completed: cat.completedCount,
        percent
      }
    })
  }, [filteredAssignments, relevantProgress, assignments, totalCompletedInPeriod])

  // 5. Enhanced Student Roster & Leaderboard with Dynamic Categories, Domain Rules, and Class Attendance
  const studentLeaderboard = useMemo(() => {
    const studentMap: Record<string, {
      studentId: string
      fullName: string
      className: string
      classId: string
      email: string
      completedCount: number
      totalExpected: number
      adherenceRate: number
      attendanceRate: number
      attendanceText: string
      categoryValues: Record<string, {
        formatted: string
        rawCompleted: number
        totalVolume: number
        completedDays: number
      }>
    }> = {}

    filteredStudents.forEach(s => {
      const classDailyAssignments = assignments.filter(a => a.classId === s.classId && a.isDaily)
      
      let expectedTasks = 0
      classDailyAssignments.forEach(a => {
        const cat = a.category || 'General'
        if (cat === 'Prayer') {
          expectedTasks += 5 * daysCount
        } else {
          expectedTasks += daysCount
        }
      })

      const categoryValues: Record<string, { formatted: string; rawCompleted: number; totalVolume: number; completedDays: number }> = {}
      activeCategories.forEach(cat => {
        categoryValues[cat] = { formatted: '-', rawCompleted: 0, totalVolume: 0, completedDays: 0 }
      })

      studentMap[s.studentId] = {
        studentId: s.studentId,
        fullName: s.fullName,
        className: s.className,
        classId: s.classId,
        email: s.email,
        completedCount: 0,
        totalExpected: expectedTasks,
        adherenceRate: 0,
        attendanceRate: 0,
        attendanceText: 'N/A',
        categoryValues
      }
    })

    // Map progress records per student per category
    const studentCatDatesMap: Record<string, Record<string, Set<string>>> = {}
    const studentCatPctSumMap: Record<string, Record<string, { sum: number; count: number }>> = {}

    relevantProgress.forEach(p => {
      const studentObj = studentMap[p.student_id]
      if (!studentObj) return

      const assign = assignments.find(a => a.id === p.assignment_id)
      if (!assign) return

      const cat = assign.category || 'General'
      const val = Number(p.completed_value) || 1
      const pDate = p.tracking_date ? String(p.tracking_date).split('T')[0] : ''

      if (!studentObj.categoryValues[cat]) {
        studentObj.categoryValues[cat] = { formatted: '-', rawCompleted: 0, totalVolume: 0, completedDays: 0 }
      }
      const catValObj = studentObj.categoryValues[cat]
      catValObj.rawCompleted += 1
      catValObj.totalVolume += val

      if (!studentCatDatesMap[p.student_id]) studentCatDatesMap[p.student_id] = {}
      if (!studentCatDatesMap[p.student_id][cat]) studentCatDatesMap[p.student_id][cat] = new Set()
      if (p.is_completed) {
        studentCatDatesMap[p.student_id][cat].add(pDate)
      }

      if (assign.trackingType === 'percentage') {
        if (!studentCatPctSumMap[p.student_id]) studentCatPctSumMap[p.student_id] = {}
        if (!studentCatPctSumMap[p.student_id][cat]) studentCatPctSumMap[p.student_id][cat] = { sum: 0, count: 0 }
        studentCatPctSumMap[p.student_id][cat].sum += val
        studentCatPctSumMap[p.student_id][cat].count += 1
      }
    })

    // Map attendance per student
    const studentAttMap: Record<string, { present: number; late: number; absent: number; total: number }> = {}
    relevantAttendance.forEach(a => {
      if (!studentAttMap[a.student_id]) {
        studentAttMap[a.student_id] = { present: 0, late: 0, absent: 0, total: 0 }
      }
      const att = studentAttMap[a.student_id]
      att.total += 1
      if (a.status === 'present') att.present += 1
      else if (a.status === 'late') att.late += 1
      else if (a.status === 'absent') att.absent += 1
    })

    // Format output strings per domain rules and sum true completed tasks
    Object.values(studentMap).forEach(s => {
      let trueCompletedTasks = 0

      activeCategories.forEach(cat => {
        const catValObj = s.categoryValues[cat]
        const classDailyAssignments = assignments.filter(a => a.classId === s.classId && (a.category || 'General') === cat && a.isDaily)
        const completedDays = studentCatDatesMap[s.studentId]?.[cat]?.size || 0
        catValObj.completedDays = completedDays

        if (classDailyAssignments.length === 0) {
          catValObj.formatted = '-'
          return
        }

        const firstAssign = classDailyAssignments[0]
        const trackingType = firstAssign?.trackingType

        if (cat === 'Prayer') {
          const totalPrayers = 5 * daysCount * classDailyAssignments.length
          const completedPrayers = catValObj.totalVolume > 0 ? catValObj.totalVolume : catValObj.rawCompleted
          catValObj.formatted = `${completedPrayers} of ${totalPrayers}`
          trueCompletedTasks += completedPrayers
        } else if (trackingType === 'percentage') {
          const pctStats = studentCatPctSumMap[s.studentId]?.[cat]
          const avgPct = pctStats && pctStats.count > 0 ? Math.round(pctStats.sum / pctStats.count) : 0
          catValObj.formatted = `${avgPct}% Avg`
          trueCompletedTasks += completedDays
        } else if (cat === 'Zikr') {
          if (catValObj.totalVolume > 0) {
            catValObj.formatted = `${catValObj.totalVolume.toLocaleString()} Times (${completedDays} of ${daysCount} days)`
          } else if (completedDays > 0) {
            catValObj.formatted = `${completedDays} of ${daysCount} days`
          } else {
            catValObj.formatted = `0 Times (0 of ${daysCount} days)`
          }
          trueCompletedTasks += completedDays
        } else {
          const unit = firstAssign?.trackingType === 'counter' ? 'Units' : ''
          if (catValObj.totalVolume > 0) {
            catValObj.formatted = `${catValObj.totalVolume} ${unit}`.trim() + ` (${completedDays} of ${daysCount} days)`
          } else if (completedDays > 0) {
            catValObj.formatted = `${completedDays} of ${daysCount} days`
          } else {
            catValObj.formatted = `0 of ${daysCount} days`
          }
          trueCompletedTasks += completedDays
        }
      })

      s.completedCount = trueCompletedTasks
      s.adherenceRate = s.totalExpected > 0 ? Math.min(100, Math.round((s.completedCount / s.totalExpected) * 100)) : 0

      // Compute student attendance rate based on timeframe daysCount (7 or 30 days)
      const attStats = studentAttMap[s.studentId]
      if (attStats && attStats.total > 0) {
        const effectivePresent = attStats.present + (attStats.late * 0.5)
        s.attendanceRate = Math.round((effectivePresent / daysCount) * 100)
        s.attendanceText = `${s.attendanceRate}% (${attStats.present} of ${daysCount} days)`
      } else {
        s.attendanceRate = 0
        s.attendanceText = '-'
      }
    })

    return Object.values(studentMap).sort((a, b) => b.completedCount - a.completedCount)
  }, [filteredStudents, relevantProgress, relevantAttendance, assignments, daysCount, activeCategories])

  // Helper to export the Roster Table as a standard CSV file (.csv) that opens directly in Excel
  const handleExportExcel = () => {
    if (studentLeaderboard.length === 0) return

    const headers = ['Student Name', 'Classroom', 'Attendance (%)', ...activeCategories, 'Total Tasks Completed', 'Adherence Rate (%)']
    const rows = studentLeaderboard.map(s => [
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.className.replace(/"/g, '""')}"`,
      `"${s.attendanceText.replace(/"/g, '""')}"`,
      ...activeCategories.map(cat => `"${(s.categoryValues[cat]?.formatted || '-').replace(/"/g, '""')}"`),
      s.completedCount,
      `"${s.adherenceRate}%"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Student_Roster_Analytics_${timeframe === '7d' ? '7Days' : '30Days'}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      
      {/* HEADER SECTION */}
      <div className="border-b border-black/5 dark:border-white/5 pb-4">
        <PageHeader
          breadcrumb="PORTAL / ANALYTICS"
          title="Classroom Performance Analytics"
          subtitle="Real-time spiritual progress, daily habits completion rates, and student engagement metrics."
          className="mb-2"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 pl-3">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-[#f4f7f6] dark:bg-black/50 border border-black/5 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#092B2B] dark:text-white focus:outline-none"
                >
                  <option value="all">All Classrooms ({classes.length})</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm p-1.5 rounded-2xl">
                <button
                  onClick={() => setTimeframe("7d")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    timeframe === "7d"
                      ? "bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeframe("30d")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    timeframe === "30d"
                      ? "bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          }
        />
      </div>
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Overall Completion Rate */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Completion Rate</p>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
              {timeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          </div>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white mb-3">{overallCompletionRate}%</h3>
          <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${overallCompletionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Active Enrolled Students */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Enrolled Students</p>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white mb-1">{uniqueStudentsCount}</h3>
          <p className="text-xs text-gray-500 font-medium">Active in selected classroom scope</p>
        </div>

        {/* Total Active Habits */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assigned Habits</p>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white mb-1">{filteredAssignments.length}</h3>
          <p className="text-xs text-gray-500 font-medium">Daily spiritual assignments</p>
        </div>

        {/* Top Performing Class */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Top Class</p>
          <h3 className="text-xl font-extrabold text-[#092B2B] dark:text-white truncate mb-1">
            {topClass ? topClass.name : 'N/A'}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {topClass ? `${topClass.rate}% Completion Rate` : 'No class data yet'}
          </p>
        </div>

      </div>

      {/* DAILY COMPLETION TREND VISUALIZER (BAR CHART) */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Daily Completion Trend</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Habit completions breakdown over time ({timeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'})</p>
          </div>
        </div>

        {/* Bar chart visualization */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-black/5 dark:border-white/5 pb-2">
          {dailyTrendData.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <span className="text-[10px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 dark:text-emerald-400">
                {item.rate}%
              </span>
              <div className="w-full bg-black/5 dark:bg-white/5 rounded-t-lg h-32 flex items-end overflow-hidden p-0.5">
                <div 
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    item.rate >= 80 ? 'bg-emerald-500' : item.rate >= 50 ? 'bg-emerald-700' : 'bg-amber-500'
                  }`}
                  style={{ height: `${Math.max(item.rate, 4)}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 truncate w-full text-center" title={item.fullLabel}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN SECTION */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Habit Categories Score</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Distribution of completed daily tasks by category</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categoryBreakdown.map((cat, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#f8faf9] dark:bg-black/20 border border-black/5 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{cat.name}</span>
                <span className="text-sm font-black text-[#092B2B] dark:text-white">{cat.completed} done</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percent}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">{cat.percent}% of overall completed tasks</p>
            </div>
          ))}
        </div>
      </div>

      {/* DYNAMIC ENROLLED STUDENTS ROSTER & EXCEL EXPORTER */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Enrolled Students Roster</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Student activity breakdown and completion scores for the selected timeframe ({timeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'})</p>
          </div>

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={studentLeaderboard.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow active:scale-95 shrink-0"
            title="Download clean Excel / CSV file"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export Excel (.csv)</span>
          </button>
        </div>

        {studentLeaderboard.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            <p className="text-xs opacity-60 font-medium">No enrolled students found in this scope.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                  <th className="pb-3 pl-2">Student</th>
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3 text-center">Attendance</th>
                  {activeCategories.map(cat => (
                    <th key={cat} className="pb-3 text-center">{cat}</th>
                  ))}
                  <th className="pb-3 text-center">Completed Tasks</th>
                  <th className="pb-3 text-center">Adherence</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs font-medium">
                {studentLeaderboard.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className={`transition-colors ${
                      idx % 2 === 1 ? 'bg-emerald-50/50 dark:bg-white/[0.04]' : 'bg-transparent'
                    } hover:bg-emerald-100/60 dark:hover:bg-white/[0.06]`}
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#092B2B] dark:text-white text-sm">{student.fullName}</p>
                          <p className="text-[11px] text-gray-400">{student.email || 'Enrolled Student'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {student.attendanceText !== '-' ? (
                        <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          student.attendanceRate >= 80
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : student.attendanceRate >= 50
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                        }`}>
                          {student.attendanceText}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold text-xs">-</span>
                      )}
                    </td>
                    {activeCategories.map(cat => (
                      <td key={cat} className="py-4 text-center font-bold text-gray-800 dark:text-gray-200">
                        {student.categoryValues[cat]?.formatted || '-'}
                      </td>
                    ))}
                    <td className="py-4 text-center font-bold text-sm text-[#092B2B] dark:text-white">
                      {student.completedCount}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        student.adherenceRate >= 80
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : student.adherenceRate >= 50
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      }`}>
                        {student.adherenceRate}%
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <Link
                        href={`/teacher/class/${student.classId}/student/${student.studentId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg transition-all shadow-sm active:scale-95"
                      >
                        <span>Report</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}