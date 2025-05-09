/**
 * Get all bookings for a user
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await req.prisma.booking.findMany({
      where: { 
        userId 
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to get bookings', error: error.message });
  }
};

/**
 * Get all bookings for an artist
 */
const getArtistBookings = async (req, res) => {
  try {
    const artistId = req.user.id;
    
    // Ensure user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Only artists can access their bookings' });
    }
    
    const bookings = await req.prisma.booking.findMany({
      where: { 
        artistId 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Get artist bookings error:', error);
    res.status(500).json({ message: 'Failed to get bookings', error: error.message });
  }
};

/**
 * Create a booking
 */
const createBooking = async (req, res) => {
  try {
    const { artistId, date, note } = req.body;
    const userId = req.user.id;
    
    // Check if artist exists and is an artist
    const artist = await req.prisma.user.findUnique({
      where: { 
        id: artistId,
        isArtist: true
      }
    });
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    // Create the booking
    const booking = await req.prisma.booking.create({
      data: {
        userId,
        artistId,
        date: new Date(date),
        status: 'pending',
        note
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

/**
 * Update booking status (for artists)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const artistId = req.user.id;
    
    // Ensure user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Only artists can update booking status' });
    }
    
    // Check if booking exists and belongs to the artist
    const existingBooking = await req.prisma.booking.findFirst({
      where: {
        id,
        artistId
      }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found or not associated with this artist' });
    }
    
    // Valid statuses
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    
    // Update the booking
    const booking = await req.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Failed to update booking', error: error.message });
  }
};

/**
 * Cancel a booking (for users)
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if booking exists and belongs to the user
    const existingBooking = await req.prisma.booking.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found or not associated with this user' });
    }
    
    // Update the booking to cancelled
    const booking = await req.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' }
    });
    
    res.json(booking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
};

module.exports = {
  getUserBookings,
  getArtistBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking
}; 