import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';
import {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    searchUsers,
    getAllSkills,
    getAllConversations,
    getMessagesForConversation,
    sendCustomNotification,
    getReports,
    updateReportStatus
} from '../controllers/admin.controller.js';

const router = Router();
router.use(verifyJWT, isAdmin);

// Dashboard
router.route('/stats').get(getDashboardStats);

// Users
router.route('/users').get(getAllUsers);
router.route('/users/search').get(searchUsers); // New search route
router.route('/users/:userId').delete(deleteUser);

// Content
router.route('/skills').get(getAllSkills);

// Communication
router.route('/conversations').get(getAllConversations);
router.route('/conversations/:conversationId').get(getMessagesForConversation);
router.route('/notifications/send').post(sendCustomNotification);

// Reports
router.route('/reports').get(getReports); // New reports route
router.route('/reports/:reportId').patch(updateReportStatus); // New status update route

export default router;
