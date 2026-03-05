/**
 * Product Controller
 * 
 * Handles all product operations:
 * - Fetch all products with advanced filtering (category, price, search)
 * - Get single product details
 * - Get product categories
 * - Add new product (admin only)
 * - Update existing product (admin only)
 * - Delete product (admin only)
 * 
 * Database: MongoDB with Mongoose
 * Authentication: JWT (admin operations only)
 * File Upload: Image support via multer
 */

// Product Controller
// Get, Add, Edit, Delete products
// Search, Filter, Categories

const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Categories are now managed dynamically from the Category model

// Collection names
const COLLECTIONS = {
  PRODUCTS: 'products',
  USERS: 'users',
  ORDERS: 'orders',
  CARTS: 'carts',
  REVIEWS: 'reviews',
  MESSAGES: 'messages'
};




// Get All Products with Filters
exports.getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, featured, newArrival, used } = req.query;

    console.log('\ud83d\udd35 [Backend] GET /products called with filters:', { category, minPrice, maxPrice, search, featured, newArrival, used });

    // Fetch products from MongoDB
    let products = await Product.find().lean();
    console.log('\ud83d\udfe2 [Backend] Found', products.length, 'products in database');

    // Category filter
    if (category && category !== 'all') {
      products = products.filter(p => p.category && p.category.toLowerCase() === String(category).toLowerCase());
      console.log('\ud83d\udfe2 [Backend] After category filter:', products.length, 'products');
    }

    // Featured products
    if (featured === 'true') {
      products = products.filter(p => p.isFeatured === true);
      console.log('\ud83d\udfe2 [Backend] After featured filter:', products.length, 'products');
    }

    // New arrival
    if (newArrival === 'true') {
      products = products.filter(p => p.isNewArrival === true);
      console.log('\ud83d\udfe2 [Backend] After newArrival filter:', products.length, 'products');
    }

    // Used products
    if (used === 'true') {
      products = products.filter(p => p.isUsed === true);
      console.log('\ud83d\udfe2 [Backend] After used filter:', products.length, 'products');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      products = products.filter(p => {
        const price = parseFloat(p.price);
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
      console.log('\ud83d\udfe2 [Backend] After price filter:', products.length, 'products');
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
      console.log('\ud83d\udfe2 [Backend] After search filter:', products.length, 'products');
    }

    // Ensure each product has an id field for frontend compatibility
    products = products.map(p => ({
      ...p,
      id: p.id || p._id.toString()
    }));

    console.log('\u2705 [Backend] Returning', products.length, 'products');
    return res.json({ success: true, count: products.length, products, source: 'mongodb' });
  } catch (error) {
    console.error('\ud83d\udd34 [Backend] GET /products error:', error.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products', 
      message: error.message 
    });
  }
};

// ✓ Get Single Product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try MongoDB - first with _id, then with id field
    let product = await Product.findById(id).lean();
    
    // If not found by _id, try finding by id field
    if (!product) {
      product = await Product.findOne({ id: id }).lean();
    }
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // Ensure product has both _id and id for frontend compatibility
    if (!product.id && product._id) {
      product.id = product._id.toString();
    }
    
    res.json({ success: true, product, source: 'mongodb' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product', message: error.message });
  }
};

// ✓ Get Products by Category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // verify category exists and is active
    const Category = require('../models/Category');
    const catDoc = await Category.findOne({ name: category });
    if (!catDoc || catDoc.status !== 'active') {
      // return empty list so frontend will show no products or 404
      return res.status(404).json({ success: false, error: 'Category not found or inactive', category });
    }

    const products = await Product.find({ category }).lean();
    
    // Ensure each product has an id field for frontend compatibility
    const productsWithId = products.map(p => ({
      ...p,
      id: p.id || p._id.toString()
    }));
    
    res.json({ success: true, category, count: productsWithId.length, products: productsWithId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category products' });
  }
};

// Add New Product (Admin Only)
exports.addProduct = async (req, res) => {
  try {
    console.log('\ud83d\udd35 [Backend] POST /products called with data:', req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.price || !req.body.category) {
      console.warn('\ud83d\udfe1 [Backend] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'price', 'category']
      });
    }

    // Prepare product data with proper types
    const productData = {
      name: String(req.body.name),
      category: String(req.body.category),
      subcategory: String(req.body.subcategory || ''),
      price: parseFloat(req.body.price),
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : parseFloat(req.body.price),
      description: String(req.body.description || ''),
      shortDescription: String(req.body.shortDescription || ''),
      stock: parseInt(req.body.stock) || 0,
      images: Array.isArray(req.body.images) ? req.body.images : [],
      isFeatured: Boolean(req.body.isFeatured) || false,
      isNewArrival: Boolean(req.body.isNewArrival) || false,
      isUsed: Boolean(req.body.isUsed) || false,
      isFood: Boolean(req.body.isFood) || false,
      rating: parseFloat(req.body.rating) || 0,
      reviews: parseInt(req.body.reviews) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('\ud83d\udfe2 [Backend] Product data prepared:', productData);
    
    const created = await Product.create(productData);
    console.log('\u2705 [Backend] Product created successfully:', created);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Product added successfully', 
      productId: created._id, 
      product: created 
    });
  } catch (error) {
    console.error('\ud83d\udd34 [Backend] Product add error:', error.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to add product', 
      message: error.message
    });
  }
};

// ✓ Update Product (Admin Only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Add update timestamp
    updateData.updatedAt = new Date();

    // Convert numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true }).lean();
    res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', message: error.message });
  }
};

// ✓ Delete Product (Admin Only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Get product data first to handle images
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Delete local images
    if (product.images && Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        try {
          const fileName = imageUrl.split('/uploads/')[1];
          if (fileName) {
            const filePath = path.join(UPLOAD_DIR, fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.log('Could not delete image file:', err.message);
        }
      }
    }

    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', message: error.message });
  }
};

// ✓ Get Categories (used by frontend filters / admin dropdown)
// This endpoint now reads from the Category collection and returns active
// categories only to avoid showing deleted/inactive values baked into
// individual product entries.
exports.getCategories = async (req, res) => {
  try {
    // Lazy require to avoid circular dependency if any
    const Category = require('../models/Category');
    const categories = await Category.find({ status: 'active' }).select('name -_id').lean();
    const names = categories.map(c => c.name).sort();
    res.json({ success: true, categories: names });
  } catch (error) {
    console.error('❌ getCategories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
