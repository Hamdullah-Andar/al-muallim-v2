import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  DiscussionThread,
  DiscussionReply,
  User,
} from '../models';
import { sendNotification } from './notificationController';

/**
 * 1. Create a new discussion thread
 * POST /api/discussions/threads
 */
export const createThread = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, content, classId, subjectId, lessonId, isPinned } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
      return;
    }

    // Only teachers or admins can pin a thread on creation
    const canPin =
      (req.user.role === 'admin' || req.user.role === 'teacher') &&
      Boolean(isPinned);

    const thread = await DiscussionThread.create({
      title,
      content,
      authorId: req.user.id,
      classId: classId || null,
      subjectId: subjectId || null,
      lessonId: lessonId || null,
      isPinned: canPin,
      isLocked: false,
    });

    const threadWithAuthor = await DiscussionThread.findByPk(thread.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'role'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Discussion thread created successfully',
      data: threadWithAuthor,
    });
  } catch (error) {
    console.error('Error creating discussion thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion thread',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 2. Get discussion threads (filter by classId or lessonId)
 * GET /api/discussions/threads?classId=...&lessonId=...
 */
export const getThreads = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { classId, subjectId, lessonId } = req.query;

    const whereClause: Record<string, unknown> = {};
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (lessonId) whereClause.lessonId = lessonId;

    const threads = await DiscussionThread.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'role'],
        },
        {
          model: DiscussionReply,
          as: 'replies',
          attributes: ['id'],
        },
      ],
      // Pinned threads float to the top, then newest first
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    // Map threads to include replyCount
    const formatted = threads.map((t) => {
      const plain = t.get({ plain: true }) as any;
      const replyCount = plain.replies ? plain.replies.length : 0;
      delete plain.replies;
      return { ...plain, replyCount };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('Error fetching discussion threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussion threads',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 3. Get a single thread with all replies and child nested replies
 * GET /api/discussions/threads/:id
 */
export const getThreadById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid thread ID' });
      return;
    }

    const thread = await DiscussionThread.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'role'],
        },
        {
          model: DiscussionReply,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'role'],
            },
            {
              model: DiscussionReply,
              as: 'childReplies',
              include: [
                {
                  model: User,
                  as: 'author',
                  attributes: ['id', 'name', 'role'],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: DiscussionReply, as: 'replies' }, 'createdAt', 'ASC'],
      ],
    });

    if (!thread) {
      res.status(404).json({ success: false, message: 'Thread not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('Error fetching thread details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread details',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 4. Reply to a discussion thread
 * POST /api/discussions/threads/:id/replies
 */
export const replyToThread = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: threadId } = req.params;
    const { content, parentReplyId } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (typeof threadId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid thread ID' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Reply content cannot be empty',
      });
      return;
    }

    const thread = await DiscussionThread.findByPk(threadId);
    if (!thread) {
      res.status(404).json({ success: false, message: 'Thread not found' });
      return;
    }

    if (thread.isLocked) {
      res.status(403).json({
        success: false,
        message: 'This discussion thread has been locked by a teacher/admin',
      });
      return;
    }

    const reply = await DiscussionReply.create({
      threadId,
      authorId: req.user.id,
      content,
      parentReplyId: parentReplyId || null,
      isEndorsed: false,
    });

    const replyWithAuthor = await DiscussionReply.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'role'],
        },
      ],
    });

    // Send notification to thread author (if respondent is not the author)
    if (thread.authorId !== req.user.id) {
      await sendNotification({
        userId: thread.authorId,
        title: 'New Reply to Your Discussion',
        message: `${req.user.name} replied: "${content.substring(0, 80)}${
          content.length > 80 ? '...' : ''
        }"`,
        type: 'discussion',
        link: `/discussions/${thread.id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      data: replyWithAuthor,
    });
  } catch (error) {
    console.error('Error replying to thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 5. Endorse or un-endorse a reply (Teacher/Admin only)
 * PATCH /api/discussions/replies/:replyId/endorse
 */
export const toggleEndorseReply = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { replyId } = req.params;

    if (typeof replyId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid reply ID' });
      return;
    }

    const reply = await DiscussionReply.findByPk(replyId);
    if (!reply) {
      res.status(404).json({ success: false, message: 'Reply not found' });
      return;
    }

    reply.isEndorsed = !reply.isEndorsed;
    await reply.save();

    // If newly endorsed, notify reply author!
    if (reply.isEndorsed && req.user && reply.authorId !== req.user.id) {
      await sendNotification({
        userId: reply.authorId,
        title: 'Your Answer Was Endorsed! ⭐',
        message: `${req.user.name} endorsed your answer as helpful and accurate.`,
        type: 'discussion',
        link: `/discussions/${reply.threadId}`,
      });
    }

    res.status(200).json({
      success: true,
      message: reply.isEndorsed
        ? 'Reply endorsed successfully'
        : 'Endorsement removed',
      data: reply,
    });
  } catch (error) {
    console.error('Error endorsing reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update endorsement status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 6. Toggle Pin or Lock on a Thread (Teacher/Admin only)
 * PATCH /api/discussions/threads/:id/toggle
 */
export const toggleThreadStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'pin' or 'lock'

    if (typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid thread ID' });
      return;
    }

    const thread = await DiscussionThread.findByPk(id);
    if (!thread) {
      res.status(404).json({ success: false, message: 'Thread not found' });
      return;
    }

    if (action === 'pin') {
      thread.isPinned = !thread.isPinned;
    } else if (action === 'lock') {
      thread.isLocked = !thread.isLocked;
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid action. Use action: 'pin' or 'lock'",
      });
      return;
    }

    await thread.save();

    res.status(200).json({
      success: true,
      message: `Thread ${action === 'pin' ? (thread.isPinned ? 'pinned' : 'unpinned') : thread.isLocked ? 'locked' : 'unlocked'} successfully`,
      data: thread,
    });
  } catch (error) {
    console.error('Error toggling thread status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thread status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};