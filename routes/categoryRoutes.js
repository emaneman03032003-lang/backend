const express = require('express');
const router = express.Router();
const { verifyJWT, isAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// ============================================
// CATEGORY ROUTES (Public & Admin)
// ============================================

// IMPORTANT: More specific routes must come BEFORE generic :id routes!

// Public access - specific routes first
router.get('/active', categoryController.getActiveCategories);
router.get('/:id', categoryController.getCategoryById);

// All categories (public, includes inactive for admin visibility)
router.get('/', categoryController.getAllCategories);

// Admin-only category operations
router.post('/', verifyJWT, isAdmin, categoryController.addCategory);
router.put('/:id', verifyJWT, isAdmin, categoryController.updateCategory);
router.delete('/:id', verifyJWT, isAdmin, categoryController.deleteCategory);

// ============================================
// SUBCATEGORY ROUTES (Admin only)
// ============================================

// Add subcategory to category
router.post('/:categoryId/subcategories', verifyJWT, isAdmin, categoryController.addSubcategory);

// Update subcategory
router.put('/:categoryId/subcategories/:subcategoryId', verifyJWT, isAdmin, categoryController.updateSubcategory);

// Delete subcategory
router.delete('/:categoryId/subcategories/:subcategoryId', verifyJWT, isAdmin, categoryController.deleteSubcategory);

module.exports = router;
