const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { authenticate, requireArtist } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../utils/upload');

// Debug middleware for file uploads
const debugFileUpload = (req, res, next) => {
  console.log('Debug - Request received at:', new Date().toISOString());
  console.log('Debug - Request content-type:', req.headers['content-type']);
  console.log('Debug - Request URL:', req.originalUrl);
  
  // Attach the original handler
  const originalNext = next;
  
  // Override next to log multer's work
  next = function() {
    console.log('Debug - After multer processing:');
    console.log('Debug - req.file:', req.file ? 'File present' : 'No file');
    console.log('Debug - req.body:', req.body);
    originalNext();
  };
  
  // Continue processing
  next();
};

// Public routes
router.get('/', portfolioController.getAllPortfolios);
router.get('/artist/:artistId', portfolioController.getPortfolioByArtistId);

// Get current user's portfolio
router.get('/me', authenticate, requireArtist, portfolioController.getMyPortfolio);

// Protected routes
router.post('/artist/:artistId', authenticate, portfolioController.createOrUpdatePortfolio);
router.put('/artist/:artistId', authenticate, portfolioController.createOrUpdatePortfolio);

// File upload route - single('image') specifies the form field name
router.post('/artist/:artistId/images', authenticate, uploadImage.single('image'), portfolioController.addImageToPortfolio);

// New route for portfolio image uploads - uses the authenticated user's ID
router.post('/images', authenticate, debugFileUpload, uploadImage.single('image'), requireArtist, portfolioController.addMyPortfolioImage);

// Delete specific image from a portfolio
router.delete('/artist/:artistId/images/:imageId', authenticate, portfolioController.deleteImageFromPortfolio);

// Delete current user's portfolio item
router.delete('/:id', authenticate, requireArtist, portfolioController.deleteMyPortfolioItem);

module.exports = router; 