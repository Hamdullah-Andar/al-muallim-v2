'use client'

import React, { useState, useEffect } from 'react'

interface StudentReportModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  studentId: string
  studentName: string
  fetchReportAction: (classId: string, studentId: string, days: number) => Promise<any>
}

export default function StudentReportModal({
  isOpen,
  onClose,
  classId,
  studentId,
  studentName,
  fetchReportAction
}: StudentReportModalProps) {
  const [daysCount, setDaysCount] = useState<number>(7)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && classId && studentId) {
      loadReport(daysCount)
    }
  }, [isOpen, classId, studentId, daysCount])

  async function loadReport(days: number) {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchReportAction(classId, studentId, days)
      setReport(data)
    } catch (err: any) {
      console.error('Failed to load student report:', err)
      setError(err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-black/10 dark:border-white/10 p-6 md:p-8 flex flex-col gap-6 print:max-h-none print:shadow-none print:border-none print:w-full print:p-0">
        
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 dark:border-white/5 pb-6 print:border-b-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center font-extrabold text-2xl border border-emerald-500/20 shadow-sm print:border">
              {studentName?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                  Student Activity Report
                </span>
                <span className="text-xs opacity-60 print:hidden">• Excludes today</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
                {studentName}
              </h2>
              {report && (
                <p className="text-xs opacity-70 font-medium mt-0.5">
                  Class: <strong className="text-emerald-600 dark:text-emerald-400">{report.className}</strong> • {report.startDate} to {report.endDate} ({report.daysCount} Days)
                </p>
              )}
            </div>
          </div>

          {/* ACTIONS & TIMEFRAME SELECTOR */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end print:hidden">
            {/* Timeframe Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold border border-black/5 dark:border-white/5">
              <button
                onClick={() => setDaysCount(7)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  daysCount === 7
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDaysCount(30)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  daysCount === 30
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                30 Days
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={loading || !report}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-black/5 dark:border-white/5"
              title="Print or Save PDF"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Print / PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-bold opacity-70">Generating {daysCount}-Day Activity Report...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 font-bold bg-red-50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-200 dark:border-red-900/30">
            <p>Error loading report: {error}</p>
          </div>
        ) : report && (
          <div className="space-y-8">
            
            {/* OVERVIEW KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Overall Completion */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Adherence Rate</span>
                <div className="my-2">
                  <span className="text-3xl font-black text-emerald-900 dark:text-emerald-200">{report.overallPercentage}%</span>
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${report.overallPercentage}%` }}></div>
                </div>
                <span className="text-[11px] opacity-70 font-medium mt-1">{report.completedHabitEntries} / {report.totalPossibleHabitEntries} tasks done</span>
              </div>

              {/* Card 2: Active Days */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Days</span>
                <div className="my-2">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{report.activeDaysCount} <span className="text-lg font-bold opacity-60">/ {report.totalDays}</span></span>
                </div>
                <span className="text-[11px] opacity-70 font-medium">Days with completed habits</span>
              </div>

              {/* Card 3: Streak */}
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Consistency Streak</span>
                <div className="my-2 flex items-center gap-1.5">
                  <span className="text-2xl">🔥</span>
                  <span className="text-3xl font-black text-amber-900 dark:text-amber-200">{report.streak} <span className="text-xs font-bold uppercase">Days</span></span>
                </div>
                <span className="text-[11px] opacity-70 font-medium">Unbroken daily activity</span>
              </div>

              {/* Card 4: Focus Highlight */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Top Habit</span>
                <div className="my-1">
                  <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{report.topHabit?.title || 'None'}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{report.topHabit ? `${report.topHabit.percentage}% Adherence` : '-'}</p>
                </div>
                <span className="text-[11px] opacity-70 font-medium truncate">Lowest: {report.lowestHabit?.title || '-'}</span>
              </div>
            </div>

            {/* CATEGORY BREAKDOWN */}
            <div className="bg-gray-50/50 dark:bg-gray-800/20 border border-black/5 dark:border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📚</span> Habit Categories Performance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.categoryBreakdown?.map((cat: any) => (
                  <div key={cat.category} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-black/5 dark:border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">{cat.category}</span>
                      <span>{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.percentage >= 80 ? 'bg-emerald-500' :
                          cat.percentage >= 50 ? 'bg-emerald-700' : 'bg-amber-500'
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] opacity-70">
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
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📅</span> Daily Consistency Trend ({report.daysCount} Days)
              </h3>
              
              <div className="grid grid-cols-7 sm:grid-cols-7 md:grid-cols-14 gap-2 overflow-x-auto pb-2">
                {report.dailyTrend?.map((day: any) => (
                  <div
                    key={day.date}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all min-w-[50px] ${
                      day.completed > 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-gray-50 dark:bg-gray-800/40 border-black/5 dark:border-white/5 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase opacity-60">{day.dayName}</span>
                    <span className="text-[11px] font-extrabold my-1">{day.formattedDate}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${day.completed > 0 ? 'bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      {day.completed}/{day.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DETAILED HABITS LIST */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Habit-by-Habit Breakdown
              </h3>

              <div className="border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                {report.habitBreakdown?.map((h: any) => (
                  <div key={h.id} className="p-4 bg-white dark:bg-gray-900 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                          {h.category}
                        </span>
                        {h.targetVal > 0 && (
                          <span className="text-[10px] opacity-60 font-mono">
                            Target: {h.targetVal} {h.unit}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{h.title}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      {h.totalValueSum > 0 && (
                        <div className="hidden sm:block">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{h.totalValueSum} {h.unit}</p>
                          <p className="text-[10px] opacity-60">Total Done</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{h.completedDays} / {h.totalDays} Days ({h.percentage}%)</p>
                        <div className="w-24 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${h.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REPORT FOOTER */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 text-center text-xs opacity-60 font-medium">
              Report generated automatically by Al-Muallim Platform • Excludes current day activities
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
