const { hashPassword } = require('../services/auth.service');
const fs = require('fs');
const path = require('path');

/**
 * Get all users (with pagination)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, isArtist } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (isArtist !== undefined) {
      where.isArtist = isArtist === 'true';
    }
    
    const users = await req.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        isArtist: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true
      },
      skip,
      take: parseInt(limit)
    });
    
    const total = await req.prisma.user.count({ where });
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await req.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isArtist: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true,
        portfolio: {
          include: {
            images: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // Ensure user can only update their own profile
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Unauthorized to update this user' });
    }
    
    // Handle password update separately
    let updateData = { ...userData };
    
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData.email; // Don't allow email change through this endpoint
    delete updateData.avatarUrl; // Avatar is updated through a separate endpoint
    
    const updatedUser = await req.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isArtist: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

/**
 * Upload avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure user can only update their own avatar
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Unauthorized to update this user\'s avatar' });
    }
    
    // Ensure we have an uploaded file
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar image uploaded' });
    }
    
    // Get the current user to check if they have an existing avatar
    const currentUser = await req.prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true }
    });
    
    // If there's an existing avatar, delete the file
    if (currentUser.avatarUrl && currentUser.avatarUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', currentUser.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Generate URL for the uploaded file
    const relativePath = `/uploads/avatars/${req.file.filename}`;
    
    // Update the user with the new avatar URL
    const updatedUser = await req.prisma.user.update({
      where: { id },
      data: { avatarUrl: relativePath },
      select: {
        id: true,
        name: true,
        email: true,
        isArtist: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure user can only delete their own account
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Unauthorized to delete this user' });
    }
    
    // Get the current user to check if they have an avatar
    const currentUser = await req.prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true }
    });
    
    // If there's an avatar, delete the file
    if (currentUser.avatarUrl && currentUser.avatarUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', currentUser.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await req.prisma.user.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

/**
 * Update own profile (PATCH /profile)
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, location, experience, hourlyRate, specialties, styles } = req.body;
    const updateData = { name, bio, location };
    
    if (req.user.isArtist) {
      if (experience !== undefined) updateData.experience = experience;
      if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
      if (specialties !== undefined) updateData.specialties = specialties;
      if (styles !== undefined) updateData.styles = styles;
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    const updatedUser = await req.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isArtist: true,
        bio: true,
        location: true,
        avatarUrl: true,
        experience: true,
        hourlyRate: true,
        specialties: true,
        styles: true,
        createdAt: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

/**
 * Get featured artists for home screen
 */
const getFeaturedArtists = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get artists with the isArtist flag, limited by query param
    const artists = await req.prisma.user.findMany({
      where: { 
        isArtist: true 
      },
      select: {
        id: true,
        name: true,
        location: true,
        bio: true,
        avatarUrl: true,
        specialties: true,
        styles: true,
        experience: true,
        hourlyRate: true
      },
      take: parseInt(limit),
      orderBy: [
        { experience: 'desc' }, // More experienced artists first
        { createdAt: 'desc' }   // Then newer profiles
      ]
    });
    
    // Enhance with fake ratings for now (in a real app, this would come from reviews)
    const enhancedArtists = artists.map(artist => ({
      ...artist,
      rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
      reviewCount: Math.floor(Math.random() * 50) + 5 // Random number of reviews
    }));
    
    res.json(enhancedArtists);
  } catch (error) {
    console.error('Get featured artists error:', error);
    res.status(500).json({ message: 'Failed to get featured artists', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  uploadAvatar,
  deleteUser,
  getFeaturedArtists,
  updateProfile,
}; 