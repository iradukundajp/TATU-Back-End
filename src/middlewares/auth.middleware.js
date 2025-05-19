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
  console.log('User data in requireArtist middleware:', req.user);
  
  if (!req.user) {
    return res.status(403).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isArtist) {
    return res.status(403).json({ 
      message: 'Artist access required',
      user: req.user.id,
      isArtist: req.user.isArtist
    });
  }
  
  next();
};

/**
 * Middleware to conditionally apply artist requirement
 * For routes that need to work for both artists and regular users
 * But may have different behavior depending on the role
 */
const checkArtistRole = (req, res, next) => {
  // This middleware doesn't block access, it just adds a helpful flag
  req.isArtistRequest = !!(req.user && req.user.isArtist);
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
  checkArtistRole,
  requireOwnership
}; 