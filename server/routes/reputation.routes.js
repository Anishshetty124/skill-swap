import { Router } from 'express';
import { rateUserProfile } from '../controllers/reputation.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/:userIdToRate').post(rateUserProfile);

export default router;
