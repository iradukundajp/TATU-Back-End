const messageService = require('../services/message.service');

/**
 * Get all conversations for the current user
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await messageService.getUserConversations(userId);
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      message: 'Failed to fetch conversations', 
      error: error.message 
    });
  }
};

/**
 * Get messages for a specific conversation
 */
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await messageService.getConversationMessages(
      conversationId, 
      userId, 
      page, 
      limit
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    if (error.message === 'Conversation not found or access denied') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'Failed to fetch messages', 
        error: error.message 
      });
    }
  }
};

/**
 * Send a new message
 */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ 
        message: 'Receiver ID and content are required' 
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ 
        message: 'Cannot send message to yourself' 
      });
    }

    const message = await messageService.sendMessage({
      senderId,
      receiverId,
      content,
      messageType: messageType || 'text'
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Failed to send message', 
      error: error.message 
    });
  }
};

/**
 * Mark messages as read
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const count = await messageService.markMessagesAsRead(conversationId, userId);
    
    res.json({ 
      message: 'Messages marked as read', 
      markedCount: count 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark messages as read', 
      error: error.message 
    });
  }
};

/**
 * Get unread message count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await messageService.getUnreadMessageCount(userId);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      message: 'Failed to fetch unread count', 
      error: error.message 
    });
  }
};

/**
 * Start a conversation with a user
 */
const startConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId === userId) {
      return res.status(400).json({ 
        message: 'Cannot start conversation with yourself' 
      });
    }

    const conversation = await messageService.getOrCreateConversation(
      currentUserId, 
      userId
    );
    
    res.json(conversation);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ 
      message: 'Failed to start conversation', 
      error: error.message 
    });
  }
};

/**
 * Delete a message
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await messageService.deleteMessage(messageId, userId);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error.message === 'Message not found or unauthorized') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'Failed to delete message', 
        error: error.message 
      });
    }
  }
};

module.exports = {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  startConversation,
  deleteMessage
}; 