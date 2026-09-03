'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toggleAssignmentProgress } from '@/app/student/dashboard/actions'
import Link from 'next/link'

interface AcademicTaskCardProps {
  assignment: any;
  initialProgress: any;
}

export default function AcademicTaskCard({ assignment, initialProgress }: AcademicTaskCardProps) {
  const router = useRouter()
  const target = assignment.content?.target || assignment.target_count || 0
  const unit = assignment.content?.unit || assignment.unit || (assignment.category === 'Reading' ? 'Ayat' : 'Times')
  const startingPoint = initialProgress?.starting_point || 1
  const titleLower = (assignment.title || '').toLowerCase()
  const isReading = assignment.category === 'Reading' || assignment.content?.linkedBookId || assignment.linked_book_id || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('reading')
  const isPercentage = unit === '%' || unit.toLowerCase() === 'percentage' || assignment.tracking_type === 'percentage' || assignment.content?.trackingType === 'percentage'
  const externalUrl = assignment.content?.externalUrl || assignment.external_url || (assignment.content?.linkedBookId === 'external' ? assignment.content?.externalUrl : null)

  const getEffectiveCompletedVal = (prog: any) => {
    if (!prog || prog.completed_value === undefined || prog.completed_value === null) {
      return isPercentage ? 100 : 0
    }
    if (isPercentage && prog.completed_value === 0 && prog.is_completed !== true) {
      return 100
    }
    return prog.completed_value
  }

  const defaultCompletedVal = getEffectiveCompletedVal(initialProgress)

  const defaultIsCompleted = initialProgress?.is_completed !== undefined
    ? initialProgress.is_completed
    : (isPercentage ? defaultCompletedVal === 0 : false)

  const [isCompleted, setIsCompleted] = useState(defaultIsCompleted)
  const [completedValue, setCompletedValue] = useState<number>(defaultCompletedVal)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const val = getEffectiveCompletedVal(initialProgress)
    setCompletedValue(val)
    if (initialProgress?.is_completed !== undefined) {
      setIsCompleted(initialProgress.is_completed)
    } else if (isPercentage) {
      setIsCompleted(val === 0)
    }
  }, [initialProgress?.is_completed, initialProgress?.completed_value, isPercentage])

  const formatUnitAndPoint = (u: string, pt: number, isReadingItem: boolean = true) => {
    if (isPercentage || u === '%' || u.toLowerCase() === 'percentage') {
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

  const getReadingLink = () => {
    const linked = assignment.content?.linkedBookId || assignment.linked_book_id
    const param = `?assignmentId=${assignment.id}&startRoba=${startingPoint}`
    const basePath = assignment.class_id === null ? '/student/personal-library' : '/student/library'
    
    if (linked === 'quran' || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('surah') || titleLower.includes('juz') || titleLower.includes('ayah')) {
      return `${basePath}/quran${param}`
    }
    if (linked && linked !== 'quran' && linked !== 'external') {
      return `${basePath}/${linked}${param}`
    }
    if (titleLower.includes('tafsir') || titleLower.includes('anwar')) return `${basePath}/7${param}`
    if (titleLower.includes('hadith') || titleLower.includes('riyad')) return `${basePath}/9${param}`
    if (titleLower.includes('fiqh')) return `${basePath}/cont-fiqh${param}`
    if (titleLower.includes('history') || titleLower.includes('caliph')) return `${basePath}/cont-history${param}`
    return `${basePath}/quran${param}`
  }

  const handleMarkDone = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const prevCompleted = isCompleted
    const prevVal = completedValue
    const incrementAmount = target > 0 ? target : 1

    // Optimistic UI update immediately
    if (isCompleted) {
      setCompletedValue((prev: number) => prev + incrementAmount)
    } else {
      setIsCompleted(true)
      setCompletedValue(Math.max(completedValue, incrementAmount))
    }

    try {
      await toggleAssignmentProgress(assignment.id, true, null)
      router.refresh()
    } catch (e) {
      console.error(e)
      setIsCompleted(prevCompleted)
      setCompletedValue(prevVal)
    }
    
    setIsSubmitting(false)
  }

  const handleAddPercentage = async (step: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const prevCompleted = isCompleted
    const prevVal = completedValue
    const newVal = Math.max(0, Math.min(100, completedValue - step))
    const newCompleted = newVal === 0

    setCompletedValue(newVal)
    setIsCompleted(newCompleted)

    try {
      await toggleAssignmentProgress(assignment.id, newCompleted, newVal)
      router.refresh()
    } catch (e) {
      console.error(e)
      setIsCompleted(prevCompleted)
      setCompletedValue(prevVal)
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={`bg-white dark:bg-black/40 rounded-2xl border ${isCompleted ? 'border-primary-500/30' : 'border-black/5 dark:border-white/5'} shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md relative overflow-hidden`}>
      
      {/* Optional Success Background Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/10 pointer-events-none"></div>
      )}

      {/* Left Side: Title and Priority / Progress */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-3 mb-1.5">
          <h3 className={`font-bold ${isCompleted ? 'text-primary-800 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
            {assignment.title}
          </h3>
          {target > 0 && !isPercentage && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 shrink-0">
              {completedValue}/{target} {unit}
            </span>
          )}
        </div>
        
        {/* Starting Point Indicator for Reading & Quran Assignments */}
        {isReading && (
          <div className="mt-1 mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span>✨ Today's Starting Point:</span>
            <span className="underline decoration-emerald-500/60 font-mono">
              {formatUnitAndPoint(unit, startingPoint)}
            </span>
          </div>
        )}

        {/* Due indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {isCompleted 
            ? (isReading 
                ? `Completed today (Started at ${formatUnitAndPoint(unit, startingPoint, true)})` 
                : `Completed today (${formatUnitAndPoint(unit, startingPoint, false)})`) 
            : 'Due today'}
        </div>

        {/* Percentage Progress Bar */}
        {isPercentage && (
          <div className="w-full mt-2.5 max-w-xs">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500 dark:text-gray-400">Current Level</span>
              <span className={completedValue === 0 ? 'text-emerald-600 dark:text-emerald-400 font-mono font-black' : 'text-orange-600 font-mono font-bold'}>
                {completedValue}% → 0%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="h-full transition-all duration-500 rounded-full"
                style={{ 
                  width: `${Math.min(100, completedValue)}%`,
                  backgroundColor: completedValue > 50 ? '#ef4444' : completedValue > 0 ? '#f97316' : '#22c55e'
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Celebratory Exceeded Goal Message */}
        {((target > 0 && completedValue >= target && !isPercentage) || (isPercentage && completedValue === 0)) && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-2.5 font-bold truncate bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
            <span>🎉</span>
            <span className="truncate">
              {isPercentage
                ? `MashAllah! You reached 0% today!`
                : completedValue > target 
                ? `MashAllah! Goal done (+${completedValue - target} ${unit.toLowerCase() === 'times' ? '' : unit.toLowerCase() + ' '}extra) • Next: ${formatUnitAndPoint(unit, startingPoint + completedValue, isReading)}`
                : `MashAllah! Today's goal complete • Next: ${formatUnitAndPoint(unit, startingPoint + completedValue, isReading)}`
              }
            </span>
          </p>
        )}
      </div>

      {/* Right Side: Action Buttons */}
      <div className="z-10 shrink-0 flex items-center gap-2 sm:self-center self-end">
        {isReading && !isCompleted && (
          externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <span>🔗 Open Book Link ›</span>
            </a>
          ) : (
            <Link
              href={getReadingLink()}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <span>Read Online ›</span>
            </Link>
          )
        )}
        {isPercentage ? (
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {completedValue > 0 ? (
              <>
                <button 
                  onClick={() => handleAddPercentage(10)} 
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  -10%
                </button>
                <button 
                  onClick={() => handleAddPercentage(25)} 
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  -25%
                </button>
                <button 
                  onClick={() => handleAddPercentage(50)} 
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  -50%
                </button>
                <button 
                  onClick={() => handleAddPercentage(completedValue)} 
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-[#bdf3df] hover:bg-[#a1ead0] text-[#0a6c4c] text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  0% Done
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-sm cursor-default">
                  ✓ 0% Reached
                </span>
                <button 
                  onClick={() => handleAddPercentage(-25)} 
                  disabled={isSubmitting}
                  title="Add back 25%"
                  className="text-xs text-gray-400 hover:text-gray-600 underline font-semibold transition-colors"
                >
                  +25%
                </button>
              </div>
            )}
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-2">
            <button disabled className="bg-primary-100 text-primary-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-default flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Done
            </button>
          </div>
        ) : (
          <button 
            onClick={handleMarkDone}
            disabled={isSubmitting}
            className="bg-[#bdf3df] hover:bg-[#a1ead0] text-[#0a6c4c] font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            {isSubmitting ? '...' : 'Mark Done'}
          </button>
        )}
      </div>
    </div>
  )
}
