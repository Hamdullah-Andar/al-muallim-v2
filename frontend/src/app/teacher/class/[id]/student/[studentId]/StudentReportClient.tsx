'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface StudentReportClientProps {
  classId: string
  studentId: string
  initialDays: number
  report: any
}

export default function StudentReportClient({
  classId,
  studentId,
  initialDays,
  report
}: StudentReportClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleDaysChange = (days: number) => {
    router.push(`${pathname}?days=${days}`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-sans w-full min-w-0 overflow-x-hidden print:p-0 print:max-w-none">
      
      {/* BREADCRUMB / TOP NAVIGATION (Hidden during print) */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link
          href={`/teacher/class/${classId}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-white dark:bg-[#1a1a1a] px-3.5 py-2 rounded-xl border border-black/5 dark:border-white/5 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Back to Class Details</span>
        </Link>

        {/* CONTROLS: TIMEFRAME TOGGLE & PRINT */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-[#1a1a1a] p-1 rounded-xl text-xs font-bold border border-black/5 dark:border-white/5 shadow-sm">
            <button
              onClick={() => handleDaysChange(7)}
              className={`px-4 py-2 rounded-lg transition-all ${
                initialDays === 7
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handleDaysChange(30)}
              className={`px-4 py-2 rounded-lg transition-all ${
                initialDays === 30
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
            title="Print or Export to PDF"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* MAIN REPORT CONTAINER */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-[28px] border border-black/5 dark:border-white/5 shadow-md p-6 md:p-10 space-y-8 print:shadow-none print:border-none print:p-0 print:bg-transparent">
        
        {/* REPORT HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-black/5 dark:border-white/5 pb-8 print:border-b-2">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center font-black text-3xl border border-emerald-500/20 shadow-sm shrink-0">
              {report.studentName?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                  Student Activity Report
                </span>
                <span className="text-xs opacity-60 print:hidden">• Excludes today</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {report.studentName}
              </h1>
              <p className="text-xs opacity-70 font-medium mt-1">
                Class: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{report.className}</strong> • Period: <strong>{report.startDate}</strong> to <strong>{report.endDate}</strong> ({report.daysCount} Days)
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs opacity-60 print:block">
            <p className="font-bold">Al-Muallim Learning Platform</p>
            <p>Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* OVERVIEW KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Card 1: Attendance Rate */}
          <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">Class Attendance</span>
            <div className="my-2">
              <span className="text-4xl font-black text-blue-900 dark:text-blue-200">
                {report.attendanceStats?.attendanceRate ?? 0}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/50 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: `${report.attendanceStats?.attendanceRate ?? 0}%` }}></div>
            </div>
            <span className="text-[11px] opacity-70 font-medium mt-1.5">
              {report.attendanceStats?.presentCount ?? 0} of {report.daysCount} days present
            </span>
          </div>

          {/* Card 2: Overall Completion */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Habit Adherence</span>
            <div className="my-2">
              <span className="text-4xl font-black text-emerald-900 dark:text-emerald-200">{report.overallPercentage}%</span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: `${report.overallPercentage}%` }}></div>
            </div>
            <span className="text-[11px] opacity-70 font-medium mt-1.5">{report.completedHabitEntries} / {report.totalPossibleHabitEntries} tasks done</span>
          </div>

          {/* Card 3: Active Days */}
          <div className="bg-gray-50 dark:bg-gray-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Days</span>
            <div className="my-2">
              <span className="text-4xl font-black text-gray-900 dark:text-white">{report.activeDaysCount} <span className="text-lg font-bold opacity-60">/ {report.totalDays}</span></span>
            </div>
            <span className="text-[11px] opacity-70 font-medium">Days with completed habits</span>
          </div>

          {/* Card 4: Streak */}
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Consistency Streak</span>
            <div className="my-2 flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <span className="text-4xl font-black text-amber-900 dark:text-amber-200">{report.streak} <span className="text-xs font-bold uppercase">Days</span></span>
            </div>
            <span className="text-[11px] opacity-70 font-medium">Unbroken daily activity</span>
          </div>

          {/* Card 5: Focus Highlight */}
          <div className="bg-gray-50 dark:bg-gray-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Top Habit</span>
            <div className="my-1">
              <p className="text-base font-bold truncate text-gray-900 dark:text-white">{report.topHabit?.title || 'None'}</p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{report.topHabit ? `${report.topHabit.percentage}% Adherence` : '-'}</p>
            </div>
            <span className="text-[11px] opacity-70 font-medium truncate">Lowest: {report.lowestHabit?.title || '-'}</span>
          </div>
        </div>

        {/* CATEGORY BREAKDOWN */}
        <div className="bg-gray-50/60 dark:bg-gray-800/20 border border-black/5 dark:border-white/5 rounded-2xl p-6 md:p-8 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📚</span> Habit Categories Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.categoryBreakdown?.map((cat: any) => (
              <div key={cat.category} className="bg-white dark:bg-[#111] p-4 rounded-xl border border-black/5 dark:border-white/5 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">{cat.category}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      cat.percentage >= 80 ? 'bg-emerald-500' :
                      cat.percentage >= 50 ? 'bg-emerald-700' : 'bg-amber-500'
                    }`}
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs opacity-70">
                  <span>{cat.completedCount} / {cat.totalTarget} completed</span>
                  {cat.totalValueSum > 0 && (
                    <span className="font-bold text-gray-900 dark:text-white">Total: {cat.totalValueSum} {cat.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAILY PROGRESS TREND */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📅</span> Daily Consistency Trend ({report.daysCount} Days)
          </h2>
          
          <div className="grid grid-cols-7 sm:grid-cols-7 md:grid-cols-14 gap-2.5 overflow-x-auto pb-2">
            {report.dailyTrend?.map((day: any) => (
              <div
                key={day.date}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all min-w-[55px] ${
                  day.completed > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-gray-50 dark:bg-gray-800/40 border-black/5 dark:border-white/5 opacity-60'
                }`}
              >
                <span className="text-[10px] font-bold uppercase opacity-60">{day.dayName}</span>
                <span className="text-xs font-extrabold my-1.5">{day.formattedDate}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${day.completed > 0 ? 'bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {day.completed}/{day.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DETAILED HABITS LIST */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📋</span> Habit-by-Habit Breakdown
          </h2>

          <div className="border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-sm">
            {report.habitBreakdown?.map((h: any) => (
              <div key={h.id} className="p-4 md:p-5 bg-white dark:bg-[#111] flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                      {h.category}
                    </span>
                    {h.targetVal > 0 && (
                      <span className="text-[10px] opacity-60 font-mono">
                        Target: {h.targetVal} {h.unit}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">{h.title}</h3>
                </div>

                <div className="flex items-center gap-6 text-right">
                  {h.totalValueSum > 0 && (
                    <div className="hidden sm:block">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{h.totalValueSum} {h.unit}</p>
                      <p className="text-[10px] opacity-60">Total Logged</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{h.completedDays} / {h.totalDays} Days ({h.percentage}%)</p>
                    <div className="w-28 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-1.5 ml-auto">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${h.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REPORT FOOTER */}
        <div className="pt-6 border-t border-black/5 dark:border-white/5 text-center text-xs opacity-60 font-medium print:border-t-2">
          Official Student Activity Report • Generated by Al-Muallim Platform
        </div>

      </div>
    </div>
  )
}
