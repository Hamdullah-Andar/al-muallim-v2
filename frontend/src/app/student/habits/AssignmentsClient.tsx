'use client'

import PageHeader from '@/components/ui/PageHeader'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'

interface AssignmentsClientProps {
  user: any;
  profile: any;
  assignments: any[];
  classMap: Record<string, { id: string; name: string; description: string }>;
  initialProgress: any[];
  todayDateStr: string;
}

export default function AssignmentsClient({
  user,
  profile,
  assignments,
  classMap,
  initialProgress,
  todayDateStr
}: AssignmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Pending' | 'Completed'>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // Map progress into a fast lookup
  const progressMap = useMemo(() => {
    const map: Record<string, any> = {}
    initialProgress.forEach(p => {
      map[p.assignment_id] = p
    })
    return map
  }, [initialProgress])

  // Helper to determine if an assignment is completed today
  const isAssignmentCompleted = (assignment: any) => {
    const prog = progressMap[assignment.id]
    if (!prog) return false

    const unit = assignment.content?.unit || assignment.unit || ''
    const isPercentage = unit === '%' || unit.toLowerCase() === 'percentage' || assignment.tracking_type === 'percentage' || assignment.content?.trackingType === 'percentage'
    if (isPercentage) {
      return prog.is_completed === true || (prog.completed_value === 0 && prog.is_completed === true)
    }

    // Prayer bitmask check
    if (assignment.title?.toLowerCase().includes('prayer')) {
      const mask = prog.completed_value || 0
      return mask === 31 // 1+2+4+8+16
    }

    // Zikr check
    const target = assignment.content?.target || assignment.target_count || 0
    if (target > 0) {
      return (prog.completed_value || 0) >= target
    }

    return prog.is_completed === true
  }

  // Helper to get numeric progress info
  const getProgressInfo = (assignment: any) => {
    const prog = progressMap[assignment.id]
    const unit = assignment.content?.unit || assignment.unit || (assignment.category === 'Reading' ? 'Ayat' : 'Times')
    const isPercentage = unit === '%' || unit.toLowerCase() === 'percentage' || assignment.tracking_type === 'percentage' || assignment.content?.trackingType === 'percentage'
    const completedVal = (prog?.completed_value !== undefined && prog?.completed_value !== null && !(isPercentage && prog?.completed_value === 0 && prog?.is_completed !== true))
      ? prog.completed_value
      : (isPercentage ? 100 : 0)
    
    if (isPercentage) {
      return { current: completedVal, target: 0, unit: '%' }
    }

    if (assignment.title?.toLowerCase().includes('prayer')) {
      let count = 0
      const mask = completedVal
      if (mask & 1) count++
      if (mask & 2) count++
      if (mask & 4) count++
      if (mask & 8) count++
      if (mask & 16) count++
      return { current: count, target: 5, unit: 'Prayers' }
    }

    const target = assignment.content?.target || assignment.target_count || 0
    if (target > 0) {
      return { current: completedVal, target, unit }
    }

    return { current: prog?.is_completed ? 1 : 0, target: 1, unit: 'Task' }
  }

  // Categorize assignment into clean, practical categories
  const getCategory = (assignment: any): string => {
    // 1. Honor explicit DB category if set
    if (assignment.category && assignment.category.trim() !== '') {
      const dbCat = assignment.category.trim().toLowerCase()
      if (dbCat === 'zikr' || dbCat === 'dhikr') return 'Zikr'
      if (dbCat === 'reading' || dbCat === 'quran') return 'Reading'
      if (dbCat === 'prayer' || dbCat === 'prayers') return 'Prayer'
      if (dbCat === 'nawafil') return 'Nawafil'
      if (dbCat === 'sport' || dbCat === 'sports') return 'Sport'
      if (dbCat === 'munkarat' || dbCat === 'mankirat') return 'Munkarat'
      return 'Custom'
    }

    const t = assignment.title?.toLowerCase() || ''
    if (t.includes('prayer') || t.includes('salah')) return 'Prayer'
    if (t.includes('nawafil')) return 'Nawafil'
    if (t.includes('quran') || t.includes('surah') || t.includes('juz') || t.includes('ayah') || t.includes('reading')) return 'Reading'
    if (t.includes('sport') || t.includes('exercise')) return 'Sport'
    if (t.includes('munkar')) return 'Munkarat'
    if (
      t.includes('zikr') ||
      t.includes('dhikr') ||
      t.includes('astaghfirullah') ||
      t.includes('subhanallah') ||
      t.includes('alhamdulillah') ||
      t.includes('la elaha') ||
      t.includes('la ilaha') ||
      t.includes('allahu') ||
      t.includes('salawat') ||
      t.includes('darood') ||
      t.includes('tasbeeh')
    ) {
      return 'Zikr'
    }

    // Fallback: If it uses a counter / target > 1, classify as Zikr
    const target = assignment.content?.target || assignment.target_count || 0
    if (assignment.tracking_type === 'counter' || target > 1) {
      return 'Zikr'
    }

    return 'Custom'
  }

  const getReadingLink = (assignment: any) => {
    const titleLower = (assignment.title || '').toLowerCase()
    const linked = assignment.content?.linkedBookId || assignment.linked_book_id
    const startRoba = progressMap[assignment.id]?.starting_point || 1
    const param = `?assignmentId=${assignment.id}&startRoba=${startRoba}`
    if (linked === 'quran' || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('surah') || titleLower.includes('juz') || titleLower.includes('ayah')) {
      return `/student/library/quran${param}`
    }
    if (linked && linked !== 'quran' && linked !== 'external') {
      return `/student/library/${linked}${param}`
    }
    if (titleLower.includes('tafsir') || titleLower.includes('anwar')) return `/student/library/7${param}`
    if (titleLower.includes('hadith') || titleLower.includes('riyad')) return `/student/library/9${param}`
    if (titleLower.includes('fiqh')) return `/student/library/cont-fiqh${param}`
    if (titleLower.includes('history') || titleLower.includes('caliph')) return `/student/library/cont-history${param}`
    return `/student/library/quran${param}`
  }

  const formatUnitAndPoint = (u: string, pt: number, isReadingItem: boolean = true) => {
    if (u === '%' || u.toLowerCase() === 'percentage') {
      return `${pt}%`
    }
    if (u.toLowerCase() === 'roba') {
      const j = Math.ceil(pt / 4)
      const r = ((pt - 1) % 4) + 1
      return `Juz ${j} • Roba #${r}`
    }
    if (!isReadingItem && u.toLowerCase() === 'times') {
      return `Day #${pt}`
    }
    if (!isReadingItem) {
      return `Day #${pt}`
    }
    return `${u} #${pt}`
  }

  // Practical, clean list of categories for filtering
  const filterCategories = ['All', 'Zikr', 'Reading', 'Prayer', 'Nawafil', 'Sport', 'Munkarat', 'Custom']

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchTitle = assignment.title?.toLowerCase().includes(q)
        const matchClass = classMap[assignment.class_id]?.name.toLowerCase().includes(q)
        if (!matchTitle && !matchClass) return false
      }

      // 2. Category Filter
      const cat = getCategory(assignment)
      if (selectedCategory !== 'All' && cat !== selectedCategory) {
        return false
      }

      // 3. Status Filter
      const completed = isAssignmentCompleted(assignment)
      if (selectedStatus === 'Completed' && !completed) return false
      if (selectedStatus === 'Pending' && completed) return false

      return true
    })
  }, [assignments, searchQuery, selectedCategory, selectedStatus, classMap, progressMap])

  // Stats calculation
  const totalCount = assignments.length
  const completedCount = assignments.filter(a => isAssignmentCompleted(a)).length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE))
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAssignments.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAssignments, currentPage])

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fbfbfb] dark:bg-[#0a0a0a]">
      <div className="px-4 md:px-8 pt-4 md:pt-8">
        <PageHeader
          breadcrumb="STUDENT PORTAL / MY HABITS"
          title="Master Habits Library"
          subtitle="Track and complete all daily habits, Quran recitations, and spiritual trackers."
          actions={
            <span className="text-xs font-black bg-[#dcf5ea] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-300 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {totalCount} Total Habits
            </span>
          }
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="p-8 max-w-[1200px] w-full mx-auto space-y-8">
        
        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#111] p-7 rounded-[28px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Assignments</p>
              <h3 className="text-4xl font-black text-[#092B2B] dark:text-white">{totalCount}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#eafaf4] dark:bg-emerald-950/40 flex items-center justify-center text-[#0a6c4c] dark:text-emerald-400 shadow-sm">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111] p-7 rounded-[28px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Completed Today</p>
              <h3 className="text-4xl font-black text-[#092B2B] dark:text-white">{completedCount}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#eafaf4] dark:bg-emerald-950/40 flex items-center justify-center text-[#0a6c4c] dark:text-emerald-400 shadow-sm">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111] p-7 rounded-[28px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Overall Completion</p>
              <h3 className="text-4xl font-black text-[#092B2B] dark:text-white">{completionRate}%</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH + SEGMENTED TABS + CATEGORIES */}
        <div className="bg-white dark:bg-[#111] p-7 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-lg">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search assignments or class name..." 
                className="w-full bg-[#f8f9fa] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:border-primary-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all"
              />
            </div>

            {/* Segmented Filter Control (All Tasks / Pending / Completed) */}
            <div className="flex items-center bg-[#f0f3f6] dark:bg-white/5 p-1.5 rounded-2xl">
              {[
                { id: 'All', label: 'All Tasks' },
                { id: 'Pending', label: 'Pending (To Do)' },
                { id: 'Completed', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(tab.id as any)
                    setCurrentPage(1)
                  }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedStatus === tab.id 
                      ? 'bg-white dark:bg-[#222] text-[#092B2B] dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {filterCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setCurrentPage(1)
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#092B2B] dark:bg-primary-500 text-white shadow-md shadow-black/10'
                    : 'bg-[#eef3f1] dark:bg-white/5 text-[#2e5d52] dark:text-gray-300 hover:bg-[#dfebe6] dark:hover:bg-white/10'
                }`}
              >
                {cat === 'All' ? 'All Tasks' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* ASSIGNMENTS LIST */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-[#111] rounded-[32px] p-12 text-center border border-black/5 dark:border-white/5">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No assignments found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                No tasks match your selected filter criteria. Try choosing a different category or clearing your search.
              </p>
            </div>
          ) : (
            <>
              {paginatedAssignments.map(assignment => {
                const cls = classMap[assignment.class_id]
                const completed = isAssignmentCompleted(assignment)
                const progInfo = getProgressInfo(assignment)
                const isPct = progInfo.unit === '%' || progInfo.unit.toLowerCase() === 'percentage'
                const pct = isPct ? Math.min(100, progInfo.current) : (progInfo.target > 0 ? Math.min(100, Math.round((progInfo.current / progInfo.target) * 100)) : 0)
                const cat = getCategory(assignment)

                const prog = progressMap[assignment.id]
                const startingPoint = prog?.starting_point || 1
                const externalUrl = assignment.content?.externalUrl || assignment.external_url || (assignment.content?.linkedBookId === 'external' ? assignment.content?.externalUrl : null)

                return (
                  <div 
                    key={assignment.id}
                    className="bg-white dark:bg-[#111] rounded-[28px] border border-black/5 dark:border-white/5 p-7 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    {/* Left Column: Badges & Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-[#eef1f4] dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          {cls?.name || 'EVENING CLASS'}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-[#dcf5ea] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-300">
                          {cat === 'Homework' ? 'READING' : cat.toUpperCase()}
                        </span>
                      </div>

                      <h3 className={`text-xl font-bold ${completed ? 'text-gray-400 line-through' : 'text-[#092B2B] dark:text-white'}`}>
                        {assignment.title}
                      </h3>

                      {/* Starting Point Indicator */}
                      {(cat === 'Reading' || assignment.content?.linkedBookId || assignment.linked_book_id) && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                          <span className="inline-flex items-center gap-1"><svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Today's Starting Point:</span>
                          <span className="underline decoration-emerald-500/60 font-mono">
                            {formatUnitAndPoint(progInfo.unit, startingPoint)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Middle & Right Column: Progress + Action Button */}
                    <div className="flex items-center gap-8 shrink-0 w-full md:w-auto justify-between md:justify-end">
                      <div className="w-56">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-[#092B2B] dark:text-gray-300">
                            {progInfo.unit === '%' || progInfo.unit.toLowerCase() === 'percentage'
                              ? `${progInfo.current === 0 ? "100% Avoided" : progInfo.current + "%"}`
                              : `${progInfo.current} / ${progInfo.target} ${progInfo.unit}`}
                          </span>
                        </div>
                        <div className="w-full bg-[#edf1f4] dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: (progInfo.unit === '%' || progInfo.unit.toLowerCase() === 'percentage')
                                ? (progInfo.current > 50 ? '#ef4444' : progInfo.current > 0 ? '#f97316' : '#22c55e')
                                : '#064e3b'
                            }}
                          ></div>
                        </div>
                        {((progInfo.unit !== '%' && progInfo.current > progInfo.target) || ((progInfo.unit === '%' || progInfo.unit.toLowerCase() === 'percentage') && progInfo.current === 0)) && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 font-bold truncate bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                            <span>ðŸŽ‰</span>
                            <span className="truncate">
                              {(progInfo.unit === '%' || progInfo.unit.toLowerCase() === 'percentage')
                                ? `MashAllah! You reached 0% today!`
                                : `MashAllah! Goal done (+${progInfo.current - progInfo.target} ${progInfo.unit.toLowerCase() === 'times' ? '' : progInfo.unit.toLowerCase() + ' '}extra) â€¢ Next: ${formatUnitAndPoint(progInfo.unit, startingPoint + progInfo.current, cat === 'Reading' || Boolean(assignment.content?.linkedBookId) || Boolean(assignment.linked_book_id))}`}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Action Button: Read Online & Go to Class */}
                      <div className="shrink-0 flex items-center gap-3">
                        {(cat === 'Reading' || assignment.content?.linkedBookId || assignment.linked_book_id) && !completed && (
                          externalUrl ? (
                            <a
                              href={externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20 shadow-sm transition-all"
                            >
                              <span>ðŸ”— Open Book Link â€º</span>
                            </a>
                          ) : (
                            <Link
                              href={getReadingLink(assignment)}
                              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20 shadow-sm transition-all"
                            >
                              <span className="inline-flex items-center gap-1.5">Read Online <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
                            </Link>
                          )
                        )}
                        {completed ? (
                          <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs bg-[#dcf5ea] text-[#0a6c4c] dark:bg-emerald-900/40 dark:text-emerald-300">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            <span>Completed</span>
                          </div>
                        ) : (
                          <Link
                            href={`/student/class/${assignment.class_id}`}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs bg-[#033c2b] text-white hover:bg-[#064e3b] shadow-sm transition-all"
                          >
                            <span className="inline-flex items-center gap-1.5">Go to Class <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* SLEEK PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 px-2">
                  <p className="text-xs font-bold text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssignments.length)} of {filteredAssignments.length} assignments
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentPage === 1 
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous</span>
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                            currentPage === page
                              ? 'bg-[#033c2b] text-white shadow-sm'
                              : 'bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1"><span>Next</span><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FLOATING ACTION BUTTON (New Task Request) */}
        <div className="fixed bottom-8 right-8 flex items-center gap-3 z-30">
          <button
            type="button"
            onClick={() => alert('New Task Request feature coming soon!')}
            className="flex items-center gap-3 bg-[#033c2b] text-white pl-5 pr-2 py-2 rounded-full shadow-lg hover:bg-[#064e3b] transition-all group"
          >
            <span className="text-xs font-bold tracking-wide">New Task Request</span>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
