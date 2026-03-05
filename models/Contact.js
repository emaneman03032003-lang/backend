const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  subject: { type: String },
  message: { type: String },
  status: { type: String, enum: ['unread','read'], default: 'unread' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Contact', contactSchema);
