import { Router } from 'express';
import {
    getConversations,
    getMessages,
    sendMessage,
    createConversation,
    getUnreadCount,
} from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All message routes are protected
router.use(authMiddleware);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.post('/conversations', createConversation);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);

export default router;
