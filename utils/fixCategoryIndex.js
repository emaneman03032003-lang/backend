// Clean up Categories collection index issue
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function fixCategoryIndex() {
  // NOTE: This utility used to drop the categories collection which caused data loss
  // when executed unintentionally. To protect production/dev data we no longer
  // drop collections by default. To allow destructive behaviour set environment
  // variable `FIX_CATEGORY_INDEX_FORCE=true` and call this function explicitly.

  if (process.env.FIX_CATEGORY_INDEX_FORCE === 'true') {
    try {
      // Drop the categories collection to remove old indexes
      await mongoose.connection.db.dropCollection('categories');
      console.log('✓ Dropped categories collection (forced)');

      // Attempt to drop model collection as well
      try {
        await Category.collection.drop();
        console.log('✓ Dropped Category model collection (forced)');
      } catch (innerErr) {
        if (innerErr.message && innerErr.message.includes('ns not found')) {
          console.log('✓ No Category model collection to drop');
        } else {
          console.error('Error dropping Category model collection:', innerErr.message);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('ns not found')) {
        console.log('✓ No existing categories collection (fresh start)');
      } else {
        console.error('Error dropping collection:', err.message);
      }
    }
  } else {
    console.log('⚠️ fixCategoryIndex called but not forced. Skipping destructive drops.');
  }

  // Ensure indexes exist (non-destructive)
  try {
    await Category.collection.createIndex({ name: 1 }, { unique: true });
    await Category.collection.createIndex({ slug: 1 }, { unique: true, sparse: true });
    console.log('✓ Ensured proper indexes for categories');
  } catch (err) {
    console.error('Error ensuring indexes:', err.message);
  }
}

module.exports = fixCategoryIndex;
