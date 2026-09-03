'use client'


import PageHeader from '@/components/ui/PageHeader'

import { useState } from 'react'
import CreateAssignmentButton from '@/components/CreateAssignmentButton'
import { deleteAssignment } from '@/app/teacher/class/[id]/actions'

type AssignmentInfo = {
  id: string
  class_id: string
  category: string
  title: string
  tracking_type: string
  target_count?: number
  unit?: string
  content: any
  is_daily: boolean
  created_at: string
  classes?: {
    name: string
  } | null
}

export default function AssignmentsListClient({
  initialAssignments,
  classes,
  books
}: {
  initialAssignments: AssignmentInfo[]
  classes: { id: string; name: string; is_active?: boolean }[]
  books: any[]
}) {
  const activeClasses = classes.filter(c => c.is_active !== false)
  
  const [assignments, setAssignments] = useState<AssignmentInfo[]>(initialAssignments)
  const [selectedClassId, setSelectedClassId] = useState(activeClasses.length > 0 ? activeClasses[0].id : '')
  const [classFilter, setClassFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter books to send to the assignment modal for library reading selector
  const activeClassBooks = books.filter(b => b.class_id === selectedClassId)

  // Handle assignment delete
  const handleDelete = async (id: string, title: string, classId: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await deleteAssignment(id, classId)
      // Optimistic state update
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (error: any) {
      alert(`Failed to delete assignment: ${error.message || error}`)
    }
  }

  // Filter assignments list
  const filteredAssignments = assignments.filter(a => {
    const matchesClass = classFilter === 'all' || a.class_id === classFilter
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesClass && matchesCategory && matchesSearch
  })

  // List of unique categories for the filters
  const categories = ["Zikr", "Reading", "Prayer", "Nawafil", "Sport", "Munkarat"]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER SECTION */}
      <div className="border-b border-black/5 dark:border-white/5 pb-6">
        <PageHeader
          breadcrumb="PORTAL / ASSIGNMENTS"
          title="Habits & Tasks"
          subtitle="Manage daily assignments, prayer trackers, recitation goals, and spiritual metrics across your classrooms."
          className="mb-0"
          actions={
            activeClasses.length > 0 ? (
              <div className="bg-white dark:bg-black/30 p-3.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="min-w-[160px]">
                  <label className="block text-[9px] font-extrabold uppercase text-gray-400 tracking-wider mb-1">Target Classroom</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full bg-[#f4f7f6] dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {activeClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:pt-4 shrink-0">
                  <CreateAssignmentButton classId={selectedClassId} books={activeClassBooks} />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300">
                Create an active class first before creating assignments.
              </div>
            )
          }
        />
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f4f7f6] dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-[#f4f7f6] dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Classes</option>
              {activeClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#f4f7f6] dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* ASSIGNMENTS GRID */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-black/20 p-16 rounded-3xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-4 text-emerald-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold">No Assignments</h3>
          <p className="opacity-70 text-xs max-w-xs mt-1">There are no assignments matching your selection. Select a class above to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map(a => {
            return (
              <div 
                key={a.id}
                className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between gap-4 group"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                      {a.category}
                    </span>
                    <span className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide inline-flex items-center gap-1"><svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 v5m-4 0h4" /></svg><span>{a.classes?.name || "Classroom"}</span></span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-[#092B2B] dark:text-white truncate group-hover:text-primary-600 transition-colors">
                    {a.title}
                  </h3>
                  
                  <p className="text-xs text-gray-500 font-medium">
                    {(a.tracking_type === 'percentage' || a.content?.unit === '%' || a.unit === '%' || a.content?.trackingType === 'percentage')
                      ? `Target: 0% (Spiritual Detox)`
                      : a.tracking_type === 'counter'
                      ? `Target: ${a.content?.target ?? a.target_count ?? 0} ${a.content?.unit || a.unit || ''}`
                      : 'Daily Checkbox Habit'}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(a.id, a.title, a.class_id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                  title="Delete Assignment"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}