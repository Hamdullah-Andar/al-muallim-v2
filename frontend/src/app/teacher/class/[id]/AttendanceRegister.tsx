'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getClassAttendanceHistory } from './actions'

interface Student {
  student_id: string
  is_active?: boolean
  profiles: {
    full_name: string
  }
}

interface AttendanceRegisterProps {
  classId: string
  className: string
  scheduleDays: string[]   // e.g. ['Mon', 'Wed', 'Fri'] — from classData.schedule_days
  students: Student[]
  onClose: () => void
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface AttendanceRecord {
  student_id: string
  attendance_date: string
  status: AttendanceStatus
  notes?: string
}

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string; short: string
  bgClass: string; textClass: string
  darkBgClass: string; darkTextClass: string
}> = {
  present: { label: 'Present', short: 'P', bgClass: 'bg-emerald-100', textClass: 'text-emerald-800', darkBgClass: 'dark:bg-emerald-950/50', darkTextClass: 'dark:text-emerald-300' },
  absent:  { label: 'Absent',  short: 'A', bgClass: 'bg-red-100',     textClass: 'text-red-800',     darkBgClass: 'dark:bg-red-950/50',     darkTextClass: 'dark:text-red-300'     },
  late:    { label: 'Late',    short: 'L', bgClass: 'bg-amber-100',   textClass: 'text-amber-800',   darkBgClass: 'dark:bg-amber-950/50',   darkTextClass: 'dark:text-amber-300'   },
  excused: { label: 'Excused', short: 'E', bgClass: 'bg-blue-100',    textClass: 'text-blue-800',    darkBgClass: 'dark:bg-blue-950/50',    darkTextClass: 'dark:text-blue-300'    },
}

// Day abbreviations as stored in schedule_days
const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildDateColumns(timeframe: number, scheduleDays: string[], includeAll: boolean): string[] {
  const allDates: string[] = []
  for (let i = timeframe; i >= 1; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayAbbr = DAY_ABBRS[d.getDay()]
    // If schedule is set and not including all, only include scheduled days.
    if (!includeAll && scheduleDays.length > 0 && !scheduleDays.includes(dayAbbr)) {
      continue
    }
    allDates.push(d.toISOString().split('T')[0])
  }
  return allDates
}

