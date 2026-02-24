import { Router } from 'express';
import { createCampaign, getCampaigns, getCampaignById, startCampaign, addBookingToCampaign } from '../controllers/campaign.controller';

const router = Router();

router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/:id/start', startCampaign);
router.post('/:id/bookings', addBookingToCampaign);

export default router;
