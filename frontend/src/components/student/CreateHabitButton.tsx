'use client'

import { useState } from 'react'
import CreatePersonalHabitModal from './CreatePersonalHabitModal'

export default function CreateHabitButton({ books }: { books?: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Create Habit
      </button>

      <CreatePersonalHabitModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen}
        books={books}
      />
    </>
  )
}
