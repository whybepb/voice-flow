import { Router } from 'express';
import { createBooking, getBookings, updateBookingStatus } from '../controllers/bookings.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authGuard, createBooking);
router.get('/', authGuard, getBookings);
router.patch('/:id/status', authGuard, updateBookingStatus);

export default router;
