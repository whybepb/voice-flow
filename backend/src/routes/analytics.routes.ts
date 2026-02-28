import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.get('/dashboard', authGuard, getDashboardAnalytics);

export default router;
