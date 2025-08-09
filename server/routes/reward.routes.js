import { Router } from 'express';
import { claimDailyReward, getRewardStatus } from '../controllers/reward.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/status').get(getRewardStatus);
router.route('/claim').post(claimDailyReward);

export default router;
