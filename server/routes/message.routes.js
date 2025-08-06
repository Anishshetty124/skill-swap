import { Router } from 'express';
import {
  sendMessage,
  getMessages,
  getConversations,
  deleteMessage,
  clearConversation,
  reportUser,
  markAllAsRead,
  markMessagesAsRead
} from '../controllers/message.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/conversations', getConversations);
router.get('/:id', getMessages);
router.post('/send/:id', sendMessage);
router.delete('/message/:messageId', deleteMessage); 
router.delete('/conversation/:conversationId', clearConversation); // New route to clear a conversation
router.post('/report/:userIdToReport', reportUser); // New route to report a user
router.route("/read-all").post(markAllAsRead);
router.route("/read/:id").post(markMessagesAsRead);

export default router;
