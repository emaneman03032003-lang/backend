/**
 * GN SONS Backend Server
 * 
 * Production-ready REST API for luxury e-commerce platform
 * 
 * Database: MongoDB Atlas with Mongoose ODM
 * Authentication: JWT (jsonwebtoken) with bcryptjs password hashing
 * Rate Limiting: 100 requests per 15 minutes
 * CORS: Configured for frontend and admin panel development
 * 
 * API Routes:
 * - POST   /api/auth/admin-login - Admin authentication
 * - POST   /api/auth/admin-register - Admin registration (setup only)
 * - POST   /api/auth/refresh-token - Token refresh
 * - GET    /api/products - List all products with filters
 * - POST   /api/products - Add new product (admin only)
 * - PUT    /api/products/:id - Update product (admin only)
 * - DELETE /api/products/:id - Delete product (admin only)
 * - GET    /api/orders - List all orders
 * - POST   /api/cart/* - Cart operations
 * - POST   /api/chat/* - Messaging system
 * - POST   /api/contact - Contact form submissions
 */

// 🔥 GN SONS - Backend Server
// Production-ready luxury e-commerce backend
// All data flows through APIs only - Secure architecture

// Suppress punycode deprecation warning (known Node.js issue)
process.removeAllListeners('warning');

// DNS Configuration for MongoDB connectivity (optimized for reliability)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/mongodb');

// Load environment variables
dotenv.config();

const app = express();
const path = require('path');

// Import routes
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const contactRoutes = require('./routes/contactRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const fixCategoryIndex = require('./utils/fixCategoryIndex');
const seedCategories = require('./utils/seedCategories');

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security Headers - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https:']
    }
  },
  frameguard: {
    action: 'deny'  // Prevent clickjacking
  },
  noSniff: true,   // Prevent MIME type sniffing
  xssFilter: true  // Enable XSS protection
}));

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow frontend and admin panel
const corsOptions = {
  // origin: [
  //   'http://localhost:3000',  // Frontend
  //   'http://localhost:3001',  // Admin Panel
  //   'http://localhost:3002',  // Admin Panel (alternate)
  //   'http://localhost:3003',  // Frontend (alternate)
  //   'http://localhost:3004',  // Admin Panel (current)
  //   'http://localhost:5173',  // Vite dev server frontend
  //   'http://localhost:5174'   // Vite dev server admin
  // ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔄 Cache Control for API endpoints - Prevent browser caching
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Rate Limiting - Security
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false   // Disable `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// ============================================
// ROUTES
// ============================================

// Public Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
// Category endpoints
app.use('/api/categories', categoryRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'GN SONS Backend Running ✓',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  
  // Validation errors
  if (err.array) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: err.array() 
    });
  }

  // Firebase errors
  if (err.code && err.code.includes('auth/')) {
    return res.status(401).json({ error: 'Authentication failed', message: err.message });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Server error',
    timestamp: new Date()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5001;

// Connect to MongoDB then start server
connectDB().then(async () => {

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Server error handling
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

// Unhandled exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

