const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireOwnership } = require('../middlewares/auth.middleware');
const { uploadAvatar, uploadCustomTattoo } = require('../utils/upload');

// Public routes
router.get('/', userController.getAllUsers);
router.get('/featured', userController.getFeaturedArtists);
router.get('/:id', userController.getUserById);

// Protected routes
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

// Avatar upload
router.post('/:id/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);

// PATCH /profile (update own profile)
router.patch('/profile', authenticate, userController.updateProfile);

// PUT /profile/avatar-configuration (update avatar configuration for own profile)
router.put('/profile/avatar-configuration', authenticate, userController.updateAvatarConfiguration);

// POST /profile/custom-tattoo (upload a custom tattoo image for the authenticated user)
router.post('/profile/custom-tattoo', authenticate, uploadCustomTattoo.single('tattooImage'), userController.uploadCustomTattooImage);

module.exports = router;