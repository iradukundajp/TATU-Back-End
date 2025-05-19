const express = require('express');
const router = express.Router();
const tattooController = require('../controllers/tattoo.controller');
const { authenticate, requireArtist } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../utils/upload');

// Public routes
router.get('/', tattooController.getAllTattooDesigns);
router.get('/artist/:artistId', tattooController.getArtistTattooDesigns);
router.get('/:id', tattooController.getTattooDesignById);

// Artist only routes
router.post('/', authenticate, requireArtist, uploadImage.single('image'), tattooController.createTattooDesign);
router.put('/:id', authenticate, requireArtist, uploadImage.single('image'), tattooController.updateTattooDesign);
router.delete('/:id', authenticate, requireArtist, tattooController.deleteTattooDesign);

// My tattoo designs (for the authenticated artist)
router.get('/my/designs', authenticate, requireArtist, tattooController.getMyTattooDesigns);

module.exports = router; 