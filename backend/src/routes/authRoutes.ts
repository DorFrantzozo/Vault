import { Router } from 'express';
import { login, register, logout, getMe } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../config/rateLimiters.js';
import { loginSchema, registerSchema } from '../schemas/authSchemas.js';

const router = Router();

router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
