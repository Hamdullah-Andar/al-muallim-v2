'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import EditProfileModal from '@/components/profile/EditProfileModal'
import NotificationBellDropdown from '@/components/notifications/NotificationBellDropdown'

interface TopNavbarProps {
  portalName: string
  userName?: string
  userEmail?: string
  userRole?: string
  onMenuClick?: () => void
}

export default function TopNavbar({
  portalName,
  userName = 'User',
  userEmail = 'user@al-muallim.org',
  userRole = 'Member',
  onMenuClick,
}: TopNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initial = userName?.charAt(0).toUpperCase() || 'U'
  const isTeacher = portalName.toLowerCase().includes('teacher')
  const homeHref = isTeacher ? '/teacher/dashboard' : '/student/dashboard'
  const analyticsHref = isTeacher ? '/teacher/personal-analytics' : '/student/analytics'
  const libraryHref = isTeacher ? '/teacher/personal-library' : '/student/personal-library'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="h-16 md:h-20 border-b border-black/5 dark:border-white/5 bg-white/90 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-all">
        {/* Left: Mobile Hamburger + Portal Logo / Badge */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors md:hidden"
              title="Open Menu"
              aria-label="Open Navigation Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-85"
            title="Go to Dashboard"
          >
            {/* Geometric Brand Logo Mark */}
            <div className="w-8 h-8 md:w-9 md:h-9 bg-[#bdf3df]/60 dark:bg-emerald-950/60 border border-emerald-300/40 dark:border-emerald-700/50 rounded-xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white dark:bg-black rounded-[1px] rotate-45"></div>
              </div>
            </div>
            <span className="text-lg md:text-xl font-bold text-primary-800 dark:text-primary-400 font-arabic tracking-wide">
              Al-Mu'allim
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 hidden sm:inline-block">
              {portalName}
            </span>
          </Link>
        </div>

        {/* Right: Notification Bell + Interactive User Profile Pill & Dropdown */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Notification Bell Dropdown */}
          <NotificationBellDropdown />

          {/* Interactive User Profile Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 pl-2 pr-3 py-1.5 rounded-2xl transition-all outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              aria-expanded={isDropdownOpen}
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs md:text-sm shadow-sm shrink-0">
                {initial}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs md:text-sm font-bold text-[#092B2B] dark:text-white leading-tight truncate max-w-[120px]">
                  {userName}
                </p>
                <p className="text-[10px] font-semibold text-gray-400 capitalize leading-tight">
                  {userRole}
                </p>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0c1212] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header Banner inside Dropdown */}
                <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white font-black text-lg flex items-center justify-center shadow-inner shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-white truncate">{userName}</p>
                    <p className="text-xs text-emerald-200 truncate">{userEmail}</p>
                    <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      setIsEditModalOpen(true)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold">Edit Profile</p>
                      <p className="text-[10px] text-gray-400 font-normal">Update name & personal info</p>
                    </div>
                  </button>

                  <Link
                    href={analyticsHref}
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold">Personal Analytics</p>
                      <p className="text-[10px] text-gray-400 font-normal">View consistency heatmaps</p>
                    </div>
                  </Link>

                  <Link
                    href={libraryHref}
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold">Personal Library</p>
                      <p className="text-[10px] text-gray-400 font-normal">Manage reading resources</p>
                    </div>
                  </Link>
                </div>

                {/* Logout Divider & Action */}
                <div className="p-2 border-t border-black/5 dark:border-white/5">
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold">Sign Out</p>
                        <p className="text-[10px] text-red-400/80 font-normal">Log out of your account</p>
                      </div>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
      />
    </>
  )
}
