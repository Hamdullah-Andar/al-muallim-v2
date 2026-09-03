'use client'

import { useState } from 'react'
import { toggleAssignmentProgress } from '@/app/student/dashboard/actions'

export default function AssignmentCard({ assignment, initialProgress }: any) {
  const [isCompleted, setIsCompleted] = useState(initialProgress?.is_completed || false)
  const [isLoading, setIsLoading] = useState(false)
  
  const isCounter = assignment.tracking_type === 'counter'
  const target = assignment.content?.target

  const handleToggle = async () => {
    if (isLoading) return
    setIsLoading(true)
    const newStatus = !isCompleted
    setIsCompleted(newStatus)
    
    // Pass target value if completing a counter, else 0
    const qty = isCounter ? (newStatus ? target : 0) : null

    try {
      await toggleAssignmentProgress(assignment.id, newStatus, qty)
    } catch (e) {
      console.error(e)
      setIsCompleted(!newStatus)
      alert("Network error: Failed to save progress")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isLoading}
      // Using the exact styling from the desktop mockup: light gray rounded box, content left, circle checkbox right
      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
        isCompleted 
          ? 'bg-primary-50/50 dark:bg-primary-900/10' 
          : 'bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      <div>
        <h4 className={`font-bold text-sm ${isCompleted ? 'text-black/50 dark:text-white/50 line-through' : ''}`}>
          {assignment.title}
        </h4>
        
        <div className="flex items-center gap-2 mt-1 opacity-60 text-xs font-medium">
          <span className="capitalize">{assignment.category}</span>
          <span>•</span>
          <span>{assignment.classes?.name}</span>
          
          {isCounter && (
            <>
              <span>•</span>
              <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Target: {target} {assignment.content?.unit}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Circle Checkbox on the right (matching the desktop mockup) */}
      <div className="flex-shrink-0 ml-4 relative">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted 
            ? 'bg-primary-600 border-primary-600 text-white' 
            : 'border-black/20 dark:border-white/20 bg-white dark:bg-black'
        }`}>
          {isCompleted && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          )}
        </div>
        {isLoading && (
          <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
        )}
      </div>
    </button>
  )
}
