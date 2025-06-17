const fs = require('fs');
const path = require('path');

/**
 * Get all tattoo designs (with pagination and filtering)
 */
const getAllTattooDesigns = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      minPrice, 
      maxPrice, 
      size, 
      categories,
      search, // For general text search
      styles  // For filtering by a list of styles (e.g., "Traditional,Watercolor")
    } = req.query;
    
    const skip = (page - 1) * parseInt(limit);
    
    // Build the filter object
    let where = { isAvailable: true };

    // Text search (on title and description)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
        // Optional: if you want the general search to also check the style field:
        // { style: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Multi-style filter (replaces the old singular style filter)
    if (styles) {
      const styleList = styles.split(',').map(s => s.trim()).filter(s => s); // Filter out empty strings
      if (styleList.length > 0) {
        // This condition is ANDed with other top-level conditions in 'where'
        where.style = { in: styleList };
      }
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    if (size) {
      where.size = size;
    }
    
    if (categories) {
      const categoryList = categories.split(',');
      where.categories = {
        hasSome: categoryList
      };
    }
    
    // Get designs with pagination
    const designs = await req.prisma.tattooDesign.findMany({
      where,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            location: true,
            avatarUrl: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get total count for pagination
    const total = await req.prisma.tattooDesign.count({ where });
    
    res.json({
      designs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all tattoo designs error:', error);
    res.status(500).json({ message: 'Failed to get tattoo designs', error: error.message });
  }
};

/**
 * Get tattoo designs for a specific artist
 */
const getArtistTattooDesigns = async (req, res) => {
  try {
    const { artistId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * parseInt(limit);
    
    const designs = await req.prisma.tattooDesign.findMany({
      where: {
        artistId,
        isAvailable: true
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            location: true,
            avatarUrl: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const total = await req.prisma.tattooDesign.count({
      where: {
        artistId,
        isAvailable: true
      }
    });
    
    res.json({
      designs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get artist tattoo designs error:', error);
    res.status(500).json({ message: 'Failed to get artist tattoo designs', error: error.message });
  }
};

/**
 * Get a specific tattoo design by ID
 */
const getTattooDesignById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const design = await req.prisma.tattooDesign.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            location: true,
            avatarUrl: true,
            bio: true
          }
        }
      }
    });
    
    if (!design) {
      return res.status(404).json({ message: 'Tattoo design not found' });
    }
    
    res.json(design);
  } catch (error) {
    console.error('Get tattoo design by ID error:', error);
    res.status(500).json({ message: 'Failed to get tattoo design', error: error.message });
  }
};

/**
 * Create a new tattoo design (artist only)
 */
const createTattooDesign = async (req, res) => {
  try {
    const artistId = req.user.id;
    const { title, description, price, size, style, categories } = req.body;
    
    // Ensure we have an uploaded file
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    // Generate URL for the uploaded file
    const relativePath = `/uploads/images/${req.file.filename}`;
    
    // Parse categories if provided as JSON string
    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = Array.isArray(categories) 
          ? categories 
          : JSON.parse(categories);
      } catch (e) {
        parsedCategories = categories.split(',').map(c => c.trim());
      }
    }
    
    // Create the tattoo design
    const design = await req.prisma.tattooDesign.create({
      data: {
        title,
        description,
        imageUrl: relativePath,
        price: price ? parseFloat(price) : null,
        size,
        style,
        categories: parsedCategories,
        artistId,
      }
    });
    
    res.status(201).json(design);
  } catch (error) {
    console.error('Create tattoo design error:', error);
    res.status(500).json({ message: 'Failed to create tattoo design', error: error.message });
  }
};

/**
 * Update a tattoo design (artist only)
 */
const updateTattooDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const artistId = req.user.id;
    const { title, description, price, size, style, categories, isAvailable } = req.body;
    
    // Check if the design exists and belongs to the artist
    const existingDesign = await req.prisma.tattooDesign.findFirst({
      where: {
        id,
        artistId
      }
    });
    
    if (!existingDesign) {
      return res.status(404).json({ message: 'Tattoo design not found or not owned by you' });
    }
    
    // Parse categories if provided as JSON string
    let parsedCategories;
    if (categories) {
      try {
        parsedCategories = Array.isArray(categories) 
          ? categories 
          : JSON.parse(categories);
      } catch (e) {
        parsedCategories = categories.split(',').map(c => c.trim());
      }
    }
    
    // Prepare update data
    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      ...(size && { size }),
      ...(style && { style }),
      ...(parsedCategories && { categories: parsedCategories }),
      ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) })
    };
    
    // Add image if provided
    if (req.file) {
      // Delete old image if it exists and is in the uploads folder
      if (existingDesign.imageUrl && existingDesign.imageUrl.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '../../', existingDesign.imageUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Generate URL for the new uploaded file
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }
    
    // Update the design
    const updatedDesign = await req.prisma.tattooDesign.update({
      where: { id },
      data: updateData
    });
    
    res.json(updatedDesign);
  } catch (error) {
    console.error('Update tattoo design error:', error);
    res.status(500).json({ message: 'Failed to update tattoo design', error: error.message });
  }
};

/**
 * Delete a tattoo design (artist only)
 */
const deleteTattooDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const artistId = req.user.id;
    
    // Check if the design exists and belongs to the artist
    const existingDesign = await req.prisma.tattooDesign.findFirst({
      where: {
        id,
        artistId
      }
    });
    
    if (!existingDesign) {
      return res.status(404).json({ message: 'Tattoo design not found or not owned by you' });
    }
    
    // Delete the image file if it's in the uploads folder
    if (existingDesign.imageUrl && existingDesign.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', existingDesign.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete the design from the database
    await req.prisma.tattooDesign.delete({
      where: { id }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete tattoo design error:', error);
    res.status(500).json({ message: 'Failed to delete tattoo design', error: error.message });
  }
};

/**
 * Get the authenticated artist's tattoo designs
 */
const getMyTattooDesigns = async (req, res) => {
  try {
    const artistId = req.user.id;
    
    const designs = await req.prisma.tattooDesign.findMany({
      where: { artistId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(designs);
  } catch (error) {
    console.error('Get my tattoo designs error:', error);
    res.status(500).json({ message: 'Failed to get your tattoo designs', error: error.message });
  }
};

module.exports = {
  getAllTattooDesigns,
  getArtistTattooDesigns,
  getTattooDesignById,
  createTattooDesign,
  updateTattooDesign,
  deleteTattooDesign,
  getMyTattooDesigns
};