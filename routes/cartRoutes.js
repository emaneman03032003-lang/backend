// 🛒 Cart Routes
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

// ✓ Get cart
router.get('/:userId', cartController.getCart);

// ✓ Add to cart
router.post('/add', optionalAuth, cartController.addToCart);

// ✓ Remove from cart
router.post('/remove', optionalAuth, cartController.removeFromCart);

// ✓ Update cart item
router.post('/update', optionalAuth, cartController.updateCartItem);

// ✓ Clear cart
router.post('/clear/:userId', cartController.clearCart);

module.exports = router;
