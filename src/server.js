require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('./generated/prisma');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Routes import
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const tattooRoutes = require('./routes/tattoo.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TATU API',
      version: '1.0.0',
      description: 'API for TATU - Tattoo Artist Connection Platform',
      contact: {
        name: 'API Support',
        email: 'support@tatu.com',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${PORT}`,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/swagger/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      'http://localhost:8000',
      'http://localhost:8081',
      'http://localhost:19000',
      'http://localhost:19006',
      // Expo development
      'http://127.0.0.1:19000',
      'http://127.0.0.1:19006',
      'exp://',
      // Allow all Expo development client URLs (they have dynamic IPs)
      /^exp:\/\/.*$/,
      /^https:\/\/.*\.expo\.dev$/,
      /^https:\/\/.*\.expo\.io$/,
      // Add frontend production URL when available
      // 'https://your-frontend-url.com'
    ];

    // Check if the origin is allowed
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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));

// Use json parser only for non-multipart requests
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Skip json parsing for multipart/form-data
    console.log('Skipping JSON body parser for multipart request');
    next();
  } else {
    // Use JSON parser for regular requests
    express.json()(req, res, next);
  }
});

// Important: Don't use express.json() middleware for multipart/form-data routes
// The multer middleware will handle that

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Make Prisma client available in request
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes); // Changed from portfolios to portfolio to match frontend
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tattoos', tattooRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('TATU API is running. <a href="/api-docs">View API Documentation</a>');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from database');
  process.exit(0);
});

module.exports = app;
