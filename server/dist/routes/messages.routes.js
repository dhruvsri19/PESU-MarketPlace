"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messages_controller_1 = require("../controllers/messages.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All message routes are protected
router.use(auth_1.authMiddleware);
router.get('/conversations', messages_controller_1.getConversations);
router.get('/unread-count', messages_controller_1.getUnreadCount);
router.post('/conversations', messages_controller_1.createConversation);
router.get('/:conversationId', messages_controller_1.getMessages);
router.post('/', messages_controller_1.sendMessage);
exports.default = router;
//# sourceMappingURL=messages.routes.js.map