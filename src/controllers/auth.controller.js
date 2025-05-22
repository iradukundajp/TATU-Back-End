const authService = require('../services/auth.service');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if required fields are present
    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Check if email is already taken
    const existingUser = await req.prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    // Create the user
    const user = await authService.register(userData);
    const token = authService.generateToken(user);
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
};

/**
 * Login a user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if required fields are present
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Attempt to login
    const result = await authService.login(email, password);
    
    if (!result) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await req.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isArtist: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarConfiguration: true, // Added this line
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile
};