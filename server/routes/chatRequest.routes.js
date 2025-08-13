import { Router } from 'express';
import {
    sendChatRequest,
    getChatRequests,
    respondToChatRequest
} from '../controllers/chatRequest.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All chat request routes must be protected
router.use(verifyJWT);

// Route to get all pending requests for the logged-in user
router.route('/').get(getChatRequests);

// Route to send a new request to a user
router.route('/:receiverId').post(sendChatRequest);

// Route to respond to a specific request
router.route('/:requestId/respond').patch(respondToChatRequest);

export default router;
