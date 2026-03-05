// 📦 Order Routes
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyJWT, isAdmin, optionalAuth } = require('../middleware/auth');
const { validateOrder, handleValidationErrors } = require('../middleware/validation');

// ADMIN ROUTES (place before dynamic routes)
// ✓ Get all orders (admin only)
router.get('/admin/all', verifyJWT, isAdmin, orderController.getAllOrders);

// Public/Optional routes
// ✓ Create order (no auth required)
router.post('/', optionalAuth, validateOrder, handleValidationErrors, orderController.createOrder);

// ✓ Get order by ID (no auth required)
router.get('/:id', orderController.getOrderById);

// ✓ Get user orders (optional auth)
router.get('/user/:userId', orderController.getUserOrders);

// ADMIN ROUTES (must be after specific routes)
// ✓ Update order status (admin only)
router.put('/:id/status', verifyJWT, isAdmin, orderController.updateOrderStatus);

// ✓ Delete order (admin only)
router.delete('/:id', verifyJWT, isAdmin, orderController.deleteOrder);

module.exports = router;
