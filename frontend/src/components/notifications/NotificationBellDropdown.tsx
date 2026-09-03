'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  checkDailyPendingTaskReminders,
  NotificationItem
} from '@/app/actions/notifications'

export default function NotificationBellDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'classroom'>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load notifications and check reminders on mount
  const fetchLatestNotifications = async () => {
    setIsLoading(true)
    try {
      // Auto-trigger gentle daily reminder check if pending
      await checkDailyPendingTaskReminders()

      const res = await getNotifications()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestNotifications()

    // Poll periodically every 45 seconds for real-time updates
    const interval = setInterval(() => {
      fetchLatestNotifications()
    }, 45000)

    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter notifications by selected tab
  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'personal') return item.scope === 'personal'
    if (activeTab === 'classroom') return item.scope === 'classroom'
    return true
  })

  // Mark single as read and navigate
  const handleItemClick = (item: NotificationItem) => {
    startTransition(async () => {
      if (!item.is_read) {
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        await markNotificationAsRead(item.id)
      }
      setIsOpen(false)
      if (item.link_url) {
        router.push(item.link_url)
      }
    })
  }

  // Mark all as read
  const handleMarkAllRead = () => {
    startTransition(async () => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      await markAllNotificationsAsRead()
    })
  }

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    try {
      const created = new Date(dateStr).getTime()
      const now = new Date().getTime()
      const diffMinutes = Math.floor((now - created) / 60000)

      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return 'Recently'
    }
  }

  // Category Icon Helper
  const getCategoryIcon = (category: string, scope: string) => {
    const cat = (category || '').toLowerCase()
    if (cat.includes('prayer')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
      )
    }
    if (cat.includes('resource') || cat.includes('library')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      )
    }
    if (cat.includes('streak') || cat.includes('reminder')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    }
    if (scope === 'classroom') {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 v5m-4 0h4" />
          </svg>
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          fetchLatestNotifications()
        }}
        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all relative outline-none cursor-pointer"
        title="Notifications"
        aria-expanded={isOpen}
        aria-label="View Notifications"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#092B2B] dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline transition-all"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Scope Tabs */}
          <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3 pt-2 gap-1 bg-gray-50/30 dark:bg-white/[0.01]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-white/10 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'personal'
                  ? 'bg-white dark:bg-white/10 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🌿</span> Personal
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classroom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'classroom'
                  ? 'bg-white dark:bg-white/10 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>📚</span> Classroom
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
            {isLoading && notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">All caught up!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No {activeTab !== 'all' ? activeTab : ''} notifications right now.
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                    !item.is_read
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 border-l-4 border-l-emerald-500 dark:border-l-emerald-400'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5 border-l-4 border-l-transparent'
                  }`}
                >
                  {getCategoryIcon(item.category, item.scope)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-xs truncate transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400 ${
                          !item.is_read
                            ? 'font-extrabold text-gray-900 dark:text-white'
                            : 'font-semibold text-gray-500 dark:text-gray-400'
                        }`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 shrink-0">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        item.scope === 'personal'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                      }`}>
                        {item.scope === 'personal' ? '🌿 Personal' : '📚 Classroom'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 capitalize">
                        • {item.category}
                      </span>
                    </div>
                  </div>

                  {!item.is_read && (
                    <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400">
              Personal Taqwa & Classroom Reminders
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
