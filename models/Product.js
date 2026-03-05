/**
 * Product Schema
 * 
 * Stores e-commerce product listings
 * 
 * Fields:
 * - name: Product name (required)
 *
 * - price: Current selling price (required)
 * - originalPrice: Original/marked price (for discount display)
 * - description: Long description
 * - shortDescription: Brief product summary
 * - stock: Available quantity
 * - rating: Average star rating (1-5)
 * - reviews: Total number of customer reviews
 * - isFeatured: Shows in hero section if true
 * - isNewArrival: Shows in new products section if true
 * - isUsed: Product condition flag
 * - images: Array of image URLs for product gallery
 * - createdAt: Product listing date
 * - updatedAt: Last modification timestamp
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Uncategorized' },
  subcategory: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  description: { type: String },
  shortDescription: { type: String },
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isUsed: { type: Boolean, default: false },
  isFood: { type: Boolean, default: false },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
