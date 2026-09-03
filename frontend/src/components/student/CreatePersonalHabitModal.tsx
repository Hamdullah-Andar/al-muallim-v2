'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPersonalHabit } from '@/app/student/dashboard/actions'

export default function CreatePersonalHabitModal({ 
  isOpen, 
  setIsOpen,
  books = []
}: { 
  isOpen: boolean, 
  setIsOpen: (v: boolean) => void,
  books?: any[]
}) {
  const router = useRouter()
  const [category, setCategory] = useState('Zikr')
  const [customCategory, setCustomCategory] = useState('')
  const [trackingType, setTrackingType] = useState<'checkbox' | 'counter' | 'percentage'>('counter')
  const [readingSource, setReadingSource] = useState<'library' | 'quran' | 'link'>('quran')
  const [externalUrl, setExternalUrl] = useState('')
  const [selectedBookId, setSelectedBookId] = useState(books && books.length > 0 ? books[0].id : '')
  const [portionUnit, setPortionUnit] = useState('Ayah')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    // If the tracking type radios are hidden, we must append the state value manually!
    if (category === 'Prayer') {
      formData.set('trackingType', trackingType)
    } else if (category === 'Reading') {
      formData.set('trackingType', 'counter')
      formData.set('target', (formData.get('readingTarget') || '1') as string)
      formData.set('unit', portionUnit)
      formData.set('linkedBookId', readingSource === 'library' ? selectedBookId : readingSource === 'link' ? 'external' : 'quran')
      if (readingSource === 'link') {
        formData.set('externalUrl', externalUrl.trim())
      }
      // Ensure title is descriptive if not customized
      if (!formData.get('title')) {
        let bookName = 'Library Book'
        if (readingSource === 'library') {
          const foundBook = books?.find(b => b.id === selectedBookId)
          if (foundBook) bookName = foundBook.title
        } else if (readingSource === 'link') {
          bookName = 'External Book Reading'
        } else {
          bookName = 'Holy Quran Recitation'
        }
        
        formData.set('title', `${bookName} (${formData.get('readingTarget') || '1'} ${portionUnit} daily)`)
      }
    } else if (trackingType === 'percentage' || category === 'Munkarat') {
      formData.set('trackingType', 'percentage')
      formData.set('target', '0')
      formData.set('unit', '%')
    } else {
      formData.set('trackingType', trackingType)
    }

    // If they selected Custom, use their typed-in category name or fallback to 'Custom'
    if (category === 'Custom') {
      formData.set('category', customCategory.trim() || 'Custom')
    }

    try {
      await createPersonalHabit(formData)
      router.refresh()
      setIsOpen(false)
      alert(`Personal habit created successfully!`)
      // Reset form defaults for next time
      setCategory('Zikr')
      setCustomCategory('')
      setTrackingType('counter')
    } catch (error: any) {
      console.error(error)
      alert(`Failed to create personal habit: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-filled dynamic categories based on user feedback
  const categories = ["Zikr", "Reading", "Prayer", "Nawafil", "Sport", "Munkarat", "Custom"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-emerald-700 dark:bg-emerald-900 p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-arabic">Create Personal Habit</h2>
            <p className="text-emerald-100 text-sm mt-1">Set a personal daily goal for yourself</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Step 1: Category Selection */}
          <div>
            <label className="block text-sm font-bold mb-2 opacity-80">Category</label>
            <select 
              name="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                if (e.target.value === 'Prayer') {
                  setTrackingType('checkbox')
                } else if (e.target.value === 'Munkarat') {
                  setTrackingType('percentage')
                } else if (e.target.value !== 'Custom' && e.target.value !== 'Reading') {
                  setTrackingType('counter')
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium appearance-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Optional: Custom Category Input */}
          {category === 'Custom' && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold mb-2 opacity-80">Custom Category Name</label>
              <input 
                type="text" 
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                required
                placeholder="e.g., Charity"
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Step 2: Task Title */}
          <div>
            <label className="block text-sm font-bold mb-2 opacity-80">Task Title</label>
            {category === 'Prayer' ? (
              <input 
                key="readonly-title"
                type="text" 
                name="title"
                readOnly
                value="Five time Jamat prayer"
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-70 cursor-not-allowed outline-none font-bold"
              />
            ) : (
              <input 
                key="editable-title"
                type="text" 
                name="title"
                required
                placeholder={
                  category === 'Munkarat' ? "e.g., Telling Lies Prevention or Avoid 5-Sense Munkarat" :
                  category === 'Zikr' ? "e.g., Astaghfirullah" : 
                  category === 'Reading' ? "e.g., Daily Recitation / Tafsir Portion" : 
                  "What exactly should they do?"
                }
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            )}
          </div>

          {/* SPECIALIZED READING & QURAN CONFIGURATION */}
          {category === 'Reading' && (
            <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 62v12m8-8H4" /></svg>
                <span>Reading / Scripture Source</span>
              </div>

              {/* Source Radio Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReadingSource('quran')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${readingSource === 'quran' ? 'border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold' : 'border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                >
                  <span className="text-base">ðŸ“–</span>
                  <span className="text-xs font-bold leading-tight">Quran</span>
                  <span className="text-[9px] opacity-75 leading-tight">Quran.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReadingSource('library')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${readingSource === 'library' ? 'border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold' : 'border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                >
                  <span className="text-base">ðŸ“š</span>
                  <span className="text-xs font-bold leading-tight">Library</span>
                  <span className="text-[9px] opacity-75 leading-tight">Academy Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReadingSource('link')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${readingSource === 'link' ? 'border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold' : 'border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                >
                  <span className="text-base">ðŸ”—</span>
                  <span className="text-xs font-bold leading-tight">Ext. Link</span>
                  <span className="text-[9px] opacity-75 leading-tight">URL / Drive</span>
                </button>
              </div>

              {/* Library Book Dropdown */}
              {readingSource === 'library' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Select Book from Library</label>
                  <select
                    value={selectedBookId}
                    onChange={e => setSelectedBookId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-medium outline-none"
                  >
                    {books && books.length > 0 ? (
                      books.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))
                    ) : (
                      <option value="" disabled>No books uploaded to class library yet</option>
                    )}
                  </select>
                </div>
              )}

              {/* External Book Link Input */}
              {readingSource === 'link' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">External Book / Document URL</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={e => setExternalUrl(e.target.value)}
                    required
                    placeholder="https://sunnah.com/riyadussalihin or Drive link..."
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-medium outline-none"
                  />
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">Saves storage! Students open link online/offline and mark progress when done.</p>
                </div>
              )}

              {/* Portion Unit & Target Count */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/10">
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Portion Unit</label>
                  <select
                    value={portionUnit}
                    onChange={e => setPortionUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-medium outline-none"
                  >
                    <option value="Ayah">Ayah / Ayat</option>
                    <option value="Roba">Roba / Quarter</option>
                    <option value="Hadith">Hadith</option>
                    <option value="Page">Page(s)</option>
                    <option value="Chapter">Chapter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Daily Portion Goal</label>
                  <input
                    type="number"
                    name="readingTarget"
                    defaultValue="1"
                    min="1"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-bold outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tracking Type Selector (Hidden for Prayer and Reading) */}
          {category !== 'Prayer' && category !== 'Reading' && (
            <div>
              <label className="block text-sm font-bold mb-3 opacity-80">How is this tracked?</label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center text-center transition-all ${trackingType === 'counter' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-black/5 dark:border-white/5 hover:border-black/20'}`}>
                  <input type="radio" name="trackingType" value="counter" checked={trackingType === 'counter'} onChange={() => setTrackingType('counter')} className="hidden" />
                  <span className="text-2xl mb-1">ðŸ”¢</span>
                  <span className="font-bold text-xs">Target Number</span>
                  <span className="text-[10px] opacity-60 mt-0.5">Has exact count</span>
                </label>
                <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center text-center transition-all ${trackingType === 'checkbox' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-black/5 dark:border-white/5 hover:border-black/20'}`}>
                  <input type="radio" name="trackingType" value="checkbox" checked={trackingType === 'checkbox'} onChange={() => setTrackingType('checkbox')} className="hidden" />
                  <span className="text-2xl mb-1">âœ…</span>
                  <span className="font-bold text-xs">Done / Not Done</span>
                  <span className="text-[10px] opacity-60 mt-0.5">Simple checkbox</span>
                </label>
                <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center text-center transition-all ${trackingType === 'percentage' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-black/5 dark:border-white/5 hover:border-black/20'}`}>
                  <input type="radio" name="trackingType" value="percentage" checked={trackingType === 'percentage'} onChange={() => setTrackingType('percentage')} className="hidden" />
                  <span className="text-2xl mb-1">ðŸ“Š</span>
                  <span className="font-bold text-xs">Percentage (%)</span>
                  <span className="text-[10px] opacity-60 mt-0.5">Reduce 100% â†’ 0%</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Dynamic Fields (Only shows if Counter is selected and not Reading!) */}
          {trackingType === 'counter' && category !== 'Munkarat' && category !== 'Prayer' && category !== 'Reading' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-80">Target Count</label>
                <input 
                  type="number" 
                  name="target"
                  required
                  min="1"
                  placeholder="e.g., 200"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 opacity-80">Unit</label>
                <input 
                  type="text" 
                  name="unit"
                  required
                  placeholder={
                    category === 'Zikr' ? "Times" : 
                    category === 'Sport' ? "Minutes" : "Unit"
                  }
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Assignment
                </>
              )}
            </button>
            <p className="text-center text-xs opacity-60 mt-3 font-medium text-primary-600 dark:text-primary-400">
              This assignment will automatically repeat daily.
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
