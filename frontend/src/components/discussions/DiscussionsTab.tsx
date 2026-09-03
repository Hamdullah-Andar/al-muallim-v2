'use client'

import React, { useState, useEffect } from 'react'
import { fetchClassDiscussions, createDiscussionPost } from '@/app/actions/discussions'
import CreatePostModal from './CreatePostModal'
import DiscussionThread from './DiscussionThread'

interface DiscussionsTabProps {
  classId: string
  role: 'teacher' | 'student'
  
}

type TabType = 'all' | 'announcements' | 'discussions'

export default function DiscussionsTab({ classId, role }: DiscussionsTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  
  useEffect(() => {
    import('@/utils/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setCurrentUserId(user.id)
      })
    })
  }, [])


  useEffect(() => {
    if (!selectedPostId) {
      loadPosts()
    }
  }, [classId, selectedPostId])

  const loadPosts = async () => {
    setLoading(true)
    const result = await fetchClassDiscussions(classId)
    if (result.success) {
      setPosts(result.data || [])
    }
    setLoading(false)
  }

  const handleCreatePost = async (title: string, message: string, isAnnouncement: boolean) => {
    const result = await createDiscussionPost(classId, title, message, isAnnouncement)
    if (!result.success) throw new Error(result.message)
    await loadPosts()
  }

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true
    if (activeTab === 'announcements') return post.is_announcement
    if (activeTab === 'discussions') return !post.is_announcement
    return true
  })

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today, ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // If viewing a thread
  if (selectedPostId) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <DiscussionThread 
          postId={selectedPostId} 
          classId={classId} 
          role={role} 
          currentUserId={currentUserId}
          onBack={() => setSelectedPostId(null)} 
        />
      </div>
    )
  }

  // Main List View
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 min-h-[500px]">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        
        {/* Tab Filters */}
        <div className="flex bg-gray-50 dark:bg-black/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto custom-scrollbar">
          {(['all', 'announcements', 'discussions'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-[#092B2B] dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'announcements' && '📢 '}
              {tab === 'discussions' && '💬 '}
              {tab}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#092B2B] hover:bg-[#114040] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {role === 'teacher' ? 'New Post' : 'Start Discussion'}
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No posts found</h3>
          <p className="text-sm text-gray-500">Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <div 
              key={post.id}
              onClick={() => setSelectedPostId(post.id)}
              className="group bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-800 p-4 rounded-xl hover:border-[#bdf3df] dark:hover:border-emerald-900/50 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row gap-4"
            >
              {/* Highlight bar for announcements */}
              {post.is_announcement && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500"></div>
              )}

              {/* Author Avatar */}
              <div className="hidden sm:flex items-start shrink-0 pl-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner
                  ${post.is_announcement ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-[#092B2B] dark:bg-emerald-800'}
                `}>
                  {post.author?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  {post.is_announcement && (
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">📢 Announcement</span>
                  )}
                  {post.is_locked && (
                    <span className="text-[10px] font-black uppercase text-red-400 tracking-wider flex items-center"><svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Locked</span>
                  )}
                </div>
                
                <h3 className={`text-base font-bold truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${post.is_announcement ? 'text-amber-900 dark:text-amber-100' : 'text-[#092B2B] dark:text-white'}`}>
                  {post.title}
                </h3>
                
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {post.message}
                </p>
                
                <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <span className="sm:hidden w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-[8px] flex items-center justify-center text-gray-600 dark:text-white mr-1">
                      {post.author?.full_name?.[0]?.toUpperCase()}
                    </span>
                    {post.author?.full_name} 
                    {post.author?.role === 'teacher' && <span className="ml-1 text-[9px] text-primary-600"> (Teacher)</span>}
                  </span>
                  <span>•</span>
                  <span>{formatDate(post.created_at)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    {post.reply_count || 0} Replies
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreatePost}
        isTeacher={role === 'teacher'} 
      />
    </div>
  )
}
