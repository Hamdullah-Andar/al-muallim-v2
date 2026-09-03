'use client'

import { useState } from 'react'
import { togglePrayerMask } from '@/app/student/dashboard/actions'

interface DailyPrayersCardProps {
  assignment: any;
  initialProgress: any;
  nextPrayer: { name: string, time: string };
}

export default function DailyPrayersCard({ assignment, initialProgress, nextPrayer }: DailyPrayersCardProps) {
  const [mask, setMask] = useState(initialProgress?.completed_value || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const prayers = [
    { name: 'Fajr', value: 1 },
    { name: 'Dhuhr', value: 2 },
    { name: 'Asr', value: 4 },
    { name: 'Maghrib', value: 8 },
    { name: 'Isha', value: 16 }
  ]

  // Determine which prayers are unlocked.
  // If nextPrayer is Asr, then Fajr and Dhuhr are unlocked.
  const nextIdx = prayers.findIndex(p => p.name === nextPrayer.name)
  // If nextIdx is 0 (Fajr), it could be before Fajr today (0 unlocked) or after Isha (all 5 unlocked).
  // We can use a simple client-side check for hours to differentiate.
  const currentHour = new Date().getHours()
  const isPastIsha = nextIdx === 0 && currentHour > 12 // If it's Fajr next but hour is PM, all are unlocked.
  
  const handleToggle = async (value: number, locked: boolean) => {
    if (locked || isSubmitting) return
    setIsSubmitting(true)

    // Toggle the bit
    const isChecked = (mask & value) !== 0
    const newMask = isChecked ? (mask & ~value) : (mask | value)

    setMask(newMask) // Optimistic UI

    try {
      await togglePrayerMask(assignment?.id, newMask)
    } catch (e) {
      setMask(mask) // Revert on failure
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between border-l-8 border-l-[#0a6c4c] mb-10">
      
      {/* Left Side */}
      <div className="flex items-center gap-4 mb-4 md:mb-0">
         <div className="w-14 h-14 rounded-full bg-[#bdf3df] flex items-center justify-center text-[#0a6c4c]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
         </div>
         <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Prayers</h3>
            <div className="mt-1">
               <span className="bg-[#bdf3df] text-[#0a6c4c] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                 Next: {nextPrayer.name} - {nextPrayer.time}
               </span>
            </div>
         </div>
      </div>

      {/* Right Side: Prayer Circles */}
      <div className="flex items-center gap-3 md:gap-4">
         {prayers.map((prayer, idx) => {
            const isChecked = (mask & prayer.value) !== 0
            
            // It is locked if its index is >= the nextPrayer index (unless past Isha)
            const isLocked = !isPastIsha && idx >= nextIdx

            return (
               <div key={prayer.name} className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => handleToggle(prayer.value, isLocked)}
                    disabled={isLocked || isSubmitting}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                       isLocked
                         ? 'border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-700 cursor-not-allowed'
                         : isChecked
                            ? 'border-[#0a6c4c] bg-[#0a6c4c] text-white'
                            : 'border-[#0a6c4c] bg-transparent text-[#0a6c4c] hover:bg-[#bdf3df]/30'
                    }`}
                  >
                     {isLocked ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                     ) : isChecked ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     ) : null}
                  </button>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isLocked ? 'text-gray-300 dark:text-gray-700' : 'text-gray-600 dark:text-gray-400'}`}>
                    {prayer.name}
                  </span>
               </div>
            )
         })}
      </div>
      
    </div>
  )
}
