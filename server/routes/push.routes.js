import { Router } from 'express';
import { subscribeToPushNotifications } from '../controllers/push.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/subscribe').post(subscribeToPushNotifications);

export default router;
