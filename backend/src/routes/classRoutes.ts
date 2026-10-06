import { Router } from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  createSection,
} from '../controllers/classController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// All class routes require a logged-in user!
router.use(protect as any);

// Read routes: Students, Teachers, Admins can view classes
router.get('/', getClasses);
router.get('/:id', getClassById);

// Create class: Admin only!
router.post('/', authorize('admin') as any, createClass);

// Create section: Admin or Teacher
router.post('/:classId/sections', authorize('admin', 'teacher') as any, createSection);

export default router;
