'use client'

import { useState, useRef } from 'react'
import { incrementZikrProgress } from '@/app/student/dashboard/actions'

interface ZikrTrackerRowProps {
  assignment: any;
  initialProgress: any;
}

export default function ZikrTrackerRow({ assignment, initialProgress }: ZikrTrackerRowProps) {
  const [count, setCount] = useState(initialProgress?.completed_value || 0)
  const [isCompleted, setIsCompleted] = useState(initialProgress?.is_completed || false)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Read target from content.target (where createAssignment stores it),
  // fall back to top-level target_count, then 200 as last resort.
  const targetCount = assignment.content?.target || assignment.target_count || 200

  const handleIncrement = () => {
    if (isCompleted) return

    // Visual animation logic
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)

    setCount((prevCount: number) => {
      const newCount = prevCount + 1
      const newlyCompleted = newCount >= targetCount
      
      if (newlyCompleted) {
        setIsCompleted(true)
      }

      // Debounce the server action to prevent flooding the backend on rapid clicks
      if (timerRef.current) clearTimeout(timerRef.current)
      
      timerRef.current = setTimeout(async () => {
        try {
          // Send the absolute new count to the server
          await incrementZikrProgress(assignment.id, newCount, newlyCompleted)
        } catch (e) {
          console.error('Failed to sync Zikr progress:', e)
          // Revert state if the server absolutely failed
          setCount(prevCount)
          setIsCompleted(prevCount >= targetCount)
        }
      }, 600) // 600ms debounce window

      return newCount
    })
  }

  const progressPercentage = Math.min((count / targetCount) * 100, 100)

  return (
    <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-5 flex items-center justify-between transition-all hover:shadow-md">
      {/* Left Side: Title and Progress Bar */}
      <div className="flex-1 mr-6">
        <div className="flex justify-between items-end mb-3">
          <h3 className={`font-bold text-lg ${isCompleted ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
            {assignment.title}
          </h3>
          <div className="flex items-center gap-2">
            {count > targetCount && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                +{count - targetCount} Bonus
              </span>
            )}
            <span className="text-sm font-bold text-gray-500">
              {count > targetCount ? targetCount : count}/{targetCount}
            </span>
          </div>
        </div>
        
        {/* Sleek Progress Bar */}
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${isCompleted ? 'bg-primary-500' : 'bg-[#0a6c4c]'}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {count > targetCount && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3 font-medium leading-relaxed">
            MashAllah! You've exceeded your goal. Extra counts recorded as bonus.
          </p>
        )}
      </div>

      {/* Right Side: Circular Plus Button */}
      <button 
        onClick={handleIncrement}
        disabled={isCompleted}
        className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all ${
          isCompleted 
            ? 'bg-primary-100 text-primary-500 cursor-default' 
            : `bg-[#bdf3df]/60 hover:bg-[#bdf3df] text-[#0a6c4c] shadow-sm hover:shadow active:scale-95 ${isAnimating ? 'scale-90 bg-primary-200' : ''}`
        }`}
      >
        {isCompleted ? (
           <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        ) : (
           <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        )}
      </button>
    </div>
  )
}
