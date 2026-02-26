import { Router } from 'express';
import { getCallLogs, getCallLogById } from '../controllers/calllogs.controller';

const router = Router();

router.get('/', getCallLogs);
router.get('/:id', getCallLogById);

export default router;
