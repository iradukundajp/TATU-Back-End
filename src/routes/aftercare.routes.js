const express = require('express');
const router = express.Router();
const aftercareController = require('../controllers/aftercare.controller');
const { authenticate, requireArtist } = require('../middlewares/auth.middleware');

// POST /api/bookings/:id/aftercare (artist only)
router.post('/bookings/:id/aftercare', authenticate, requireArtist, aftercareController.createAftercare);
// GET /api/bookings/:id/aftercare (user or artist)
router.get('/bookings/:id/aftercare', authenticate, aftercareController.getAftercare);
// PUT /api/bookings/:id/aftercare (artist only)
router.put('/bookings/:id/aftercare', authenticate, requireArtist, aftercareController.updateAftercare);
// POST /api/aftercare/upload-image (artist only)
router.post('/aftercare/upload-image', authenticate, requireArtist, aftercareController.upload.single('file'), aftercareController.uploadAftercareImage);

module.exports = router;
