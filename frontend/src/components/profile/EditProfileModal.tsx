'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile } from '@/app/actions/profile'

interface EditProfileModalProps {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  userName: string
  userEmail?: string
  userRole: string
}

export default function EditProfileModal({
  isOpen,
  setIsOpen,
  userName,
  userEmail = 'user@al-muallim.org',
  userRole,
}: EditProfileModalProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(userName)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.set('fullName', fullName)
      await updateUserProfile(formData)
      router.refresh()
      setIsOpen(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const initial = (fullName || userName || 'U').charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0c1212] border border-black/10 dark:border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {initial}
            </div>
            <div>
              <h3 className="text-xl font-bold">{fullName || 'User Profile'}</h3>
              <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {userRole} Account
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Editable Field: Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
              Full Name <span className="text-emerald-500 font-normal lowercase">(editable)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* Read Only Field: Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Read-Only
              </span>
            </div>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 text-sm font-medium cursor-not-allowed"
            />
          </div>

          {/* Read Only Field: Role */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Portal Role
              </label>
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                System Verified
              </span>
            </div>
            <div className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 text-sm font-bold capitalize flex items-center justify-between">
              <span>{userRole} Account</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
