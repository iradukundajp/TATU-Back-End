/**
 * Get reviews for an artist
 */
const getArtistReviews = async (req, res) => {
  try {
    const { artistId } = req.params;
    
    // Check if artist exists
    const artist = await req.prisma.user.findUnique({
      where: { 
        id: artistId,
        isArtist: true
      }
    });
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    const reviews = await req.prisma.review.findMany({
      where: { artistId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    res.json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get artist reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews', error: error.message });
  }
};

/**
 * Create a review
 */
const createReview = async (req, res) => {
  try {
    const { artistId, rating, comment } = req.body;
    const userId = req.user.id;
    
    // Check if artist exists
    const artist = await req.prisma.user.findUnique({
      where: { 
        id: artistId,
        isArtist: true
      }
    });
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    // Check if user has already reviewed this artist
    const existingReview = await req.prisma.review.findFirst({
      where: {
        userId,
        artistId
      }
    });
    
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this artist' });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Create the review
    const review = await req.prisma.review.create({
      data: {
        userId,
        artistId,
        rating,
        comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};

/**
 * Update a review
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    // Check if review exists and belongs to the user
    const existingReview = await req.prisma.review.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found or not created by you' });
    }
    
    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Update the review
    const review = await req.prisma.review.update({
      where: { id },
      data: {
        rating: rating || existingReview.rating,
        comment: comment !== undefined ? comment : existingReview.comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
    
    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

/**
 * Delete a review
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if review exists and belongs to the user
    const existingReview = await req.prisma.review.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found or not created by you' });
    }
    
    // Delete the review
    await req.prisma.review.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

module.exports = {
  getArtistReviews,
  createReview,
  updateReview,
  deleteReview
}; 