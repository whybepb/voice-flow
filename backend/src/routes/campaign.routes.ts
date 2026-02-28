import { Router } from 'express';
import { createCampaign, getCampaigns, getCampaignById, startCampaign, addBookingToCampaign } from '../controllers/campaign.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authGuard, createCampaign);
router.get('/', authGuard, getCampaigns);
router.get('/:id', authGuard, getCampaignById);
router.post('/:id/start', authGuard, startCampaign);
router.post('/:id/bookings', authGuard, addBookingToCampaign);

export default router;