export default function AttendanceRegister({ classId, className, scheduleDays, students, onClose }: AttendanceRegisterProps) {
  const activeStudents = students.filter(s => s.is_active !== false)
  const hasSchedule = scheduleDays.length > 0

  const [timeframe, setTimeframe] = useState<7 | 30>(7)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [includeOffSchedule, setIncludeOffSchedule] = useState(false)

  // Build date columns — filtered by schedule unless includeOffSchedule is on
  const dateColumns = buildDateColumns(timeframe, scheduleDays, includeOffSchedule)

  // The denominator for rate: number of class days shown in the register
  const classDaysCount = dateColumns.length

  // Helper: is a given date an off-schedule day?
  const isOffScheduleDate = (dateStr: string) => {
    if (!hasSchedule || includeOffSchedule === false) return false
    const dayAbbr = DAY_ABBRS[new Date(dateStr + 'T00:00:00').getDay()]
    return !scheduleDays.includes(dayAbbr)
  }

  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getClassAttendanceHistory(classId, timeframe + 1)
      setRecords((data as AttendanceRecord[]).filter((r: AttendanceRecord) =>
        dateColumns.includes(r.attendance_date)
      ))
    } catch (err) {
      console.error('Failed to load attendance history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [classId, timeframe, dateColumns.join(',')])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  // Build lookup: studentId -> date -> record
  const lookup: Record<string, Record<string, AttendanceRecord>> = {}
  records.forEach(r => {
    if (!lookup[r.student_id]) lookup[r.student_id] = {}
    lookup[r.student_id][r.attendance_date] = r
  })

  // Per-student summary
  const studentSummary = activeStudents.map(s => {
    let present = 0, absent = 0, late = 0, excused = 0
    dateColumns.forEach(date => {
      const rec = lookup[s.student_id]?.[date]
      if (rec) {
        if (rec.status === 'present') present++
        else if (rec.status === 'absent') absent++
        else if (rec.status === 'late') late++
        else if (rec.status === 'excused') excused++
      }
    })
    const rate = classDaysCount > 0 ? Math.round(((present + late * 0.5) / classDaysCount) * 100) : 0
    return { student: s, present, absent, late, excused, rate }
  })

  // Per-date column summary
  const dateSummary = dateColumns.map(date => {
    let present = 0, absent = 0, late = 0, excused = 0, total = 0
    activeStudents.forEach(s => {
      const rec = lookup[s.student_id]?.[date]
      if (rec) {
        total++
        if (rec.status === 'present') present++
        else if (rec.status === 'absent') absent++
        else if (rec.status === 'late') late++
        else if (rec.status === 'excused') excused++
      }
    })
    return { date, present, absent, late, excused, total }
  })

  // Format column header
  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      day: DAY_ABBRS[d.getDay()],
      date: `${months[d.getMonth()]} ${d.getDate()}`
    }
  }

  // Overall class stats
  const totalPresent = studentSummary.reduce((sum, s) => sum + s.present, 0)
  const totalAbsent  = studentSummary.reduce((sum, s) => sum + s.absent, 0)
  const totalLate    = studentSummary.reduce((sum, s) => sum + s.late, 0)
  const totalExcused = studentSummary.reduce((sum, s) => sum + s.excused, 0)
  const totalSlots   = activeStudents.length * classDaysCount
  const classAttRate = totalSlots > 0 ? Math.round(((totalPresent + totalLate * 0.5) / totalSlots) * 100) : 0

  // Export CSV — one column per class day
  const handleExportCSV = () => {
    const dateHeaders = dateColumns.map(d => {
      const { day, date } = formatDateHeader(d)
      return `"${day} ${date}"`
    })
    const headers = ['Student Name', ...dateHeaders, 'Present', 'Absent', 'Late', 'Excused', `Attendance Rate (of ${classDaysCount} class days)`]

    const rows = studentSummary.map(({ student, present, absent, late, excused, rate }) => {
      const statusCells = dateColumns.map(date => {
        const rec = lookup[student.student_id]?.[date]
        if (!rec) return '"-"'
        return `"${STATUS_CONFIG[rec.status].label}${rec.notes ? ` (${rec.notes})` : ''}"`
      })
      return [
        `"${student.profiles?.full_name || 'Student'}"`,
        ...statusCells,
        present, absent, late, excused,
        `"${rate}%"`
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Attendance_Register_${className.replace(/\s+/g, '_')}_Last${timeframe}Days_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f1a1a] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-[95vw] mt-6 mb-8 animate-in slide-in-from-bottom-4 duration-300">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 md:p-8 border-b border-black/5 dark:border-white/5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Attendance Register</p>
            <h2 className="text-2xl font-black text-[#092B2B] dark:text-white">{className}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500 font-medium">
                {hasSchedule
                  ? `Showing ${classDaysCount} class ${classDaysCount === 1 ? 'day' : 'days'} scheduled on ${scheduleDays.join(', ')}`
                  : 'Showing all days (no fixed schedule set)'
                }
              </p>
              {hasSchedule && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full">
                  Schedule-Aware ✓
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Include off-schedule toggle — only shown when schedule is set */}
            {hasSchedule && (
              <button
                onClick={() => setIncludeOffSchedule(v => !v)}
                title={includeOffSchedule ? 'Showing all days (including off-schedule)' : 'Showing scheduled days only'}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                  includeOffSchedule
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300'
                    : 'bg-[#f4f7f6] dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  includeOffSchedule
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-gray-300 dark:border-white/20 bg-white dark:bg-white/5'
                }`}>
                  {includeOffSchedule && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </span>
                <span>Include off-schedule</span>
              </button>
            )}

            {/* Timeframe toggle */}
            <div className="flex bg-[#f4f7f6] dark:bg-black/50 border border-black/5 dark:border-white/5 p-1 rounded-xl">
              <button
                onClick={() => setTimeframe(7)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 7 ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeframe(30)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 30 ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
              >
                Last 30 Days
              </button>
            </div>

            {/* Export button */}
            <button
              onClick={handleExportCSV}
              disabled={classDaysCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export CSV</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 md:px-8 md:py-5 border-b border-black/5 dark:border-white/5">
          <div className="bg-[#f8faf9] dark:bg-black/20 p-4 rounded-2xl">
            <p className="text-[10px] font-extrabold uppercase text-gray-400">Class Attendance</p>
            <p className={`text-2xl font-black mt-1 ${classAttRate >= 80 ? 'text-emerald-600' : classAttRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{classAttRate}%</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">of {classDaysCount} class {classDaysCount === 1 ? 'day' : 'days'}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl">
            <p className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-400">Present</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{totalPresent}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl">
            <p className="text-[10px] font-extrabold uppercase text-red-800 dark:text-red-400">Absent</p>
            <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">{totalAbsent}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl">
            <p className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-400">Late</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{totalLate}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl col-span-2 md:col-span-1">
            <p className="text-[10px] font-extrabold uppercase text-blue-800 dark:text-blue-400">Excused</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{totalExcused}</p>
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap items-center gap-3 px-6 md:px-8 py-3 border-b border-black/5 dark:border-white/5">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 mr-1">Legend:</span>
          {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([key, cfg]) => (
            <span key={key} className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bgClass} ${cfg.textClass} ${cfg.darkBgClass} ${cfg.darkTextClass}`}>
              {cfg.short} — {cfg.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
            — Not Marked
          </span>
        </div>

        {/* REGISTER GRID */}
        <div className="p-4 md:p-6 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-gray-500 font-medium">Loading attendance register...</p>
            </div>
          ) : activeStudents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
              <p className="text-xs text-gray-500 font-medium">No active students in this class.</p>
            </div>
          ) : classDaysCount === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
              <p className="text-sm font-bold text-gray-500 mb-1">No class days found in this period.</p>
              <p className="text-xs text-gray-400 font-medium">
                The class is scheduled on {scheduleDays.join(', ')}, but none of those days fall in the last {timeframe} days. Try switching to Last 30 Days.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-xs" style={{ minWidth: `${Math.max(600, 180 + dateColumns.length * 60)}px` }}>
              <thead>
                <tr>
                  <th className="text-left pb-2 pl-2 pr-4 text-[10px] font-extrabold uppercase text-gray-400 sticky left-0 bg-white dark:bg-[#0f1a1a] z-10" style={{ minWidth: '160px' }}>
                    Student
                  </th>
                  {dateColumns.map(date => {
                    const { day, date: dateLabel } = formatDateHeader(date)
                    const ds = dateSummary.find(d => d.date === date)
                    const isOffSchedule = isOffScheduleDate(date)
                    return (
                      <th key={date} className={`text-center pb-2 px-1 ${isOffSchedule ? 'opacity-60' : ''}`} style={{ minWidth: '56px' }}>
                        <div className="flex flex-col items-center">
                          {isOffSchedule
                            ? <span className="text-[8px] font-extrabold uppercase text-amber-500 dark:text-amber-400 leading-none">{day} ⚠</span>
                            : <span className="text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">{day}</span>
                          }
                          <span className="text-[10px] font-bold text-[#092B2B] dark:text-white leading-tight">{dateLabel}</span>
                          {isOffSchedule && (
                            <span className="text-[8px] text-amber-500 font-bold leading-none mt-0.5">extra</span>
                          )}
                          {!isOffSchedule && ds && ds.total > 0 && (
                            <span className={`text-[9px] font-extrabold mt-0.5 ${
                              ds.present === activeStudents.length ? 'text-emerald-500' : ds.absent > 0 ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              {ds.present}/{activeStudents.length}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                  {/* Summary columns */}
                  <th className="text-center pb-2 px-1 text-[10px] font-extrabold uppercase text-emerald-500" style={{ minWidth: '44px' }}>P</th>
                  <th className="text-center pb-2 px-1 text-[10px] font-extrabold uppercase text-red-500" style={{ minWidth: '44px' }}>A</th>
                  <th className="text-center pb-2 px-1 text-[10px] font-extrabold uppercase text-amber-500" style={{ minWidth: '44px' }}>L</th>
                  <th className="text-center pb-2 px-1 text-[10px] font-extrabold uppercase text-blue-500" style={{ minWidth: '44px' }}>E</th>
                  <th className="text-center pb-2 pr-2 text-[10px] font-extrabold uppercase text-gray-400" style={{ minWidth: '70px' }}>
                    Rate
                    <span className="block text-[8px] font-bold text-gray-300 normal-case">of {classDaysCount}d</span>
                  </th>
                </tr>
                <tr>
                  <td colSpan={dateColumns.length + 6} className="pb-3">
                    <div className="h-px bg-black/5 dark:bg-white/5 w-full"></div>
                  </td>
                </tr>
              </thead>
              <tbody>
                {studentSummary.map(({ student, present, absent, late, excused, rate }, idx) => (
                  <tr
                    key={student.student_id}
                    className={`transition-colors ${idx % 2 === 1 ? 'bg-emerald-50/30 dark:bg-white/[0.02]' : 'bg-transparent'} hover:bg-emerald-50/60 dark:hover:bg-white/[0.04]`}
                  >
                    {/* Student name - sticky */}
                    <td className="py-3 pl-2 pr-4 sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {student.profiles?.full_name?.charAt(0) || 'S'}
                        </div>
                        <p className="font-bold text-[#092B2B] dark:text-white text-sm leading-tight">
                          {student.profiles?.full_name || 'Student'}
                        </p>
                      </div>
                    </td>

                    {/* Day cells */}
                    {dateColumns.map(date => {
                      const rec = lookup[student.student_id]?.[date]
                      const isOffSchedule = isOffScheduleDate(date)

                      if (!rec) {
                        return (
                          <td key={date} className={`py-3 px-1 text-center ${isOffSchedule ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                            <span className="text-gray-200 dark:text-white/15 font-bold text-sm">—</span>
                          </td>
                        )
                      }

                      const cfg = STATUS_CONFIG[rec.status]
                      return (
                        <td key={date} className={`py-3 px-1 text-center ${isOffSchedule ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                          <div className="relative group inline-block">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-extrabold text-[11px] ${cfg.bgClass} ${cfg.textClass} ${cfg.darkBgClass} ${cfg.darkTextClass} cursor-default`}>
                              {cfg.short}
                            </span>
                            {/* Note tooltip on hover */}
                            {rec.notes && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover:block pointer-events-none">
                                <div className="bg-[#092B2B] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg max-w-[180px] text-center">
                                  {rec.notes}
                                </div>
                                <div className="w-2 h-2 bg-[#092B2B] rotate-45 mx-auto -mt-1"></div>
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}

                    {/* Summary */}
                    <td className="py-3 px-1 text-center font-extrabold text-emerald-700 dark:text-emerald-400">{present}</td>
                    <td className="py-3 px-1 text-center font-extrabold text-red-700 dark:text-red-400">{absent}</td>
                    <td className="py-3 px-1 text-center font-extrabold text-amber-700 dark:text-amber-400">{late}</td>
                    <td className="py-3 px-1 text-center font-extrabold text-blue-700 dark:text-blue-400">{excused}</td>
                    <td className="py-3 pr-2 text-center">
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        rate >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : rate >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Footer totals row */}
                <tr className="border-t-2 border-black/10 dark:border-white/10">
                  <td className="pt-4 pb-2 pl-2 pr-4 text-[10px] font-extrabold uppercase text-gray-400 sticky left-0 bg-white dark:bg-[#0f1a1a] z-10">
                    Daily Total
                  </td>
                  {dateColumns.map(date => {
                    const ds = dateSummary.find(d => d.date === date)
                    return (
                      <td key={date} className="pt-4 pb-2 px-1 text-center">
                        {ds && ds.total > 0 ? (
                          <span className={`text-[10px] font-extrabold ${
                            ds.present === activeStudents.length ? 'text-emerald-600' : ds.absent > 0 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {ds.present}/{activeStudents.length}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-white/20 text-[10px]">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="pt-4 pb-2 px-1 text-center text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">{totalPresent}</td>
                  <td className="pt-4 pb-2 px-1 text-center text-[10px] font-extrabold text-red-700 dark:text-red-400">{totalAbsent}</td>
                  <td className="pt-4 pb-2 px-1 text-center text-[10px] font-extrabold text-amber-700 dark:text-amber-400">{totalLate}</td>
                  <td className="pt-4 pb-2 px-1 text-center text-[10px] font-extrabold text-blue-700 dark:text-blue-400">{totalExcused}</td>
                  <td className="pt-4 pb-2 pr-2 text-center">
                    <span className={`text-[10px] font-extrabold ${classAttRate >= 80 ? 'text-emerald-600' : classAttRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {classAttRate}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
