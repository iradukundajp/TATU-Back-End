const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const url = require('url');
const websocketController = require('../src/controllers/websocket.controller');

class WebSocketService {
  constructor() {
    this.io = null;
    this.wss = null;
    this.authenticatedUsers = new Map(); // userId -> socket
    this.userRooms = new Map(); // userId -> Set of conversationIds
  }

  initialize(server) {
    console.log('Initializing WebSocket service...');
    
    // Initialize Socket.IO
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    console.log('Socket.IO server initialized');

    // Initialize plain WebSocket server on separate port
    console.log('🔧 Creating WebSocket server on port 5001...');
    try {
      this.wss = new WebSocket.Server({ 
        port: 5001,
        perMessageDeflate: false
      });
      
      this.wss.on('listening', () => {
        console.log('Plain WebSocket server successfully started on port 5001');
        console.log('WebSocket endpoint: ws://localhost:5001');
      });

      this.wss.on('error', (error) => {
        console.error('Plain WebSocket server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error('Port 5001 is already in use. WebSocket server failed to start.');
        }
      });
      
      // Add immediate check
      setTimeout(() => {
        if (this.wss.readyState === WebSocket.CONNECTING) {
          console.log('⏳ WebSocket server still connecting...');
        }
      }, 1000);
      
      console.log('🔧 WebSocket server instance created, waiting for listening event...');
      
    } catch (error) {
      console.error('Failed to create WebSocket server:', error);
      console.error('Error details:', error.message);
      return;
    }

    this.setupSocketIOHandlers();
    this.setupWebSocketHandlers();
    console.log('🔧 WebSocket handlers configured');
  }

  setupSocketIOHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Socket.IO client connected:', socket.id);

      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;
          
          socket.userId = userId;
          this.authenticatedUsers.set(userId, socket);
          this.userRooms.set(userId, new Set());
          
