'use client'

import { useState } from 'react'
import CreateAssignmentModal from './CreateAssignmentModal'

export default function CreateAssignmentButton({ classId, books = [] }: { classId: string, books?: any[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary-500 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-bold transition-colors group"
      >
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
        <div className="text-left">
          <p className="text-lg">Create Assignment</p>
          <p className="text-xs opacity-70 font-medium">Assign Zikr, Reading, etc.</p>
        </div>
      </button>

      {/* The Dynamic Modal */}
      <CreateAssignmentModal isOpen={isOpen} setIsOpen={setIsOpen} classId={classId} books={books} />
    </>
  )
}
