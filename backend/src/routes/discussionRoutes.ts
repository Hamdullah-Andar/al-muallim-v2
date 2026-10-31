import { Router } from 'express';
import {
  createThread,
  getThreads,
  getThreadById,
  replyToThread,
  toggleEndorseReply,
  toggleThreadStatus,
} from '../controllers/discussionController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// All discussion routes require authentication
router.use(protect);

// 1. Thread CRUD
router.post('/threads', createThread);
router.get('/threads', getThreads);
router.get('/threads/:id', getThreadById);

// 2. Thread moderation (Teacher & Admin only)
router.patch(
  '/threads/:id/toggle',
  authorize('admin', 'teacher'),
  toggleThreadStatus
);

// 3. Post a reply
router.post('/threads/:id/replies', replyToThread);

// 4. Endorse a reply (Teacher & Admin only)
router.patch(
  '/replies/:replyId/endorse',
  authorize('admin', 'teacher'),
  toggleEndorseReply
);

export default router;