import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').post(submitFeedback);

export default router;