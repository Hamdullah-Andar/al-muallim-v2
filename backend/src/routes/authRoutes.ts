import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController';
import { authorize, protect } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Notice 'protect' sits before 'getMe'!)
router.get('/me', protect as any, getMe as any);

// Test Route: Only 'admin' role can access!
router.get(
  '/admin-only',
  protect as any,
  authorize('admin') as any,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Admin Area! You have administrative access.',
    });
  }
);

export default router;
