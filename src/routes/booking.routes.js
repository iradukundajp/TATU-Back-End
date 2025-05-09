const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, requireArtist } = require('../middlewares/auth.middleware');

// All routes are protected
router.get('/user', authenticate, bookingController.getUserBookings);
router.get('/artist', authenticate, requireArtist, bookingController.getArtistBookings);
router.post('/', authenticate, bookingController.createBooking);
router.put('/:id/status', authenticate, requireArtist, bookingController.updateBookingStatus);
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router; 