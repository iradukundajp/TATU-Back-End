// src/controllers/aftercare.controller.js
const path = require('path');
const imagekit = require('../config/imagekit');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const messageService = require('../services/message.service');

/**
 * Create aftercare for a booking (artist only, booking must be completed)
 */
const createAftercare = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const { description, images } = req.body; // images: array of URLs
    const artistId = req.user.id;

    // Check booking exists, belongs to artist, and is completed
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { aftercare: true }
    });
    if (!booking || booking.artistId !== artistId) {
      return res.status(403).json({ message: 'Not authorized for this booking' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Booking must be completed to add aftercare' });
    }
    if (booking.aftercare) {
      return res.status(400).json({ message: 'Aftercare already exists for this booking' });
    }
    // Create aftercare
    const aftercare = await req.prisma.aftercare.create({
      data: {
        description,
        images,
        artistId,
        bookingId: booking.id
      }
    });

    // Send aftercare message to user
    try {
      await messageService.sendMessage({
        senderId: artistId,
        receiverId: booking.userId,
        content: JSON.stringify({ bookingId: booking.id, aftercareId: aftercare.id }),
        messageType: 'aftercare'
      });
    } catch (err) {
      console.error('Failed to send aftercare message:', err);
    }

    res.status(201).json(aftercare);
  } catch (error) {
    console.error('Create aftercare error:', error);
    res.status(500).json({ message: 'Failed to create aftercare', error: error.message });
  }
};

/**
 * Get aftercare for a booking (user or artist)
 */
const getAftercare = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user.id;
    const isArtist = req.user.isArtist;
    // Check booking exists and user is owner or artist
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { aftercare: true }
    });
    if (!booking || (booking.userId !== userId && booking.artistId !== userId)) {
      return res.status(403).json({ message: 'Not authorized for this booking' });
    }
    if (!booking.aftercare) {
      return res.status(404).json({ message: 'No aftercare found for this booking' });
    }
    res.json(booking.aftercare);
  } catch (error) {
    console.error('Get aftercare error:', error);
    res.status(500).json({ message: 'Failed to get aftercare', error: error.message });
  }
};

/**
 * Upload aftercare image to ImageKit
 */
const uploadAftercareImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const userId = req.user.id;
    const fileName = `${userId}_aftercare_${Date.now()}_${req.file.originalname}`;
    const imageKitResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: fileName,
      folder: `aftercare/${userId}`,
      useUniqueFileName: true
    });
    res.json({ filePath: imageKitResponse.url });
  } catch (error) {
    console.error('Upload aftercare image error:', error);
    res.status(500).json({ message: 'Failed to upload aftercare image', error: error.message });
  }
};

/**
 * Update aftercare for a booking (artist only, booking must be completed)
 */
const updateAftercare = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const { description, images } = req.body; // images: array of URLs
    const artistId = req.user.id;

    // Check booking exists, belongs to artist, and is completed
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { aftercare: true }
    });
    if (!booking || booking.artistId !== artistId) {
      return res.status(403).json({ message: 'Not authorized for this booking' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Booking must be completed to update aftercare' });
    }
    if (!booking.aftercare) {
      return res.status(404).json({ message: 'No aftercare found for this booking' });
    }
    // Update aftercare
    const aftercare = await req.prisma.aftercare.update({
      where: { id: booking.aftercare.id },
      data: {
        description,
        images,
      }
    });

    // Send aftercare message to user
    try {
      await messageService.sendMessage({
        senderId: artistId,
        receiverId: booking.userId,
        content: JSON.stringify({ bookingId: booking.id, aftercareId: aftercare.id }),
        messageType: 'aftercare'
      });
    } catch (err) {
      console.error('Failed to send aftercare message:', err);
    }

    res.json(aftercare);
  } catch (error) {
    console.error('Update aftercare error:', error);
    res.status(500).json({ message: 'Failed to update aftercare', error: error.message });
  }
};

module.exports = {
  createAftercare,
  getAftercare,
  uploadAftercareImage,
  updateAftercare,
  upload, // Export multer upload middleware
};
