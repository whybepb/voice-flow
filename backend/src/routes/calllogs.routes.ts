import { Router } from 'express';
import { getCallLogs, getCallLogById } from '../controllers/calllogs.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authGuard, getCallLogs);
router.get('/:id', authGuard, getCallLogById);

export default router;
