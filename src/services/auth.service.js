const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma.service');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Hash a password
 * @param {string} password - The plain text password
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 * @param {string} password - The plain text password
 * @param {string} hash - The hashed password
 * @returns {Promise<boolean>} - Whether the password matches
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token for a user
 * @param {object} user - The user object
 * @returns {string} - The JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    isArtist: user.isArtist
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token
 * @returns {object|null} - The decoded token or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Register a new user
 * @param {object} userData - The user data
 * @returns {Promise<object>} - The created user
 */
const register = async (userData) => {
  const { password, ...otherData } = userData;
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      ...otherData,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      isArtist: true,
      createdAt: true
    }
  });
};

/**
 * Login a user
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<object|null>} - The user and token or null if invalid credentials
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return null;
  }
  
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  const token = generateToken(user);
  
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isArtist: user.isArtist
    },
    token
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  register,
  login
}; 