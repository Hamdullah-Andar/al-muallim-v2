'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface NotificationItem {
  id: string
  user_id: string
  scope: 'personal' | 'classroom'
  category: string
  title: string
  message: string
  link_url?: string | null
  is_read: boolean
  created_at: string
}

/**
 * Fetch all notifications for current logged-in user
 */
export async function getNotifications(): Promise<{
  notifications: NotificationItem[]
  unreadCount: number
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { notifications: [], unreadCount: 0 }
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.warn('Notifications table not found or query error:', error.message)
      return { notifications: [], unreadCount: 0 }
    }

    const notifications = (data || []) as NotificationItem[]
    const unreadCount = notifications.filter(n => !n.is_read).length

    return { notifications, unreadCount }
  } catch (err) {
    console.error('Error fetching notifications:', err)
    return { notifications: [], unreadCount: 0 }
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error marking notification as read:', error.message)
      return { success: false }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('Error in markNotificationAsRead:', err)
    return { success: false }
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error.message)
      return { success: false }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('Error in markAllNotificationsAsRead:', err)
    return { success: false }
  }
}

/**
 * Helper to create notification for any target user
 */
export async function createNotification(
  recipientId: string,
  scope: 'personal' | 'classroom',
  category: string,
  title: string,
  message: string,
  linkUrl?: string
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        scope,
        category,
        title,
        message,
        link_url: linkUrl || null,
        is_read: false
      })

    if (error) {
      console.error('Failed to create notification:', error.message)
      return { success: false }
    }

    return { success: true }
  } catch (err) {
    console.error('Error creating notification:', err)
    return { success: false }
  }
}

/**
 * Trigger: Notify all students enrolled in a class when a new assignment is created
 */
export async function notifyStudentsNewAssignment(
  classId: string,
  assignmentTitle: string,
  category: string
) {
  try {
    const supabase = await createClient()

    // 1. Fetch class info
    const { data: classData } = await supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single()

    const className = classData?.name || 'Classroom'

    // 2. Fetch all enrolled students
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)

    if (!enrollments || enrollments.length === 0) return { success: true }

    // 3. Create classroom notification for each student
    const notificationRows = enrollments.map(e => ({
      user_id: e.student_id,
      scope: 'classroom',
      category: (category || 'assignment').toLowerCase(),
      title: `New Task in ${className}`,
      message: `Assigned: "${assignmentTitle}". Complete today's target within 24h.`,
      link_url: `/student/class/${classId}`,
      is_read: false
    }))

    await supabase.from('notifications').insert(notificationRows)
    return { success: true }
  } catch (err) {
    console.error('Error notifying students:', err)
    return { success: false }
  }
}

/**
 * Trigger: Notify teachers/librarians when a student requests a resource
 */
export async function notifyResourceRequest(
  requestTitle: string,
  requestAuthor?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const studentName = profile?.full_name || 'A student'

    // Find all teachers
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'teacher')

    if (!teachers || teachers.length === 0) return { success: true }

    const notificationRows = teachers.map(t => ({
      user_id: t.id,
      scope: 'classroom',
      category: 'resource',
      title: 'New Library Resource Request',
      message: `${studentName} requested resource "${requestTitle}"${requestAuthor ? ` by ${requestAuthor}` : ''}.`,
      link_url: '/teacher/personal-library',
      is_read: false
    }))

    await supabase.from('notifications').insert(notificationRows)
    return { success: true }
  } catch (err) {
    console.error('Error in notifyResourceRequest:', err)
    return { success: false }
  }
}

/**
 * 24-Hour Cycle Reminder Trigger: Auto-checks pending tasks for current user
 */
export async function checkDailyPendingTaskReminders() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const todayDateStr = new Date().toISOString().split('T')[0]

    // Check if we already sent a reminder today
    const { data: existingReminders } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'streak_reminder')
      .gte('created_at', `${todayDateStr}T00:00:00Z`)

    if (existingReminders && existingReminders.length > 0) {
      return { success: true } // Already reminded today
    }

    // Check completed vs target for today
    const { data: progress } = await supabase
      .from('student_progress')
      .select('is_completed')
      .eq('student_id', user.id)
      .eq('tracking_date', todayDateStr)

    const totalTracked = progress?.length || 0
    const completedCount = progress?.filter(p => p.is_completed).length || 0
    const pendingCount = Math.max(0, totalTracked - completedCount)

    if (pendingCount > 0) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        scope: 'personal',
        category: 'streak_reminder',
        title: 'Daily Taqwa & Task Nudge',
        message: `You have ${pendingCount} pending task${pendingCount === 1 ? '' : 's'} remaining for today. Complete them to keep your streak alive!`,
        link_url: '/student/assignments',
        is_read: false
      })
    }

    return { success: true }
  } catch (err) {
    console.error('Error in checkDailyPendingTaskReminders:', err)
    return { success: false }
  }
}
