'use client'

import PageHeader from '@/components/ui/PageHeader'

import { useState } from 'react'
import Link from 'next/link'

type ClassData = {
  id: string
  name: string
  description: string
  teacherId: string
  teacherName: string
  category: string
  imageUrl: string
  progress: number          // this week's completion %
  lastWeekProgress: number  // last week's completion %
  trend: 'up' | 'down' | 'same'
  isActive?: boolean
}

export default function ClassesClient({
  classes,
  userId,
  userName
}: {
  classes: ClassData[]
  userId: string
  userName: string
}) {
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed'>('All')
  const [sortType, setSortType] = useState<'Most Recent' | 'Highest Progress' | 'Lowest Progress'>('Most Recent')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Filter classes based on selected tab
  // "In Progress" = class is still active (teacher hasn't archived it)
  // "Completed"   = class has been archived/closed by the teacher
  // This mirrors the teacher-side filter which uses isActive status
  const filteredClasses = classes.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'In Progress') return c.isActive === true;
    if (filter === 'Completed') return c.isActive === false;
    return true;
  });

  // Sort classes based on selected sort type
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortType === 'Highest Progress') return b.progress - a.progress;
    if (sortType === 'Lowest Progress') return a.progress - b.progress;
    // Default 'Most Recent' sorting by ID (just for simulation since we don't have created_at)
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-sans w-full min-w-0 overflow-x-hidden">
      
      <PageHeader
        breadcrumb="PORTAL / JOINED CLASSES"
        title="Continue Your Journey"
        subtitle={`You have ${classes.length} active classes. Stay consistent with your daily learning goals and keep progressing.`}
        actions={
          <Link href="/student/join">
            <button className="bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Join New Class
            </button>
          </Link>
        }
      />
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        {/* Toggle Pills */}
        <div className="flex bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {['All Classes', 'In Progress', 'Completed'].map(tab => {
            const isActive = filter === (tab === 'All Classes' ? 'All' : tab)
            return (
              <button
                key={tab}
                onClick={() => setFilter((tab === 'All Classes' ? 'All' : tab) as any)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="relative shrink-0">
           <button 
             onClick={() => setShowSortDropdown(!showSortDropdown)}
             className="flex items-center gap-2 bg-[#F4F7F7] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
           >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              Sort: {sortType}
              <svg className={`w-3.5 h-3.5 ml-1 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
           </button>
           
           {showSortDropdown && (
             <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden z-20">
               {['Most Recent', 'Highest Progress', 'Lowest Progress'].map((option) => (
                 <button
                   key={option}
                   onClick={() => {
                     setSortType(option as any)
                     setShowSortDropdown(false)
                   }}
                   className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${
                     sortType === option 
                       ? 'bg-gray-50 dark:bg-gray-800 text-[#092B2B] dark:text-emerald-500' 
                       : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                   }`}
                 >
                   {option}
                 </button>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full min-w-0">
        
        {sortedClasses.map((item, idx) => (
          <div key={idx} className={`bg-white dark:bg-[#1a1a1a] rounded-[28px] overflow-hidden shadow-sm border border-black/5 dark:border-white/5 hover:shadow-md transition-all duration-300 flex flex-col min-w-0 group ${item.isActive === false ? 'opacity-85' : ''}`}>
            {/* Card Image Banner */}
            <div className="h-44 w-full relative overflow-hidden bg-gray-100">
               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-[#092B2B]/90 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full">
                     {item.category}
                  </span>
                  {item.isActive === false && (
                    <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1">
                      ðŸ”’ Archived / Closed
                    </span>
                  )}
               </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xl font-bold text-[#092B2B] dark:text-white tracking-tight line-clamp-1">{item.name}</h3>
                 <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1 shrink-0">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                 </button>
               </div>

               {/* Instructor */}
               <div className="flex items-center gap-2 mb-8">
                 <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.teacherId}`} alt="Teacher" className="w-full h-full object-cover" />
                 </div>
                 <p className="text-xs font-bold text-gray-500 truncate">{item.teacherName}</p>
               </div>
               
               <div className="mt-auto">
                 {/* Weekly Completion + Trend */}
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">This Week</span>
                   <span className="flex items-center gap-1">
                     <span className="text-xs font-extrabold text-[#092B2B] dark:text-emerald-400">{item.progress}%</span>
                     {/* Trend arrow */}
                     {item.trend === 'up' && (
                       <span title={`+${item.progress - item.lastWeekProgress}% vs last week`}
                         className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                         {item.lastWeekProgress > 0 ? `${item.progress - item.lastWeekProgress}%` : 'New'}
                       </span>
                     )}
                     {item.trend === 'down' && (
                       <span title={`${item.progress - item.lastWeekProgress}% vs last week`}
                         className="flex items-center gap-0.5 text-[10px] font-extrabold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">
                         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                         {item.progress - item.lastWeekProgress}%
                       </span>
                     )}
                     {item.trend === 'same' && item.progress > 0 && (
                       <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                         Same
                       </span>
                     )}
                   </span>
                 </div>
                 
                 {/* Completion Bar */}
                 <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${
                       item.progress === 0 ? 'bg-gray-200' :
                       item.progress >= 80 ? 'bg-emerald-500' :
                       item.progress >= 50 ? 'bg-[#092B2B]' : 'bg-amber-400'
                     }`}
                     style={{ width: `${Math.max(item.progress, 2)}%` }}
                   ></div>
                 </div>

                 {/* Action Button */}
                 <Link href={`/student/class/${item.id}`} className="block w-full">
                   <button className="w-full bg-[#bdf3df] hover:bg-[#a6edd4] dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-[#092B2B] dark:text-emerald-400 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                     {item.isActive === false ? 'View Closed Class' : 'Continue Learning'}
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </button>
                 </Link>
               </div>
            </div>
          </div>
        ))}

        {/* Explore New Ghost Card */}
        <div className="bg-transparent border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[28px] overflow-hidden hover:border-[#092B2B]/20 dark:hover:border-emerald-500/20 transition-all duration-300 flex flex-col min-w-0 group cursor-pointer min-h-[380px]">
           <Link href="/student/join" className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFA] dark:bg-[#111] hover:bg-[#F0F4F4] dark:hover:bg-gray-900/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-black border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-[#bdf3df] dark:group-hover:bg-emerald-900/40 text-[#092B2B] dark:text-emerald-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#092B2B] dark:text-white tracking-tight mb-2">Explore New</h3>
              <p className="text-xs text-gray-500 font-medium max-w-[200px] mx-auto leading-relaxed">
                Browse our catalog of classes and enrich your Islamic knowledge.
              </p>
           </Link>
        </div>

      </div>

    </div>
  )
}