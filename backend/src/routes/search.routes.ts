import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// /api/search
router.get('/', authGuard, globalSearch);

export default router;
