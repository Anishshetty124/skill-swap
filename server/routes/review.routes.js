import { Router } from 'express';
import { createReview } from '../controllers/review.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all review routes
router.use(verifyJWT);

router.route('/').post(createReview);

export default router;