'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createNotification } from './notifications'

// ==========================================
// 1. Fetch Posts
// ==========================================
export async function fetchClassDiscussions(classId: string) {
  const supabase = await createClient()

  // Fetch posts with author details
  const { data: posts, error } = await supabase
    .from('class_discussions')
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching discussions:', error)
    return { success: false, data: [] }
  }

  // Fetch reply counts separately (a simple way without complex RPCs)
  const postIds = posts.map(p => p.id)
  
  let replyCounts: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: replies, error: replyError } = await supabase
      .from('discussion_replies')
      .select('post_id')
      .in('post_id', postIds)

    if (!replyError && replies) {
      replies.forEach(r => {
        replyCounts[r.post_id] = (replyCounts[r.post_id] || 0) + 1
      })
    }
  }

  const postsWithCounts = posts.map(p => ({
    ...p,
    reply_count: replyCounts[p.id] || 0
  }))

  return { success: true, data: postsWithCounts }
}

// ==========================================
// 2. Fetch Single Thread with Replies
// ==========================================
export async function fetchDiscussionThread(postId: string) {
  const supabase = await createClient()

  // Fetch the main post
  const { data: post, error: postError } = await supabase
    .from('class_discussions')
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq('id', postId)
    .single()

  if (postError || !post) {
    console.error('Error fetching post:', postError)
    return { success: false, post: null, replies: [] }
  }

  // Fetch replies
  const { data: replies, error: repliesError } = await supabase
    .from('discussion_replies')
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (repliesError) {
    console.error('Error fetching replies:', repliesError)
  }

  return { 
    success: true, 
    post, 
    replies: replies || [] 
  }
}

// ==========================================
// 3. Create Post
// ==========================================
export async function createDiscussionPost(
  classId: string, 
  title: string, 
  message: string, 
  isAnnouncement: boolean = false
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  // 1. Create the post
  const { error, data: newPost } = await supabase
    .from('class_discussions')
    .insert({
      class_id: classId,
      author_id: user.id,
      title,
      message,
      is_announcement: isAnnouncement
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return { success: false, message: error.message }
  }

  // 2. Fetch Class Details & Enrollments
  const { data: classData } = await supabase
    .from('classes')
    .select('teacher_id, name')
    .eq('id', classId)
    .single()

  const { data: enrollments } = await supabase
    .from('class_students')
    .select('student_id')
    .eq('class_id', classId)
    .eq('is_active', true)

  const teacherId = classData?.teacher_id
  const studentIds = enrollments?.map(e => e.student_id) || []

  // 3. Send Notifications
  // Note: the frontend router uses tabs, e.g. /student/class/[id] and activeTab is handled via state or maybe query string if we implemented it, but default is clicking the tab.
  // We'll just link to the class page.
  const postUrl = `/student/class/${classId}`
  const teacherUrl = `/teacher/class/${classId}`
  const authorId = user.id

  if (isAnnouncement) {
    for (const studentId of studentIds) {
      await createNotification(
        studentId,
        'classroom',
        'announcement',
        `New Announcement: ${classData?.name}`,
        title,
        postUrl
      )
    }
  } else {
    if (teacherId && teacherId !== authorId) {
      await createNotification(
        teacherId,
        'classroom',
        'discussion',
        `New Discussion in ${classData?.name}`,
        title,
        teacherUrl
      )
    }
    for (const studentId of studentIds) {
      if (studentId !== authorId) {
        await createNotification(
          studentId,
          'classroom',
          'discussion',
          `New Discussion in ${classData?.name}`,
          title,
          postUrl
        )
      }
    }
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}


// ==========================================
export async function createReply(postId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { data: post } = await supabase
    .from('class_discussions')
    .select('is_locked, class_id, author_id, title')
    .eq('id', postId)
    .single()

  if (!post) return { success: false, message: 'Post not found.' }
  if (post.is_locked) {
    return { success: false, message: 'This thread is locked.' }
  }

  const { error } = await supabase
    .from('discussion_replies')
    .insert({
      post_id: postId,
      author_id: user.id,
      message
    })

  if (error) {
    console.error('Error creating reply:', error)
    return { success: false, message: error.message }
  }

  // Fetch Class Details for Notifications
  const { data: classData } = await supabase
    .from('classes')
    .select('teacher_id, name')
    .eq('id', post.class_id)
    .single()

  // Fetch all prior replies to find participants
  const { data: priorReplies } = await supabase
    .from('discussion_replies')
    .select('author_id')
    .eq('post_id', postId)

  const teacherId = classData?.teacher_id
  const authorId = user.id
  const postAuthorId = post.author_id

  const url = `/student/class/${post.class_id}`
  const teacherUrl = `/teacher/class/${post.class_id}`

  // Build a set of all user IDs that should be notified
  const participants = new Set<string>()
  
  // 1. Original author
  participants.add(postAuthorId)
  
  // 2. The teacher
  if (teacherId) participants.add(teacherId)
  
  // 3. Anyone who has replied
  if (priorReplies) {
    for (const r of priorReplies) {
      participants.add(r.author_id)
    }
  }

  // Remove the person who is currently replying
  participants.delete(authorId)

  // Send notifications
  for (const participantId of Array.from(participants)) {
    const notifyUrl = participantId === teacherId ? teacherUrl : url;
    await createNotification(
      participantId,
      'classroom',
      'reply',
      participantId === postAuthorId ? 'New Reply on your post' : `New Reply in ${classData?.name}`,
      `Someone replied to: ${post.title}`,
      notifyUrl
    )
  }

  if (post.class_id) {
    revalidatePath(`/teacher/class/${post.class_id}`)
    revalidatePath(`/student/class/${post.class_id}`)
  }
  
  return { success: true }
}


// ==========================================
export async function deletePostOrReply(id: string, type: 'post' | 'reply', classId: string) {
  const supabase = await createClient()
  
  // Note: RLS currently allows deleting OWN posts/replies. 
  // For teachers to delete ANY post, we might need a trusted server client or modify RLS.
  // For now, we will rely on RLS (if teacher is author) or bypass RLS if we strictly check role.
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  // Check if user is a teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    // If not teacher, they can only delete their own. Let RLS handle it.
  } else {
    // If teacher, they should be able to delete anyone's post in their class.
    // For a robust implementation, RLS should allow teachers to delete rows where class_id matches their class.
    // Assuming RLS handles it, or we can use the service role key if needed. We'll stick to the standard client for now.
  }

  let table = type === 'post' ? 'class_discussions' : 'discussion_replies'
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    console.error(`Error deleting ${type}:`, error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}

// ==========================================
// 6. Toggle Post Lock
// ==========================================
export async function togglePostLock(postId: string, currentLockState: boolean, classId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('class_discussions')
    .update({ is_locked: !currentLockState })
    .eq('id', postId)

  if (error) {
    console.error('Error toggling lock:', error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}
