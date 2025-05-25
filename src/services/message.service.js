const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Message service for handling messaging operations
 */

/**
 * Get or create a conversation between two users
 * @param {string} user1Id - First user ID
 * @param {string} user2Id - Second user ID
 * @returns {Promise<object>} - Conversation object
 */
async function getOrCreateConversation(user1Id, user2Id) {
  // Ensure consistent ordering (smaller ID first)
  const [firstUserId, secondUserId] = [user1Id, user2Id].sort();
  
  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: firstUserId, user2Id: secondUserId },
        { user1Id: secondUserId, user2Id: firstUserId }
      ]
    },
    include: {
      user1: {
        select: { id: true, name: true, avatarUrl: true, isArtist: true }
      },
      user2: {
        select: { id: true, name: true, avatarUrl: true, isArtist: true }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true }
          }
        }
      }
    }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        user1Id: firstUserId,
        user2Id: secondUserId,
        lastMessageAt: new Date()
      },
      include: {
        user1: {
          select: { id: true, name: true, avatarUrl: true, isArtist: true }
        },
        user2: {
          select: { id: true, name: true, avatarUrl: true, isArtist: true }
        },
        messages: true
      }
    });
  }

  return conversation;
}

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of conversations
 */
async function getUserConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    },
    include: {
      user1: {
        select: { id: true, name: true, avatarUrl: true, isArtist: true }
      },
      user2: {
        select: { id: true, name: true, avatarUrl: true, isArtist: true }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true }
          }
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              receiverId: userId,
              isRead: false
            }
          }
        }
      }
    },
    orderBy: {
      lastMessageAt: 'desc'
    }
  });

  // Format conversations to include the other user's info
  return conversations.map(conversation => {
    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0] || null;
    const unreadCount = conversation._count.messages;

    return {
      id: conversation.id,
      otherUser,
      lastMessage,
      unreadCount,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt
    };
  });
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - Current user ID (for access control)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Messages per page (default: 50)
 * @returns {Promise<object>} - Messages and pagination info
 */
async function getConversationMessages(conversationId, userId, page = 1, limit = 50) {
  // Verify user has access to this conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    }
  });

  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  const skip = (page - 1) * limit;

  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.message.count({
      where: { conversationId }
    })
  ]);

  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + messages.length < totalCount
    }
  };
}

/**
 * Send a message
 * @param {object} messageData - Message data
 * @returns {Promise<object>} - Created message
 */
async function sendMessage(messageData) {
  const { senderId, receiverId, content, messageType = 'text' } = messageData;

  // Get or create conversation
  const conversation = await getOrCreateConversation(senderId, receiverId);

  // Create the message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
      messageType,
      isRead: false
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true }
      },
      receiver: {
        select: { id: true, name: true, avatarUrl: true }
      }
    }
  });

  // Update conversation's lastMessageAt
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() }
  });

  return message;
}

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (receiver)
 * @returns {Promise<number>} - Number of messages marked as read
 */
async function markMessagesAsRead(conversationId, userId) {
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return result.count;
}

/**
 * Get unread message count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Total unread messages count
 */
async function getUnreadMessageCount(userId) {
  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false
    }
  });

  return count;
}

/**
 * Delete a message (sender only)
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID (must be sender)
 * @returns {Promise<boolean>} - Success status
 */
async function deleteMessage(messageId, userId) {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId
    }
  });

  if (!message) {
    throw new Error('Message not found or unauthorized');
  }

  await prisma.message.delete({
    where: { id: messageId }
  });

  return true;
}

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteMessage
}; 