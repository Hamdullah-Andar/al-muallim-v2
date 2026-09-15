import { Router } from 'express';
import { register } from '../controllers/authController';

const router = Router();

// Public registration route
router.post('/register', register);

export default router;
