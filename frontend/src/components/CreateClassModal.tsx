'use client'

import { useState } from 'react'
import { createNewClass } from '@/app/teacher/dashboard/actions'

export default function CreateClassModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // We store the newly generated code to show the user!
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  // Schedule state
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [scheduleTime, setScheduleTime] = useState('')

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleClose = () => {
    setIsOpen(false)
    setGeneratedCode(null)
    setError(null)
    setSelectedDays([])
    setScheduleTime('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    // Append selected days as a JSON string so we can parse in the action
    formData.set('schedule_days', JSON.stringify(selectedDays))
    formData.set('schedule_time', scheduleTime)

    const result = await createNewClass(formData)

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.success && result.class) {
      // Show the generated code to the teacher so they can share it!
      setGeneratedCode(result.class.class_code)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-primary-700 hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap"
      >
        + Create New Class
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold">Create New Class</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              
              {/* If a code was generated, show the success screen! */}
              {generatedCode ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-2xl font-bold">Class Created!</h3>
                  <p className="opacity-70">Share this code with your students so they can join:</p>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 my-6 border border-gray-200 dark:border-gray-700">
                    <span className="text-4xl font-mono font-bold tracking-[0.2em] text-primary-700 dark:text-primary-400">
                      {generatedCode}
                    </span>
                  </div>

                  <button 
                    onClick={handleClose}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Otherwise, show the creation form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-70">Class Name</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="e.g. Morning Quran Class"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-70">Description (Optional)</label>
                    <textarea 
                      name="description"
                      rows={2}
                      placeholder="What is this class about?"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  {/* Schedule Section */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Class Schedule <span className="text-xs font-normal text-gray-400">(Optional — can be set later)</span></p>

                    {/* Day Toggles */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Meeting Days</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              selectedDays.includes(day)
                                ? 'bg-primary-700 border-primary-700 text-white shadow-sm'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      {selectedDays.length > 0 && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1.5">
                          Selected: {selectedDays.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 rounded-lg font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 rounded-lg font-medium bg-primary-700 hover:bg-primary-800 text-white transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Class'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
