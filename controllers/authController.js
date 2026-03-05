/**
 * Authentication Controller
 * 
 * Handles admin authentication and authorization:
 * - Admin login with email and password
 * - Initial admin registration (setup)
 * - JWT token generation and refresh
 * - Password hashing with bcryptjs
 * - Session management with refresh tokens
 * 
 * Security:
 * - Passwords hashed with bcryptjs (salt rounds: 10)
 * - JWT expires in 1 hour, refresh tokens in 30 days
 * - Secure error messages (no password disclosure)
 * - Admin only access (role-based)
 */

// Authentication Controller (MongoDB + Mongoose)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ uid: admin._id, email: admin.email, role: 'admin', isAdmin: true }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    const refreshToken = jwt.sign({ uid: admin._id }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    // update lastLogin on Admin collection
    admin.lastLogin = new Date();
    await admin.save();

    res.json({ success: true, token, refreshToken, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Admin Register (initial setup)
exports.adminRegister = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name required' });

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ error: 'Admin already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await Admin.create({ email: email.toLowerCase().trim(), passwordHash, name });

    res.status(201).json({ success: true, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (error) {
    console.error('Admin register error:', error);
    res.status(500).json({ error: 'Admin registration failed' });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const admin = await Admin.findById(decoded.uid);
    if (!admin) return res.status(401).json({ error: 'Admin not found' });

    const token = jwt.sign({ uid: admin._id, email: admin.email, role: 'admin', isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Get Current Admin
exports.getCurrentAdmin = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) return res.status(401).json({ error: 'Unauthorized' });
    const admin = await Admin.findById(req.user.uid).select('-passwordHash');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({ success: true, admin });
  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
};
