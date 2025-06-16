const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const websocketController = require('../controllers/websocket.controller');

const prisma = new PrismaClient();

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps)
          if (!origin) return callback(null, true);
          
          const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8000',
            'http://localhost:8081',
            'http://localhost:19000',
            'http://localhost:19006',
            'http://127.0.0.1:19000',
            'http://127.0.0.1:19006',
            /^exp:\/\/.*$/,
            /^https:\/\/.*\.expo\.dev$/,
            /^https:\/\/.*\.expo\.io$/,
          ];

          const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin instanceof RegExp) {
              return allowedOrigin.test(origin);
            }
            return allowedOrigin === origin;
          });

          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    console.log('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle authentication
      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;

          // Store user connection
          this.connectedUsers.set(userId, socket.id);
          this.userSockets.set(socket.id, userId);

          socket.userId = userId;
          socket.join(`user_${userId}`);

          console.log(`User ${userId} authenticated and joined room`);
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Authentication failed:', error);
          socket.emit('authentication_error', { message: 'Invalid token' });
        }
      });

      // Handle joining conversation rooms
      socket.on('join_conversation', (conversationId) => {
        if (socket.userId) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        }
      });

      // Handle leaving conversation rooms
      socket.on('leave_conversation', (conversationId) => {
        if (socket.userId) {
          socket.leave(`conversation_${conversationId}`);
          console.log(`User ${socket.userId} left conversation ${conversationId}`);
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        if (socket.userId) {
          socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
            userId: socket.userId,
            conversationId: data.conversationId
          });
        }
      });

      socket.on('typing_stop', (data) => {
        if (socket.userId) {
          socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
            userId: socket.userId,
            conversationId: data.conversationId
          });
        }
      });

      // Message handling events
      socket.on('send_message', (data) => {
        websocketController.handleSendMessage(socket, data);
      });

      socket.on('mark_messages_read', (data) => {
        websocketController.handleMarkMessagesRead(socket, data);
      });

      socket.on('get_messages', (data) => {
        websocketController.handleGetMessages(socket, data);
      });

      socket.on('get_conversations', () => {
        websocketController.handleGetConversations(socket);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.userSockets.delete(socket.id);
          console.log(`User ${socket.userId} disconnected`);
        }
      });
    });
  }

  // Emit new message to conversation participants
  emitNewMessage(message, conversationId) {
    if (this.io) {
      this.io.to(`conversation_${conversationId}`).emit('new_message', message);
      console.log(`Emitted new message to conversation ${conversationId}`);
    }
  }

  // Emit message read status update
  emitMessageRead(conversationId, userId, messageIds) {
    if (this.io) {
      this.io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        userId,
        messageIds
      });
      console.log(`Emitted message read status for conversation ${conversationId}`);
    }
  }

  // Emit conversation update (for conversation list)
  emitConversationUpdate(userId, conversation) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('conversation_updated', conversation);
      console.log(`Emitted conversation update to user ${userId}`);
    }
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
module.exports = webSocketService; 