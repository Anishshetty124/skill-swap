import { Router } from 'express';
import {
    getNotifications,
    markAllAsRead,
    deleteNotification
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').get(getNotifications);

router.route('/read-all').post(markAllAsRead);

router.route('/:notificationId').delete(deleteNotification);

export default router;
