const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/gnsons';

(async () => {
  try {
    console.log('Connecting to', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const categories = await Category.find().sort({ createdAt: -1 });
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log({ id: cat._id.toString(), name: cat.name, slug: cat.slug, createdAt: cat.createdAt });
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error listing categories:', err.message);
    process.exit(1);
  }
})();
