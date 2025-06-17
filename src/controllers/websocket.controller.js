const messageService = require('../services/message.service');

/**
 * WebSocket controller for handling real-time messaging events
 */

/**
 * Handle sending a message via WebSocket
 * @param {Object} socket - WebSocket socket instance
 * @param {Object} data - Message data
 */
async function handleSendMessage(socket, data) {
  try {
    const { conversationId, receiverId, content, messageType = 'text' } = data;
    const senderId = socket.userId;

    if (!senderId) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    if (!content) {
      socket.emit('error', { message: 'Content is required' });
      return;
    }

    // If receiverId is provided, use it directly
    let finalReceiverId = receiverId;

    // If conversationId is provided but no receiverId, get it from the conversation
    if (conversationId && !receiverId) {
      try {
        const conversation = await messageService.getConversationById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }
        
        // Determine receiver ID (the other user in the conversation)
        finalReceiverId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
      } catch (error) {
        console.error('Error getting conversation:', error);
        socket.emit('error', { message: 'Failed to get conversation details' });
        return;
      }
    }

    if (!finalReceiverId) {
      socket.emit('error', { message: 'Receiver ID or conversation ID is required' });
      return;
    }

    if (senderId === finalReceiverId) {
      socket.emit('error', { message: 'Cannot send message to yourself' });
      return;
    }

    const result = await messageService.sendMessage({
      senderId,
      receiverId: finalReceiverId,
      content,
      messageType
    });

    // Get WebSocket service instance
    const webSocketService = require('../../services/websocket.service');
    
    // Emit WebSocket events for real-time messaging
    webSocketService.emitNewMessage(result.conversationId, result.message);
    
    // Update conversation for both users
    const updatedConversation = await messageService.getOrCreateConversation(senderId, finalReceiverId);
    webSocketService.emitConversationUpdate(senderId, {
      id: updatedConversation.id,
      otherUser: updatedConversation.user1Id === senderId ? updatedConversation.user2 : updatedConversation.user1,
      lastMessage: result.message,
      unreadCount: 0, // For sender
      lastMessageAt: updatedConversation.lastMessageAt,
      createdAt: updatedConversation.createdAt
    });
    
    webSocketService.emitConversationUpdate(finalReceiverId, {
      id: updatedConversation.id,
      otherUser: updatedConversation.user1Id === finalReceiverId ? updatedConversation.user2 : updatedConversation.user1,
      lastMessage: result.message,
      unreadCount: 1, // For receiver (new unread message)
      lastMessageAt: updatedConversation.lastMessageAt,
      createdAt: updatedConversation.createdAt
    });

    // Emit success to sender
    socket.emit('message_sent', {
      message: result.message,
      success: true
    });

  } catch (error) {
    console.error('Error handling WebSocket send message:', error);
    socket.emit('error', { 
      message: 'Failed to send message', 
      error: error.message 
    });
  }
}

/**
 * Handle marking messages as read via WebSocket
 * @param {Object} socket - WebSocket socket instance
 * @param {Object} data - Data containing conversationId
 */
async function handleMarkMessagesRead(socket, data) {
  try {
    const { conversationId } = data;
    const userId = socket.userId;

    if (!userId) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    const result = await messageService.markMessagesAsRead(conversationId, userId);

    // Get WebSocket service instance and emit read status if messages were marked
    if (result.count > 0) {
      const webSocketService = require('../../services/websocket.service');
      webSocketService.emitMessageRead(result.conversationId, {
        userId: result.userId,
        conversationId: result.conversationId,
        markedCount: result.count
      });
    }
    
    socket.emit('messages_marked_read', { 
      conversationId,
      markedCount: result.count,
      success: true
    });

  } catch (error) {
    console.error('Error handling WebSocket mark messages read:', error);
    socket.emit('error', { 
      message: 'Failed to mark messages as read', 
      error: error.message 
    });
  }
}

/**
 * Handle getting conversation messages via WebSocket
 * @param {Object} socket - WebSocket socket instance
 * @param {Object} data - Data containing conversationId, page, limit
 */
async function handleGetMessages(socket, data) {
  try {
    const { conversationId, page = 1, limit = 50 } = data;
    const userId = socket.userId;

    if (!userId) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    const result = await messageService.getConversationMessages(
      conversationId, 
      userId, 
      page, 
      limit
    );
    
    socket.emit('messages_loaded', {
      conversationId,
      ...result,
      success: true
    });

  } catch (error) {
    console.error('Error handling WebSocket get messages:', error);
    socket.emit('error', { 
      message: 'Failed to load messages', 
      error: error.message 
    });
  }
}

/**
 * Handle getting user conversations via WebSocket
 * @param {Object} socket - WebSocket socket instance
 */
async function handleGetConversations(socket) {
  try {
    const userId = socket.userId;

    if (!userId) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const conversations = await messageService.getUserConversations(userId);
    
    socket.emit('conversations_loaded', {
      conversations,
      success: true
    });

  } catch (error) {
    console.error('Error handling WebSocket get conversations:', error);
    socket.emit('error', { 
      message: 'Failed to load conversations', 
      error: error.message 
    });
  }
}

module.exports = {
  handleSendMessage,
  handleMarkMessagesRead,
  handleGetMessages,
  handleGetConversations
}; 