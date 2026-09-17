import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

// Public registration route
router.post('/register', register);

// Public login route
router.post('/login', login);

export default router;
