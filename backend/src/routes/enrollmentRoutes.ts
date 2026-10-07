import { Router } from 'express';
import {
  enrollStudent,
  getClassEnrollments,
  updateEnrollment,
} from '../controllers/enrollmentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all enrollment routes (user must be logged in)
router.use(protect);

// 1. Enroll a student into a class & section (Admin or Teacher)
router.post('/', authorize('admin', 'teacher'), enrollStudent);

// 2. Get all enrollments for a class (Admin or Teacher)
router.get('/class/:classId', authorize('admin', 'teacher'), getClassEnrollments);

// 3. Update enrollment status or section (Admin only)
router.patch('/:id', authorize('admin'), updateEnrollment);

export default router;
