'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fetchDiscussionThread, createReply, deletePostOrReply, togglePostLock } from '@/app/actions/discussions'

interface DiscussionThreadProps {
  postId: string
  classId: string
  role: 'teacher' | 'student'
  currentUserId: string
  onBack: () => void
}

export default function DiscussionThread({ postId, classId, role, currentUserId, onBack }: DiscussionThreadProps) {
  const [post, setPost] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadThread()
  }, [postId])

  const loadThread = async () => {
    setLoading(true)
    const result = await fetchDiscussionThread(postId)
    if (result.success) {
      setPost(result.post)
      setReplies(result.replies)
    }
    setLoading(false)
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim() || post?.is_locked) return

    setIsSubmitting(true)
    setError(null)
    const result = await createReply(postId, replyMessage)
    if (result.success) {
      setReplyMessage('')
      await loadThread()
    } else {
      setError(result.message || 'Error occurred')
    }
    setIsSubmitting(false)
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return
    const result = await deletePostOrReply(replyId, 'reply', classId)
    if (result.success) {
      setReplies(prev => prev.filter(r => r.id !== replyId))
    } else {
      alert(result.message)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this entire thread?')) return
    const result = await deletePostOrReply(postId, 'post', classId)
    if (result.success) {
      onBack()
    } else {
      alert(result.message)
    }
  }

  const handleToggleLock = async () => {
    if (role !== 'teacher') return
    const result = await togglePostLock(postId, post.is_locked, classId)
    if (result.success) {
      setPost({ ...post, is_locked: !post.is_locked })
    } else {
      alert(result.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12 text-gray-500">
        Thread not found or has been deleted.
        <button onClick={onBack} className="block mx-auto mt-4 text-primary-600 font-bold">Go Back</button>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#092B2B] dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Discussions
        </button>
        
        {role === 'teacher' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLock}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                post.is_locked 
                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800' 
                  : 'text-gray-500 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              {post.is_locked ? 'Unlock Thread' : 'Lock Thread'}
            </button>
            <button
              onClick={handleDeletePost}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-500 border border-red-100 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/30 transition-colors"
            >
              Delete Thread
            </button>
          </div>
        )}
      </div>

      {/* Messages Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4 custom-scrollbar">
        
        {/* Main Post */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
          {post.is_announcement && (
            <span className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              Announcement
            </span>
          )}
          
          <h1 className="text-xl font-bold text-[#092B2B] dark:text-white mb-2 pr-10">{post.title}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#092B2B] dark:bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
              {post.author?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-[#092B2B] dark:text-gray-200">
                {post.author?.full_name} 
                {post.author?.role === 'teacher' && <span className="ml-2 text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 px-1.5 py-0.5 rounded uppercase">Teacher</span>}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{formatDate(post.created_at)}</p>
            </div>
          </div>
          
          <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
            {post.message}
          </div>
        </div>

        {/* Replies Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{replies.length} Replies</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          {replies.map(reply => {
            const isOwnReply = reply.author_id === currentUserId
            const canDelete = role === 'teacher' || isOwnReply

            return (
              <div key={reply.id} className="flex gap-3 group">
                <div className="w-8 h-8 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-xs mt-1">
                  {reply.author?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="bg-white dark:bg-black/20 p-4 rounded-2xl rounded-tl-sm border border-black/5 dark:border-white/5 shadow-sm relative">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-[#092B2B] dark:text-gray-200">
                        {reply.author?.full_name}
                        {reply.author?.role === 'teacher' && <span className="ml-2 text-[9px] text-primary-600 uppercase">Teacher</span>}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-medium">{formatDate(reply.created_at)}</span>
                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteReply(reply.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete reply"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {reply.message}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Reply Input Area */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
        {post.is_locked ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center text-sm font-bold text-gray-500 border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            This thread is locked by the teacher.
          </div>
        ) : (
          <form onSubmit={handleReplySubmit} className="relative">
            {error && <div className="absolute -top-8 left-0 text-xs text-red-500 font-bold">{error}</div>}
            <div className="flex gap-2">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none resize-none h-12 min-h-[48px] max-h-32"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReplySubmit(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyMessage.trim()}
                className="bg-[#092B2B] dark:bg-emerald-600 text-white rounded-xl px-4 font-bold flex items-center justify-center disabled:opacity-50 transition-opacity hover:bg-opacity-90"
              >
                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 text-right">
              Press <kbd className="px-1 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> to send, <kbd className="px-1 bg-gray-100 dark:bg-gray-800 rounded">Shift + Enter</kbd> for new line
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
