'use client'

import React, { useState } from 'react'
import TopNavbar from '@/components/ui/TopNavbar'
import StudentSidebar from '@/components/student/StudentSidebar'

interface StudentLayoutClientProps {
  profileName: string
  userEmail?: string
  hasClasses: boolean
  children: React.ReactNode
  modal: React.ReactNode
}

export default function StudentLayoutClient({
  profileName,
  userEmail,
  hasClasses,
  children,
  modal,
}: StudentLayoutClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfb] dark:bg-background font-sans">
      {/* PERSISTENT TOP NAVBAR */}
      <TopNavbar
        portalName="Student Portal"
        userName={profileName}
        userEmail={userEmail}
        userRole="Student"
        onMenuClick={() => setIsMobileOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden lg:flex shrink-0">
          <StudentSidebar hasClasses={hasClasses} />
        </div>

        {/* MOBILE DRAWER OVERLAY & SIDEBAR */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-[280px] max-w-[85vw] bg-white dark:bg-black h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
              <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Navigation Menu</span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-black dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <StudentSidebar hasClasses={hasClasses} onLinkClick={() => setIsMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative">
          {children}
          {modal}
        </main>
      </div>
    </div>
  )
}
