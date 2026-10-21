import { Router } from 'express';
import {
  markBulkAttendance,
  getClassAttendance,
  getStudentAttendanceHistory,
} from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// All attendance routes require the user to be logged in
router.use(protect);

// 1. Mark or update attendance for students (Admin & Teacher only)
router.post('/', authorize('admin', 'teacher'), markBulkAttendance);

// 2. Get attendance for a class on a date (Admin & Teacher)
router.get('/class/:classId', authorize('admin', 'teacher'), getClassAttendance);

// 3. Get attendance history for a specific student (Accessible to all authenticated users)
router.get('/student/:studentId', getStudentAttendanceHistory);

export default router;
