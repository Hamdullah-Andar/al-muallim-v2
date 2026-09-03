'use client'

import React, { useState, useEffect } from 'react'
import { saveClassAttendance, getClassAttendanceForDate } from './actions'
import AttendanceRegister from './AttendanceRegister'

interface Student {
  student_id: string
  is_active?: boolean
  profiles: {
    full_name: string
  }
}

interface AttendanceTabProps {
  classId: string
  className: string
  scheduleDays: string[]
  students: Student[]
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface AttendanceRecordState {
  status: AttendanceStatus
  notes: string
}

export default function AttendanceTab({ classId, className, scheduleDays, students }: AttendanceTabProps) {
  // Filter active students only
  const activeStudents = students.filter(s => s.is_active !== false)

  const [showRegister, setShowRegister] = useState(false)

  // Default date = Today (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecordState>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch existing attendance records whenever classId or selectedDate changes
  useEffect(() => {
    async function loadDateAttendance() {
      setIsLoading(true)
      setSaveSuccess(false)
      try {
        const records = await getClassAttendanceForDate(classId, selectedDate)
        const map: Record<string, AttendanceRecordState> = {}
        
        // Initialize default mapping for active students
        activeStudents.forEach(s => {
          map[s.student_id] = { status: 'present', notes: '' }
        })

        // Override with saved database records
        records.forEach((r: any) => {
          if (r.student_id) {
            map[r.student_id] = {
              status: (r.status as AttendanceStatus) || 'present',
              notes: r.notes || ''
            }
          }
        })

        setAttendanceMap(map)
      } catch (err) {
        console.error("Failed to load attendance:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDateAttendance()
  }, [classId, selectedDate])

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }))
    setSaveSuccess(false)
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }))
    setSaveSuccess(false)
  }

  const handleMarkAllPresent = () => {
    const newMap: Record<string, AttendanceRecordState> = { ...attendanceMap }
    activeStudents.forEach(s => {
      newMap[s.student_id] = {
        status: 'present',
        notes: newMap[s.student_id]?.notes || ''
      }
    })
    setAttendanceMap(newMap)
    setSaveSuccess(false)
  }

  const handlePreviousDay = () => {
    const current = new Date(selectedDate + 'T00:00:00')
    current.setDate(current.getDate() - 1)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T00:00:00')
    current.setDate(current.getDate() + 1)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const recordsToSave = activeStudents.map(s => ({
        studentId: s.student_id,
        status: attendanceMap[s.student_id]?.status || 'present',
        notes: attendanceMap[s.student_id]?.notes || ''
      }))

      await saveClassAttendance(classId, selectedDate, recordsToSave)
      setSaveSuccess(true)
    } catch (err: any) {
      alert("Failed to save attendance: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate live summary stats
  const totalStudents = activeStudents.length
  let presentCount = 0
  let absentCount = 0
  let lateCount = 0
  let excusedCount = 0

  activeStudents.forEach(s => {
    const status = attendanceMap[s.student_id]?.status || 'present'
    if (status === 'present') presentCount++
    else if (status === 'absent') absentCount++
    else if (status === 'late') lateCount++
    else if (status === 'excused') excusedCount++
  })

  const presentPercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

  // Check if the selected date is a non-scheduled class day
  const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const selectedDayAbbr = DAY_ABBRS[new Date(selectedDate + 'T00:00:00').getDay()]
  const isOffScheduleDay = scheduleDays.length > 0 && !scheduleDays.includes(selectedDayAbbr)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* ATTENDANCE REGISTER MODAL */}
      {showRegister && (
        <AttendanceRegister
          classId={classId}
          className={className}
          scheduleDays={scheduleDays}
          students={students}
          onClose={() => setShowRegister(false)}
        />
      )}
      
      {/* CONTROL & STATS HEADER CARD */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-[#092B2B] dark:text-white flex items-center gap-3">
              <span>Daily Class Attendance</span>
              {saveSuccess && (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                  ✓ Saved
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Mark student attendance for your class roster. Changes are saved directly to database.
            </p>
          </div>

          {/* Date Picker, Quick Day Controls & View Register button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Register Button */}
            <button
              onClick={() => setShowRegister(true)}
              className="text-xs font-bold text-[#092B2B] dark:text-white bg-[#f4f7f6] dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>View Register</span>
            </button>
            <div className="flex items-center bg-[#f4f7f6] dark:bg-black/50 border border-black/5 dark:border-white/5 rounded-2xl p-1">
              <button
                onClick={handlePreviousDay}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                title="Previous Day"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold px-2 py-1 text-[#092B2B] dark:text-white focus:outline-none cursor-pointer"
              />
              <button
                onClick={handleNextDay}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                title="Next Day"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs font-extrabold px-3 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl transition-all"
            >
              Today
            </button>
          </div>
        </div>

        {/* ⚠️ OFF-SCHEDULE DAY WARNING BANNER */}
        {isOffScheduleDay && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl px-5 py-4 animate-in fade-in duration-200">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {selectedDayAbbr} is not a scheduled class day
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                This class is scheduled on <strong>{scheduleDays.join(', ')}</strong>. Attendance recorded here will be saved but won&apos;t appear in the Register unless you enable &quot;Include off-schedule sessions&quot; in the View Register.
              </p>
            </div>
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#f8faf9] dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-extrabold uppercase text-gray-400">Total Enrolled</p>
            <p className="text-2xl font-black text-[#092B2B] dark:text-white mt-1">{totalStudents}</p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/30">
            <p className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Present</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {presentCount} <span className="text-xs font-bold">({presentPercent}%)</span>
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-800/30">
            <p className="text-[10px] font-extrabold uppercase text-red-800 dark:text-red-300">Absent</p>
            <p className="text-2xl font-black text-red-700 dark:text-red-400 mt-1">{absentCount}</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/30">
            <p className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-300">Late</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{lateCount}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/30 col-span-2 md:col-span-1">
            <p className="text-[10px] font-extrabold uppercase text-blue-800 dark:text-blue-300">Excused</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{excusedCount}</p>
          </div>
        </div>

        {/* QUICK BATCH ACTIONS & SAVE BUTTON */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2">
          <button
            onClick={handleMarkAllPresent}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2.5 rounded-xl transition-all text-center"
          >
            ✓ Mark All Present
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || activeStudents.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-center flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Saving Attendance...</span>
              </>
            ) : (
              <span>Save Attendance Record</span>
            )}
          </button>
        </div>
      </div>

      {/* STUDENT ROSTER ATTENDANCE TABLE */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500 font-medium">Loading class roster attendance...</p>
          </div>
        ) : activeStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            <p className="text-xs text-gray-500 font-medium">No active students enrolled in this class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                  <th className="pb-4 pl-2">Student Name</th>
                  <th className="pb-4 text-center">Attendance Status</th>
                  <th className="pb-4 pr-2">Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                {activeStudents.map((student, idx) => {
                  const currentStatus = attendanceMap[student.student_id]?.status || 'present'
                  const currentNotes = attendanceMap[student.student_id]?.notes || ''

                  return (
                    <tr 
                      key={student.student_id} 
                      className={`transition-colors ${
                        idx % 2 === 1 ? 'bg-emerald-50/40 dark:bg-white/[0.02]' : 'bg-transparent'
                      } hover:bg-emerald-50/70 dark:hover:bg-white/[0.04]`}
                    >
                      {/* Student Name */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {student.profiles?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-[#092B2B] dark:text-white text-sm">
                              {student.profiles?.full_name || 'Enrolled Student'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status Pills Selector */}
                      <td className="py-4 text-center">
                        <div className="inline-flex bg-gray-100 dark:bg-black/50 p-1 rounded-2xl gap-1 border border-black/5 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'present')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-emerald-700 dark:hover:text-emerald-300'
                            }`}
                          >
                            <span>🟢 Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'absent'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-red-700 dark:hover:text-red-300'
                            }`}
                          >
                            <span>🔴 Absent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'late')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-amber-700 dark:hover:text-amber-300'
                            }`}
                          >
                            <span>🟡 Late</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'excused')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'excused'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-blue-700 dark:hover:text-blue-300'
                            }`}
                          >
                            <span>🔵 Excused</span>
                          </button>
                        </div>
                      </td>

                      {/* Notes Input */}
                      <td className="py-4 pr-2">
                        <input
                          type="text"
                          placeholder="Add note (optional)..."
                          value={currentNotes}
                          onChange={e => handleNotesChange(student.student_id, e.target.value)}
                          className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#092B2B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
