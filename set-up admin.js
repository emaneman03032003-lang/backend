/**
 * Setup Admin Account
 * Run this once to create the first admin account
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Admin = require('./models/Admin');
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function setupAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gnsons.com' });
    if (existingAdmin) {
      console.log('⚠️ Admin account already exists');
      console.log('Email: admin@gnsons.com');
      console.log('Password: admin123');
      mongoose.connection.close();
      return;
    }

    // Create admin account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      email: 'admin@gnsons.com',
      name: 'Admin User',
      passwordHash: hashedPassword,
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('---');
    console.log('Email: admin@gnsons.com');
    console.log('Password: admin123');
    console.log('---');
    console.log('Login at: http://localhost:3000/admin/login');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

setupAdmin();
