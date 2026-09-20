import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Notice 'protect' sits before 'getMe'!)
router.get('/me', protect as any, getMe as any);

export default router;
