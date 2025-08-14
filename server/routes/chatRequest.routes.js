import { Router } from 'express';
import {
    sendChatRequest,
    getChatRequests,
    respondToChatRequest,
    deleteChatRequest
} from '../controllers/chatRequest.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').get(getChatRequests);

router.route('/:receiverId').post(sendChatRequest);

router.route('/:requestId/respond').patch(respondToChatRequest);

router.route('/:requestId').delete(deleteChatRequest);

export default router;
