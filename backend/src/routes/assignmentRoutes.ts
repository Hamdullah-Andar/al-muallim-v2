import { Router } from 'express';
import {
  createAssignment,
  getAssignmentsByClass,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
  getStudentSubmissions,
} from '../controllers/assignmentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// All assignment routes require login
router.use(protect);

// 1. Create assignment (Teacher & Admin only)
router.post('/', authorize('admin', 'teacher'), createAssignment);

// 2. Get all assignments for a class
router.get('/class/:classId', getAssignmentsByClass);

// 3. Submit or resubmit homework / habit log
router.post('/:assignmentId/submit', submitAssignment);

// 4. Grade a submission & give feedback (Teacher & Admin only)
router.put('/submissions/:submissionId/grade', authorize('admin', 'teacher'), gradeSubmission);

// 5. View all submissions for an assignment (Teacher & Admin only)
router.get('/:assignmentId/submissions', authorize('admin', 'teacher'), getAssignmentSubmissions);

// 6. View submissions for a specific student
router.get('/student/:studentId/submissions', getStudentSubmissions);

export default router;
