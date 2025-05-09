const fs = require('fs');
const path = require('path');

/**
 * Get all portfolios (with pagination)
 */
const getAllPortfolios = async (req, res) => {
  try {
    const { page = 1, limit = 10, styles } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    
    // Filter by styles if provided
    if (styles) {
      const styleList = styles.split(',');
      where.styles = {
        hasSome: styleList
      };
    }
    
    const portfolios = await req.prisma.portfolio.findMany({
      where,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            location: true,
            avatarUrl: true
          }
        },
        images: true
      },
      skip,
      take: parseInt(limit)
    });
    
    const total = await req.prisma.portfolio.count({ where });
    
    res.json({
      portfolios,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all portfolios error:', error);
    res.status(500).json({ message: 'Failed to get portfolios', error: error.message });
  }
};

/**
 * Get portfolio by artist ID
 */
const getPortfolioByArtistId = async (req, res) => {
  try {
    const { artistId } = req.params;
    
    const portfolio = await req.prisma.portfolio.findUnique({
      where: { artistId },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            location: true,
            avatarUrl: true
          }
        },
        images: true
      }
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio by artist ID error:', error);
    res.status(500).json({ message: 'Failed to get portfolio', error: error.message });
  }
};

/**
 * Create or update portfolio
 */
const createOrUpdatePortfolio = async (req, res) => {
  try {
    const { artistId } = req.params;
    const portfolioData = req.body;
    
    // Ensure user can only manage their own portfolio
    if (req.user.id !== artistId) {
      return res.status(403).json({ message: 'Unauthorized to manage this portfolio' });
    }
    
    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Only artists can have portfolios' });
    }
    
    // Check if portfolio exists
    const existingPortfolio = await req.prisma.portfolio.findUnique({
      where: { artistId }
    });
    
    let portfolio;
    
    if (existingPortfolio) {
      // Update existing portfolio
      portfolio = await req.prisma.portfolio.update({
        where: { artistId },
        data: {
          about: portfolioData.about,
          styles: portfolioData.styles
        },
        include: {
          images: true
        }
      });
    } else {
      // Create new portfolio
      portfolio = await req.prisma.portfolio.create({
        data: {
          artistId,
          about: portfolioData.about,
          styles: portfolioData.styles || []
        },
        include: {
          images: true
        }
      });
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Create/update portfolio error:', error);
    res.status(500).json({ message: 'Failed to manage portfolio', error: error.message });
  }
};

/**
 * Add image to portfolio
 */
const addImageToPortfolio = async (req, res) => {
  try {
    const { artistId } = req.params;
    const { caption } = req.body;
    
    // Ensure we have an uploaded file
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    // Ensure user can only manage their own portfolio
    if (req.user.id !== artistId) {
      return res.status(403).json({ message: 'Unauthorized to manage this portfolio' });
    }
    
    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Only artists can have portfolios' });
    }
    
    // Check if portfolio exists
    const existingPortfolio = await req.prisma.portfolio.findUnique({
      where: { artistId }
    });
    
    if (!existingPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found, create one first' });
    }
    
    // Generate URL for the uploaded file
    const relativePath = `/uploads/images/${req.file.filename}`;
    
    // Add image to portfolio
    const image = await req.prisma.tattooImage.create({
      data: {
        url: relativePath,
        caption,
        portfolioId: existingPortfolio.id
      }
    });
    
    res.status(201).json(image);
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({ message: 'Failed to add image', error: error.message });
  }
};

/**
 * Delete image from portfolio
 */
const deleteImageFromPortfolio = async (req, res) => {
  try {
    const { artistId, imageId } = req.params;
    
    // Ensure user can only manage their own portfolio
    if (req.user.id !== artistId) {
      return res.status(403).json({ message: 'Unauthorized to manage this portfolio' });
    }
    
    // Check if image exists and belongs to the artist's portfolio
    const image = await req.prisma.tattooImage.findFirst({
      where: {
        id: imageId,
        portfolio: {
          artistId
        }
      }
    });
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found or not in your portfolio' });
    }
    
    // Delete the file from the filesystem if it exists
    if (image.url && image.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', image.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete the image from the database
    await req.prisma.tattooImage.delete({
      where: { id: imageId }
    });
    
    res.status(204).end();
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

module.exports = {
  getAllPortfolios,
  getPortfolioByArtistId,
  createOrUpdatePortfolio,
  addImageToPortfolio,
  deleteImageFromPortfolio
}; 