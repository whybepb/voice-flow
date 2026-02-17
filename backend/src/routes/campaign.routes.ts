import { Router } from 'express';
import { startCampaign } from '../controllers/campaign.controller';

const router = Router();

router.post('/start', startCampaign);

export default router;
