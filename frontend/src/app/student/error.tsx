'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center animate-in fade-in zoom-in duration-700">
      
      {/* Icon Area */}
      <div className="relative mb-12">
        <div className="w-32 h-32 bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800/60 flex items-center justify-center relative z-10">
          <svg className="w-16 h-16 text-[#0a6c4c] dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             {/* Alert / Warning Icon */}
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <h1 className="text-4xl md:text-5xl font-bold text-[#0a6c4c] dark:text-emerald-400 mb-4 tracking-tight">An Unexpected Obstacle</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
        It seems there was a temporary disruption in fetching your data. The path will clear shortly.
      </p>
      
      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-12">
        ERROR 500 — CONNECTION DISRUPTED
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 w-full max-w-md">
        <button onClick={() => reset()} className="flex items-center justify-center gap-3 bg-[#0a6c4c] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#085a3f] transition-colors shadow-lg shadow-[#0a6c4c]/20 flex-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <div className="text-left leading-tight">
            <span className="block text-xs font-normal opacity-80">Attempt</span>
            Try Again
          </div>
        </button>

        <Link href="/login" className="flex items-center justify-center gap-3 bg-[#bdf3df] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-400 px-8 py-4 rounded-2xl font-bold hover:bg-[#a6eed3] transition-colors flex-1">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <div className="text-left leading-tight">
            <span className="block text-xs font-normal opacity-80">Return to</span>
            Dashboard
          </div>
        </Link>
      </div>

      {/* Quote */}
      <p className="text-sm text-gray-400 dark:text-gray-500 italic max-w-lg mx-auto leading-relaxed">
        "Seeking knowledge is a journey that never truly ends, even when the road takes an unexpected turn."
      </p>

    </div>
  )
}
