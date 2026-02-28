import { Router } from 'express';
import { createCustomer, getCustomers } from '../controllers/customers.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authGuard, createCustomer);
router.get('/', authGuard, getCustomers);

export default router;
