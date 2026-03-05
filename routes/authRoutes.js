// 🔐 Auth Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT, isAdmin } = require('../middleware/auth');

// ✅ Admin Login
router.post('/admin-login', authController.adminLogin);

// ✅ Admin Register
router.post('/admin-register', authController.adminRegister);

// ✅ Refresh Token
router.post('/refresh-token', authController.refreshToken);

// ✅ Get Current Admin (Protected)
router.get('/admin/current', verifyJWT, isAdmin, authController.getCurrentAdmin);

module.exports = router;
