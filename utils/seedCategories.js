/**
 * Category Seeding Utility
 * 
 * Seeds default categories to MongoDB on first run
 * Ensures categories persist across server restarts
 * Prevents duplicate seeding using unique name index
 * 
 * Usage:
 * - Called automatically from server.js on startup
 * - Checks if categories exist before seeding
 * - Only adds if database is empty
 */

const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  {
    name: 'Electronics',
    description: 'Smart devices and gadgets',
    status: 'active',
    subcategories: [
      { name: 'Smartphones', description: 'Latest mobile phones' },
      { name: 'Laptops', description: 'Computers and notebooks' },
      { name: 'Accessories', description: 'Cables, chargers, and more' }
    ]
  },
  {
    name: 'Female Fashion',
    description: 'Womens clothing and accessories',
    status: 'active',
    subcategories: [
      { name: 'Dresses', description: 'Casual and formal dresses' },
      { name: 'Tops & Shirts', description: 'Blouses and t-shirts' },
      { name: 'Footwear', description: 'Heels, flats, and sneakers' }
    ]
  },
  {
    name: 'Male Fashion',
    description: 'Mens clothing and accessories',
    status: 'active',
    subcategories: [
      { name: 'Shirts', description: 'Casual and formal wear' },
      { name: 'Pants', description: 'Jeans and trousers' },
      { name: 'Footwear', description: 'Shoes and boots' }
    ]
  },
  {
    name: 'Home Appliances',
    description: 'Kitchen and home utilities',
    status: 'active',
    subcategories: [
      { name: 'Kitchen', description: 'Blenders, mixers, and more' },
      { name: 'Cleaning', description: 'Vacuum and cleaning tools' },
      { name: 'Heating', description: 'Heaters and coolers' }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Cosmetics and skincare',
    status: 'active',
    subcategories: [
      { name: 'Skincare', description: 'Face and body care' },
      { name: 'Makeup', description: 'Foundation, lipstick, and more' },
      { name: 'Hair Care', description: 'Shampoo and conditioner' }
    ]
  }
];

/**
 * Seed default categories to MongoDB
 * Only runs if no categories exist in database
 */
const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log('🟢 Categories already exist, skipping seeding.');
      return;
    }

    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log('✅ Default categories seeded successfully.');
  } catch (err) {
    console.error('❌ Error during category seeding:', err.message);
    if (err.code === 11000) {
      console.log('⚠️  Seed skipped: Duplicate keys detected.');
    }
    throw err;
  }
};

module.exports = seedCategories;
