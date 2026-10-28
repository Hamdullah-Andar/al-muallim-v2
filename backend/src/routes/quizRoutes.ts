import { Router } from 'express';
import {
  createQuiz,
  getQuizzesByClass,
  getQuizForTaking,
  submitQuizAttempt,
  getStudentQuizAttempts,
} from '../controllers/quizController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// All quiz routes require user to be logged in
router.use(protect);

// 1. Create a quiz with questions and options (Teacher & Admin only)
router.post('/', authorize('admin', 'teacher'), createQuiz);

// 2. Get all quizzes for a class
router.get('/class/:classId', getQuizzesByClass);

// 3. Get a quiz to take it (Anti-cheat: isCorrect is hidden for students!)
router.get('/:id', getQuizForTaking);

// 4. Submit quiz attempt (Instantly auto-graded by backend)
router.post('/:id/submit', submitQuizAttempt);

// 5. Get student quiz attempt history & scores
router.get('/student/:studentId/attempts', getStudentQuizAttempts);

export default router;
