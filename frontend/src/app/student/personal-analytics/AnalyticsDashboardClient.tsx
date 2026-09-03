'use client'

function renderSubjectIcon(title: string) {
  const t = (title || '').toLowerCase()
  if (t.includes('nawafil') || t.includes('sunnah')) {
    return (
      <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )
  }
  if (t.includes('quran') || t.includes('recitation') || t.includes('read')) {
    return (
      <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  }
  if (t.includes('guarding') || t.includes('senses') || t.includes('munkarat')) {
    return (
      <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
  if (t.includes('adhkar') || t.includes('zikr') || t.includes('duas')) {
    return (
      <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  }
  return (
    <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

import PageHeader from '@/components/ui/PageHeader'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsDashboardClient({
  currentStreak,
  overallCompletion,
  streakDiffText,
  xp,
  chartData,
  prayerStats,
  zikrStats,
  calendarData,
  displaySubjects,
  customAssignments,
  userId,
  userName
}: {
  currentStreak: number
  overallCompletion: number
  streakDiffText: string
  xp: number
  chartData: any[]
  prayerStats: { totalTracked: number, target: number, percentage: number, congregation: number, history?: any[] }
  zikrStats: { name: string, count: number }[]
  calendarData: Record<string, number>
  displaySubjects: { title: string, score: string, icon: string, description?: string }[]
  customAssignments?: { id: string, title: string, category: string, completedThisWeek: number, totalCompleted: number, percentage: number, icon: string }[]
  userId?: string
  userName?: string
}) {
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly')
  const [showPrayerModal, setShowPrayerModal] = useState(false)

  // Always use the real completion value
  const displayCompletion = overallCompletion;

  // Chart data - always use real data for accuracy
  const displayChartData = chartData;

  // Always show real prayer stats
  const displayPrayerStats = prayerStats;

  // Always show real zikr stats
  const displayZikrStats = zikrStats;

  // Always show real custom assignment stats
  const displayCustomAssignments = customAssignments;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-sans w-full min-w-0 overflow-x-hidden">
      
      <PageHeader
        breadcrumb="STUDENT PORTAL / PERSONAL ANALYTICS"
        title="Performance Overview"
        subtitle="Your spiritual and academic growth for this term."
        actions={
          <div className="flex bg-[#F4F7F7] dark:bg-gray-900 p-1 rounded-full border border-gray-200 dark:border-gray-800">
            {["Daily", "Weekly", "Monthly"].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  timeRange === range
                    ? "bg-white dark:bg-black text-[#092B2B] dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        }
      />
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full min-w-0">
        {/* Current Streak */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center gap-5 min-w-0 w-full overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#DCF6EB] flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#0a6c4c]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13.07 4.8 13.56 2.84C13.65 2.5 13.31 2.19 13.01 2.36C12.19 2.84 11.45 3.48 10.84 4.2C8.75 6.64 8.04 9.94 8.72 13C8.77 13.25 8.44 13.43 8.24 13.26C7.54 12.65 7.04 11.85 6.77 10.96C6.68 10.65 6.22 10.64 6.09 10.93C5.1 13.24 5.37 16.03 6.94 18.06C8.21 19.7 10.02 20.72 12.03 20.93C15.11 21.25 18.23 19.52 19.5 16.66C20.31 14.86 19.56 12.65 17.66 11.2V11.2Z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Current Streak</p>
            <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white">{currentStreak} Days</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{streakDiffText}</p>
          </div>
        </div>

        {/* Overall Completion */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center gap-5 min-w-0 w-full overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F0F8] flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#21618C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Overall Completion</p>
            <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white">{displayCompletion}%</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              {displayCompletion >= 90 ? "Top 5% of your class ðŸŽ‰" : displayCompletion >= 80 ? "Top 15% of your class ðŸŒŸ" : displayCompletion >= 70 ? "Top 30% of your class ðŸ‘" : "Building momentum ðŸ”¥"}
            </p>
          </div>
        </div>

        {/* Next Milestone */}
        {(() => {
          let nextTarget = 500;
          let levelName = "Lvl 2 Talib";
          if (xp >= 500) { nextTarget = 1000; levelName = "Lvl 3 Hafiz"; }
          if (xp >= 1000) { nextTarget = 2500; levelName = "Lvl 4 Alim"; }
          if (xp >= 2500) { nextTarget = 5000; levelName = "Lvl 5 Scholar"; }
          if (xp >= 5000) { nextTarget = 10000; levelName = "Lvl 6 Muallim"; }
          const xpNeeded = Math.max(0, nextTarget - xp);
          const xpPercentage = Math.min(100, Math.round((xp / nextTarget) * 100));

          return (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-800/60 flex flex-col justify-center min-w-0 w-full overflow-hidden">
              <div className="flex justify-between items-end mb-4">
                <p className="text-xs font-bold text-gray-500">Next Milestone</p>
                <h3 className="text-xl font-extrabold text-[#092B2B] dark:text-white">{xp} XP</h3>
              </div>
              
              <div className="w-full bg-[#F4F7F7] dark:bg-gray-800 h-2.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#092B2B] dark:bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">{xpNeeded} XP to reach {levelName}</p>
            </div>
          );
        })()}
      </div>

      {/* Consistency Matrix */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-4 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800/60 mb-8 min-w-0 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Consistency Matrix
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-[#F4F7F7] dark:bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-[#bdf3df] dark:bg-emerald-900"></div>
            <div className="w-3 h-3 rounded-sm bg-[#7de3ba] dark:bg-emerald-700"></div>
            <div className="w-3 h-3 rounded-sm bg-[#0a6c4c] dark:bg-emerald-500"></div>
            <div className="w-3 h-3 rounded-sm bg-[#06422e] dark:bg-emerald-300"></div>
            <span>More</span>
          </div>
        </div>

        {/* GitHub style calendar (Mocked visually for MVP) */}
        <div className="flex gap-2 sm:gap-4 w-full min-w-0">
          <div className="flex flex-col gap-[7px] text-[10px] text-gray-400 font-bold mt-[20px] flex-shrink-0">
            <span className="h-[14px] flex items-center">Mon</span>
            <span className="h-[14px] flex items-center">Tue</span>
            <span className="h-[14px] flex items-center">Wed</span>
            <span className="h-[14px] flex items-center">Thu</span>
            <span className="h-[14px] flex items-center">Fri</span>
            <span className="h-[14px] flex items-center">Sat</span>
            <span className="h-[14px] flex items-center">Sun</span>
          </div>
          <div className="flex-1 min-w-0 overflow-x-auto pb-4">
            <div className="flex gap-2 min-w-max">
              {Array.from({ length: 45 }).map((_, weekIdx) => {
                // Determine if a new month starts in this week column
                const getColumnMonth = (wIdx: number) => {
                  const d = new Date();
                  d.setDate(d.getDate() - ((44 - wIdx) * 7 + 6));
                  return d.toLocaleString('default', { month: 'short' });
                };
                
                const currentMonth = getColumnMonth(weekIdx);
                const prevMonth = weekIdx > 0 ? getColumnMonth(weekIdx - 1) : null;
                const showMonth = weekIdx === 0 || currentMonth !== prevMonth;

                return (
                  <div key={weekIdx} className="flex flex-col gap-2">
                    {/* Month Label */}
                    <div className="h-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest relative">
                      {showMonth ? currentMonth : ''}
                    </div>
                  {/* Days */}
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const shades = ['bg-[#F4F7F7] dark:bg-gray-800', 'bg-[#bdf3df] dark:bg-emerald-900', 'bg-[#7de3ba] dark:bg-emerald-700', 'bg-[#0a6c4c] dark:bg-emerald-500', 'bg-[#06422e] dark:bg-emerald-300'];
                    
                    // Calculate exact date for this cell (ending at today on the right)
                    const daysAgo = (44 - weekIdx) * 7 + (6 - dayIdx);
                    const cellDate = new Date();
                    cellDate.setDate(cellDate.getDate() - daysAgo);
                    const dateStr = cellDate.toISOString().split('T')[0];
                    
                    const count = calendarData[dateStr] || 0;
                    let shadeIndex = 0;
                    if (count === 1) shadeIndex = 1;
                    if (count === 2) shadeIndex = 2;
                    if (count === 3) shadeIndex = 3;
                    if (count >= 4) shadeIndex = 4;
                    
                    return (
                      <div key={dayIdx} title={`${dateStr}: ${count} tasks completed`} className={`w-[14px] h-[14px] rounded-[3px] transition-all ${shades[shadeIndex]}`}></div>
                    );
                  })}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      {/* Prayers and Zikr Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full min-w-0">
        
        {/* Weekly Prayers */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 min-w-0 w-full overflow-hidden">
          <div className="relative w-36 h-36 flex items-center justify-center">
             {/* Background Circle */}
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[#F4F7F7] dark:text-gray-800" />
               {/* Progress Circle */}
               <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="12" fill="transparent" 
                 strokeDasharray={2 * Math.PI * 62} 
                 strokeDashoffset={2 * Math.PI * 62 * (1 - prayerStats.percentage / 100)} 
                 className="text-[#092B2B] dark:text-emerald-500 transition-all duration-1000 ease-out" 
                 strokeLinecap="round"
               />
             </svg>
             <div className="absolute flex flex-col items-center justify-center">
               <span className="text-3xl font-extrabold text-[#092B2B] dark:text-white">{displayPrayerStats.percentage}%</span>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Completed</span>
             </div>
          </div>
          
          <div className="flex-1 w-full">
            <h3 className="text-sm font-bold text-gray-500 mb-6">{timeRange} Prayers</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Total Tracked</span>
                <span className="font-bold text-[#092B2B] dark:text-white">{displayPrayerStats.totalTracked} / {displayPrayerStats.target}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Congregation</span>
                <span className="font-bold text-[#092B2B] dark:text-white">{displayPrayerStats.congregation}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setShowPrayerModal(true)}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>

        {/* Zikr Performance */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800/60 min-w-0 w-full overflow-hidden">
          <h3 className="text-sm font-bold text-gray-500 mb-8">Zikr Performance</h3>
          
          <div className="space-y-6">
            {(() => {
              if (displayZikrStats.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 font-bold">No Zikr habits created yet.</p>
                  </div>
                )
              }
              const maxZikr = Math.max(100, ...displayZikrStats.map(z => z.count));
              return displayZikrStats.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="text-[#092B2B] dark:text-white">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (item.count / maxZikr) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
        
      </div>

      {/* Academic Progress Area Chart */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800/60 mb-8 min-w-0 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Academic Progress</h3>
            <p className="text-xs text-gray-500">Weekly study hours & performance</p>
          </div>
          <div className="flex gap-8">
            {(() => {
              let grade = "In Progress";
              if (displayCompletion >= 95) grade = "A+";
              else if (displayCompletion >= 90) grade = "A";
              else if (displayCompletion >= 85) grade = "A-";
              else if (displayCompletion >= 80) grade = "B+";
              else if (displayCompletion >= 75) grade = "B";
              else if (displayCompletion >= 70) grade = "C+";
              else if (displayCompletion >= 60) grade = "C";
              else if (displayCompletion > 0) grade = "D";

              return (
                <>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Grade</p>
                    <p className="text-2xl font-extrabold text-[#092B2B] dark:text-white">{grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completion</p>
                    <p className="text-2xl font-extrabold text-[#092B2B] dark:text-white">{displayCompletion}%</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#092B2B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#092B2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.05em' }} dy={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#092B2B', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#092B2B" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorScore)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Spiritual Pillars Cards */}
      <div className="mb-4 w-full min-w-0">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Core Spiritual Pillars</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full min-w-0">
          {displaySubjects.map((subject, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-800/60 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group min-w-0 w-full overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F7F7] dark:bg-gray-800 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {renderSubjectIcon(subject.title)}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{subject.title}</h4>
              {subject.description && <p className="text-[10px] text-gray-400 font-medium mb-3">{subject.description}</p>}
              <span className="text-xs font-extrabold text-[#092B2B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">{subject.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom & Additional Assignments Breakdown */}
      {customAssignments && customAssignments.length > 0 && (
        <div className="mb-8 w-full min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Additional & Custom Assignments</h3>
              <p className="text-xs text-gray-500">Weekly consistency for Nawafils, readings, and daily habits</p>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex-shrink-0">
              {customAssignments.length} Active {customAssignments.length === 1 ? 'Habit' : 'Habits'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">
            {displayCustomAssignments?.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center justify-between hover:shadow-md transition-all duration-300 group min-w-0 w-full overflow-hidden">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4F7F7] dark:bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {renderSubjectIcon(item.title)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md mb-1 inline-block">
                      {item.category || 'General'}
                    </span>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate" title={item.title}>{item.title}</h4>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{item.completedThisWeek} of 7 days completed this week</p>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0 ml-4">
                  <span className="text-lg font-extrabold text-[#092B2B] dark:text-emerald-400">{item.percentage}%</span>
                  <span className="text-[10px] font-bold text-gray-400">{timeRange} Avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Prayer Details Modal */}
      {showPrayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#092B2B] text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-arabic">7-Day Prayer Breakdown</h3>
                <p className="text-xs text-emerald-200 mt-0.5">Detailed view of your Daily Salah consistency</p>
              </div>
              <button 
                onClick={() => setShowPrayerModal(false)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                      <th className="py-3 px-2">Day</th>
                      <th className="py-3 px-2 text-center">Fajr</th>
                      <th className="py-3 px-2 text-center">Dhuhr</th>
                      <th className="py-3 px-2 text-center">Asr</th>
                      <th className="py-3 px-2 text-center">Maghrib</th>
                      <th className="py-3 px-2 text-center">Isha</th>
                      <th className="py-3 px-2 text-right">Daily Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                    {prayerStats.history?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="py-3 px-2 font-bold text-gray-800 dark:text-gray-200">
                          {item.day} <span className="text-[10px] font-normal text-gray-400">({item.date.slice(5)})</span>
                        </td>
                        {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pr, i) => (
                          <td key={i} className="py-3 px-2 text-center">
                            {item[pr] ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#DCF6EB] text-[#0a6c4c] dark:bg-emerald-900/50 dark:text-emerald-400 font-bold text-xs">✓</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 text-xs">-</span>
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-2 text-right font-extrabold text-[#092B2B] dark:text-white">
                          {item.total} / 5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
                <span>Total prayers completed this week: <strong className="text-gray-900 dark:text-white">{prayerStats.totalTracked} / {prayerStats.target}</strong></span>
                <button 
                  onClick={() => setShowPrayerModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#092B2B] text-white font-bold hover:bg-[#0a3f3f] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}