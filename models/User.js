/**
 * User Schema
 * 
 * Stores customer user information
 * 
 * Fields:
 * - email: Unique, indexed, lowercase, trimmed
 * - passwordHash: Bcryptjs hashed password (never stored plain)
 * - name: User's full name
 * - role: 'user' or 'admin' (default: 'user')
 * - createdAt: Account creation timestamp
 * - lastLogin: Last login timestamp (for analytics)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
