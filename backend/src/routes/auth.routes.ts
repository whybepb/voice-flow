import { Router } from 'express';
import { login, register, getMe, updateOnboarding, googleLogin, updateSettings } from '../controllers/auth.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authGuard, getMe);
router.patch('/onboarding', authGuard, updateOnboarding);
router.patch('/settings', authGuard, updateSettings);

export default router;