          socket.emit('authenticated', { userId });
          console.log(`Socket.IO user ${userId} authenticated`);
        } catch (error) {
          console.error('Socket.IO authentication failed:', error);
          socket.emit('authentication_error', 'Invalid token');
          socket.disconnect();
        }
      });

      socket.on('join_conversation', (data) => {
        if (socket.userId) {
          const conversationId = data.conversationId || data;
          socket.join(`conversation_${conversationId}`);
          const userRooms = this.userRooms.get(socket.userId);
          if (userRooms) {
            userRooms.add(conversationId);
          }
          console.log(`Socket.IO user ${socket.userId} joined conversation ${conversationId}`);
        }
      });

      socket.on('leave_conversation', (data) => {
        if (socket.userId) {
          const conversationId = data.conversationId || data;
          socket.leave(`conversation_${conversationId}`);
          const userRooms = this.userRooms.get(socket.userId);
          if (userRooms) {
            userRooms.delete(conversationId);
          }
          console.log(`Socket.IO user ${socket.userId} left conversation ${conversationId}`);
        }
      });

      socket.on('typing_start', ({ conversationId }) => {
        if (socket.userId) {
          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId: socket.userId,
            conversationId
          });
        }
      });

      socket.on('typing_stop', ({ conversationId }) => {
        if (socket.userId) {
          socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
            userId: socket.userId,
            conversationId
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

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.authenticatedUsers.delete(socket.userId);
          this.userRooms.delete(socket.userId);
          console.log(`Socket.IO user ${socket.userId} disconnected`);
        }
      });
    });
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, request) => {
      console.log('Plain WebSocket client connected from:', request.socket.remoteAddress);
      console.log('WebSocket URL:', request.url);
      
      ws.isAlive = true;
      ws.userId = null;
      ws.rooms = new Set();

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'authenticate':
              try {
                const decoded = jwt.verify(message.data.token, process.env.JWT_SECRET);
                ws.userId = decoded.id;
                this.authenticatedUsers.set(decoded.id, ws);
                this.userRooms.set(decoded.id, new Set());
                
                ws.send(JSON.stringify({
                  type: 'authenticated',
                  data: { userId: decoded.id }
                }));
                console.log(`Plain WebSocket user ${decoded.id} authenticated`);
              } catch (error) {
                console.error('Plain WebSocket authentication failed:', error);
                ws.send(JSON.stringify({
                  type: 'authentication_error',
                  data: 'Invalid token'
                }));
                ws.close();
              }
              break;

            case 'join_conversation':
              if (ws.userId && message.data?.conversationId) {
                ws.rooms.add(message.data.conversationId);
                const userRooms = this.userRooms.get(ws.userId);
                if (userRooms) {
                  userRooms.add(message.data.conversationId);
                }
                console.log(`Plain WebSocket user ${ws.userId} joined conversation ${message.data.conversationId}`);
              }
              break;

            case 'leave_conversation':
              if (ws.userId && message.data?.conversationId) {
                ws.rooms.delete(message.data.conversationId);
                const userRooms = this.userRooms.get(ws.userId);
                if (userRooms) {
                  userRooms.delete(message.data.conversationId);
                }
                console.log(`Plain WebSocket user ${ws.userId} left conversation ${message.data.conversationId}`);
              }
              break;

            case 'typing_start':
              if (ws.userId && message.data?.conversationId) {
                this.broadcastToConversation(message.data.conversationId, {
                  type: 'user_typing',
                  data: {
                    userId: ws.userId,
                    conversationId: message.data.conversationId
                  }
                }, ws.userId);
              }
              break;

            case 'typing_stop':
              if (ws.userId && message.data?.conversationId) {
                this.broadcastToConversation(message.data.conversationId, {
                  type: 'user_stopped_typing',
                  data: {
                    userId: ws.userId,
                    conversationId: message.data.conversationId
                  }
                }, ws.userId);
              }
              break;

            case 'send_message':
              // Create a mock socket object for the controller
              const mockSocket = {
                userId: ws.userId,
                emit: (event, data) => {
                  ws.send(JSON.stringify({ type: event, data }));
                }
              };
              websocketController.handleSendMessage(mockSocket, message.data);
              break;

            case 'mark_messages_read':
              const mockSocketRead = {
                userId: ws.userId,
                emit: (event, data) => {
                  ws.send(JSON.stringify({ type: event, data }));
                }
              };
              websocketController.handleMarkMessagesRead(mockSocketRead, message.data);
              break;

            case 'get_messages':
              const mockSocketMessages = {
                userId: ws.userId,
                emit: (event, data) => {
                  ws.send(JSON.stringify({ type: event, data }));
                }
              };
              websocketController.handleGetMessages(mockSocketMessages, message.data);
              break;

            case 'get_conversations':
              const mockSocketConversations = {
                userId: ws.userId,
                emit: (event, data) => {
                  ws.send(JSON.stringify({ type: event, data }));
                }
              };
              websocketController.handleGetConversations(mockSocketConversations);
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.authenticatedUsers.delete(ws.userId);
          this.userRooms.delete(ws.userId);
          console.log(`Plain WebSocket user ${ws.userId} disconnected`);
        }
      });
    });

    // Heartbeat to keep connections alive
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  // Broadcast to all clients in a conversation (both Socket.IO and WebSocket)
  broadcastToConversation(conversationId, message, excludeUserId = null) {
    // Broadcast via Socket.IO
    if (this.io) {
      const socketIOMessage = message.data || message;
      this.io.to(`conversation_${conversationId}`).emit(message.type, socketIOMessage);
    }

    // Broadcast via plain WebSocket
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN && 
          ws.userId && 
          ws.userId !== excludeUserId &&
          ws.rooms.has(conversationId)) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Send message to specific user
  sendToUser(userId, message) {
    const socket = this.authenticatedUsers.get(userId);
    if (socket) {
      if (socket.emit) {
        // Socket.IO client
        socket.emit(message.type, message.data || message);
      } else if (socket.send) {
        // Plain WebSocket client
        socket.send(JSON.stringify(message));
      }
    }
  }

  // Emit new message to conversation participants
  emitNewMessage(conversationId, message) {
    console.log(`Broadcasting new message to conversation ${conversationId}`);
    
    // Get users who are currently in the conversation room
    const usersInRoom = new Set();
    
    // Check Socket.IO users in room
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
      if (room) {
        room.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket && socket.userId) {
            usersInRoom.add(socket.userId);
          }
        });
      }
    }
    
    // Check WebSocket users in room
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN && 
          ws.userId && 
          ws.rooms.has(conversationId)) {
        usersInRoom.add(ws.userId);
      }
    });
    
    console.log(`Users in conversation room: ${Array.from(usersInRoom).join(', ')}`);
    
    // Send to all relevant users (both in room and not in room)
    const targetUsers = new Set([message.senderId, message.receiverId]);
    
    targetUsers.forEach(userId => {
      if (userId) {
        console.log(`Sending new message to user ${userId}`);
        this.sendToUser(userId, {
          type: 'new_message',
          data: message
        });
      }
    });
  }

  // Emit message read status update
  emitMessageRead(conversationId, data) {
    console.log(`Broadcasting message read status to conversation ${conversationId}`);
    this.broadcastToConversation(conversationId, {
      type: 'messages_read',
      data
    });
  }

  // Emit conversation update
  emitConversationUpdate(userId, conversation) {
    console.log(`Sending conversation update to user ${userId}`);
    this.sendToUser(userId, {
      type: 'conversation_updated',
      data: conversation
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.authenticatedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.authenticatedUsers.has(userId);
  }
}

module.exports = new WebSocketService(); 