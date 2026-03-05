// Authentication Middleware (JWT + role checks)
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT Token
const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// isAdmin middleware - ensure JWT user is admin and exists
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) return res.status(403).json({ error: 'User not authenticated' });
    const admin = await Admin.findById(req.user.uid);
    if (!admin) return res.status(403).json({ error: 'Admin access required' });
    req.admin = admin;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

// Optional auth - attach user if token exists
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  verifyJWT,
  isAdmin,
  optionalAuth
};
