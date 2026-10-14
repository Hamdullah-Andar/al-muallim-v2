import { Router } from 'express';
import {
  createSubject,
  getSubjectsByClass,
  getSubjectWithSyllabus,
  createModule,
  createLesson,
  getLessonById,
} from '../controllers/curriculumController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all curriculum routes (user must be logged in)
router.use(protect);

// ==========================================
// Subject Routes
// ==========================================
// 1. Create a subject in a class (Admin or Teacher)
router.post('/', authorize('admin', 'teacher'), createSubject);

// 2. Get all subjects for a class
router.get('/class/:classId', getSubjectsByClass);

// 3. Get single subject with full syllabus tree (Modules -> Lessons)
router.get('/:id', getSubjectWithSyllabus);

// ==========================================
// Module Routes
// ==========================================
// 4. Create a module/unit under a subject (Admin or Teacher)
router.post('/:subjectId/modules', authorize('admin', 'teacher'), createModule);

// ==========================================
// Lesson Routes
// ==========================================
// 5. Create a lesson under a module (Admin or Teacher)
router.post('/modules/:moduleId/lessons', authorize('admin', 'teacher'), createLesson);

// 6. Get single lesson details
router.get('/lessons/:id', getLessonById);

export default router;
