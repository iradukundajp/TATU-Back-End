const { verifyToken } = require('../services/auth.service');

/**
 * Middleware to authenticate requests with JWT token
 */
const authenticate = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Set user data in request
  req.user = payload;
  next();
};

/**
 * Middleware to check if user is an artist
 */
const requireArtist = (req, res, next) => {
  if (!req.user || !req.user.isArtist) {
    return res.status(403).json({ message: 'Artist access required' });
  }
  next();
};

/**
 * Middleware to ensure the logged-in user is the owner of the resource
 */
const requireOwnership = (idField) => (req, res, next) => {
  const resourceId = req.params[idField];
  
  if (req.user.id !== resourceId) {
    return res.status(403).json({ message: 'Unauthorized access to this resource' });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireArtist,
  requireOwnership
}; 