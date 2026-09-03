'use client'


import PageHeader from '@/components/ui/PageHeader'

import { useState } from 'react'
import Link from 'next/link'
import CreateClassModal from '@/components/CreateClassModal'

type ClassInfo = {
  id: string
  name: string
  description: string
  classCode: string
  isActive: boolean
  studentCount: number
  dailyAssignmentsCount: number
  createdAt: string
  schedule_days?: string[] | null
  schedule_time?: string | null
}

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

  return { category, gradient }
}

function formatClassSchedule(days: string[] | null | undefined, time: string | null | undefined): string {
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

export default function ClassesListClient({
  classes,
  teacherName
}: {
  classes: ClassInfo[]
  teacherName: string
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter classes based on active state and search query
  const filteredClasses = classes.filter(c => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && c.isActive) || 
      (filter === 'archived' && !c.isActive)

    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Calculate statistics
  const totalClasses = classes.length
  const activeCount = classes.filter(c => c.isActive).length
  const archivedCount = totalClasses - activeCount
  const totalStudents = classes.reduce((sum, c) => sum + (c.isActive ? c.studentCount : 0), 0)

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert(`Class code ${code} copied to clipboard!`)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER SECTION */}
      <PageHeader
        breadcrumb="PORTAL / MY CLASSES"
        title="Classrooms Directory"
        subtitle="Manage your courses, view student rosters, and configure daily spiritual goals."
        actions={<CreateClassModal />}
      />

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Total Classes</p>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white">{totalClasses}</h3>
        </div>
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Active Classrooms</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</h3>
        </div>
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Archived Classes</p>
          <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{archivedCount}</h3>
        </div>
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Total Enrolled Students</p>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white">{totalStudents}</h3>
        </div>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Toggle Pills */}
        <div className="flex bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm p-1.5 rounded-2xl overflow-x-auto shrink-0">
          {[
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'archived', label: `Archived (${archivedCount})` },
            { id: 'all', label: `All (${totalClasses})` }
          ].map(tab => {
            const isActive = filter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search class name or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0a6c4c] transition-all focus:outline-none"
          />
        </div>
      </div>

      {/* CLASSES GRID */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white dark:bg-black/40 p-16 rounded-3xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">No Classrooms Found</h3>
          <p className="opacity-70 text-sm max-w-sm mb-6">We couldn't find any classes matching your criteria. Try adjusting your search query or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClasses.map((c, index) => {
            const { category, gradient } = getClassVisuals(c.name, index)
            const scheduleDisplay = formatClassSchedule(c.schedule_days, c.schedule_time)

            return (
              <div 
                key={c.id}
                className={`group bg-white dark:bg-[#1a1a1a] rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/5 hover:shadow-md transition-all duration-300 flex flex-col min-w-0 ${
                  !c.isActive ? 'opacity-80' : ''
                }`}
              >
                {/* Premium Banner */}
                <div className={`h-32 bg-gradient-to-r ${gradient} relative flex items-end p-5 overflow-hidden`}>
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[#092B2B] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {category}
                    </span>
                    {!c.isActive && (
                      <span className="bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        ðŸ”’ Closed
                      </span>
                    )}
                  </div>
                  {/* Decorative Background Pattern */}
                  <div className="absolute right-0 bottom-0 top-0 w-32 bg-white/5 rounded-l-full blur-xl transform translate-x-12"></div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#092B2B] dark:text-white mb-2 tracking-tight line-clamp-1 group-hover:text-primary-600 transition-colors">{c.name}</h3>
                  <p className="text-xs opacity-60 text-gray-500 line-clamp-2 mb-6 min-h-[32px]">{c.description || 'Welcome to this class.'}</p>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-gray-500 font-bold uppercase tracking-wider border-t border-black/5 dark:border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <span>{c.studentCount} Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="truncate normal-case font-medium">{scheduleDisplay}</span>
                    </div>
                  </div>

                  {/* Class Code & Action Buttons */}
                  <div className="flex items-center justify-between gap-4 mt-auto border-t border-black/5 dark:border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Code:</span>
                      <button 
                        onClick={() => handleCopyCode(c.classCode)}
                        className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/20 dark:hover:bg-primary-950/40 text-[#092B2B] dark:text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-primary-200/50 dark:border-emerald-800/20 flex items-center gap-1.5 transition-colors"
                        title="Click to copy class key"
                      >
                        {c.classCode}
                        <svg className="w-3.5 h-3.5 opacity-65" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h5" /></svg>
                      </button>
                    </div>

                    <Link href={`/teacher/class/${c.id}`} className="shrink-0">
                      <button className="bg-[#bdf3df] hover:bg-[#a6edd4] dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-[#092B2B] dark:text-emerald-400 px-5 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-sm">
                        Manage
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </Link>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}