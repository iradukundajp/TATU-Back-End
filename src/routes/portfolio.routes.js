const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { authenticate, requireArtist } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../utils/upload');

// Public routes
router.get('/', portfolioController.getAllPortfolios);
router.get('/artist/:artistId', portfolioController.getPortfolioByArtistId);

// Protected routes
router.post('/artist/:artistId', authenticate, portfolioController.createOrUpdatePortfolio);
router.put('/artist/:artistId', authenticate, portfolioController.createOrUpdatePortfolio);

// File upload route - single('image') specifies the form field name
router.post('/artist/:artistId/images', authenticate, uploadImage.single('image'), portfolioController.addImageToPortfolio);

router.delete('/artist/:artistId/images/:imageId', authenticate, portfolioController.deleteImageFromPortfolio);

module.exports = router; 