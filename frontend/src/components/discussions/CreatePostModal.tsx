'use client'

import React, { useState } from 'react'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, message: string, isAnnouncement: boolean) => Promise<void>
  isTeacher: boolean
}

export default function CreatePostModal({ isOpen, onClose, onSubmit, isTeacher }: CreatePostModalProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(title, message, isTeacher && isAnnouncement)
      setTitle('')
      setMessage('')
      setIsAnnouncement(false)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-[#092B2B] dark:text-white">
          {isTeacher ? 'Create New Post or Announcement' : 'Start a Discussion'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
              placeholder="What's this discussion about?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-colors min-h-[120px] resize-y"
              placeholder={isTeacher ? "Write your announcement or discussion topic here..." : "Ask a question or share something with the class..."}
              required
            />
          </div>

          {isTeacher && (
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 accent-primary-600"
              />
              <div>
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Make this an Announcement</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Announcements will be highlighted and filterable for students.</span>
              </div>
            </label>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#bdf3df] text-[#092B2B] hover:bg-[#a6edd4] dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
