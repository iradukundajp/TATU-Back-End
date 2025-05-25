const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All message routes require authentication
router.use(authenticate);

// Get all conversations for current user
router.get('/conversations', messageController.getUserConversations);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Start conversation with a user
router.post('/conversations/:userId', messageController.startConversation);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', messageController.getConversationMessages);

// Mark messages as read in a conversation
router.put('/conversations/:conversationId/read', messageController.markMessagesAsRead);

// Send a message
router.post('/', messageController.sendMessage);

// Delete a message
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router; 