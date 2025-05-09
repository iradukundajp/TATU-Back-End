const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public routes
router.get('/artist/:artistId', reviewController.getArtistReviews);

// Protected routes
router.post('/', authenticate, reviewController.createReview);
router.put('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router; 