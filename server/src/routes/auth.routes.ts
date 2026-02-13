import { Router } from 'express';
import { sendOtp, verifyOtp, getProfile, updateProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;
