import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All notification routes require authentication
router.use(protect);

// 1. Get logged-in user's notifications + unread count
router.get('/', getMyNotifications);

// 2. Mark all as read
router.patch('/read-all', markAllAsRead);

// 3. Mark a specific notification as read
router.patch('/:id/read', markAsRead);

export default router;