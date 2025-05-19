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

/**
 * Add image to the authenticated user's portfolio
 */
const addMyPortfolioImage = async (req, res) => {
  try {
    console.log('Starting addMyPortfolioImage');
    console.log('User:', req.user);
    console.log('Request headers:', req.headers);
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    const artistId = req.user.id;
    const { caption } = req.body;
    
    // Ensure we have an uploaded file
    if (!req.file) {
      console.error('No file in request: req.file is undefined');
      return res.status(400).json({ 
        message: 'No image uploaded',
        details: 'req.file is undefined. Check the FormData format and multer configuration.'
      });
    }
    
    console.log('File details:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Check if portfolio exists
    let existingPortfolio = await req.prisma.portfolio.findUnique({
      where: { artistId }
    });
    
    console.log('Existing portfolio:', existingPortfolio);
    
    // Create a portfolio if it doesn't exist
    if (!existingPortfolio) {
      console.log('Creating new portfolio for artist:', artistId);
      existingPortfolio = await req.prisma.portfolio.create({
        data: {
          artistId,
          about: "",
          styles: []
        }
      });
      console.log('New portfolio created:', existingPortfolio);
    }
    
    // Generate URL for the uploaded file
    const relativePath = `/uploads/images/${req.file.filename}`;
    console.log('Image path:', relativePath);
    
    // Add image to portfolio
    const image = await req.prisma.tattooImage.create({
      data: {
        url: relativePath,
        caption: caption || "",
        portfolioId: existingPortfolio.id
      }
    });
    
    console.log('Image added:', image);
    
    // Return the image URL in the format expected by the frontend
    res.status(201).json({ 
      imageUrl: relativePath,
      id: image.id,
      caption: image.caption
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({ 
      message: 'Failed to add image',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get the authenticated user's portfolio
 */
const getMyPortfolio = async (req, res) => {
  try {
    console.log('Getting portfolio for authenticated user:', req.user.id);
    
    const artistId = req.user.id;
    
    // Check if portfolio exists
    let portfolio = await req.prisma.portfolio.findUnique({
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
    
    // If no portfolio exists yet, create an empty one
    if (!portfolio) {
      console.log('No portfolio found, creating empty portfolio for artist:', artistId);
      portfolio = await req.prisma.portfolio.create({
        data: {
          artistId,
          about: "",
          styles: []
        },
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
    }
    
    // Transform the data to match the frontend's expected format for portfolio items
    const portfolioItems = portfolio.images.map(image => ({
      id: image.id,
      imageUrl: image.url,
      caption: image.caption
    }));
    
    console.log(`Returning ${portfolioItems.length} portfolio items`);
    
    res.json(portfolioItems);
  } catch (error) {
    console.error('Get my portfolio error:', error);
    res.status(500).json({ message: 'Failed to get portfolio', error: error.message });
  }
};

/**
 * Delete an item from the current user's portfolio
 */
const deleteMyPortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const artistId = req.user.id;
    
    console.log(`Deleting portfolio item ${id} for artist ${artistId}`);
    
    // Find the image to verify ownership
    const image = await req.prisma.tattooImage.findFirst({
      where: {
        id,
        portfolio: {
          artistId
        }
      }
    });
    
    if (!image) {
      return res.status(404).json({ 
        message: 'Image not found or not in your portfolio',
        details: `Item with ID ${id} not found or does not belong to your portfolio`
      });
    }
    
    // Delete the file from the filesystem if it exists
    if (image.url && image.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', image.url);
      console.log('Deleting file:', filePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File deleted successfully');
      } else {
        console.log('File not found on disk');
      }
    }
    
    // Delete the image from the database
    await req.prisma.tattooImage.delete({
      where: { id }
    });
    
    console.log('Image deleted successfully from database');
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ 
      message: 'Failed to delete portfolio item',
      error: error.message
    });
  }
};

module.exports = {
  getAllPortfolios,
  getPortfolioByArtistId,
  createOrUpdatePortfolio,
  addImageToPortfolio,
  deleteImageFromPortfolio,
  addMyPortfolioImage,
  getMyPortfolio,
  deleteMyPortfolioItem
}; 