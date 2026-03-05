const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String },
  recipientId: { type: String, required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'video', 'audio', 'file', 'sticker'], default: 'text' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDelivered: { type: Boolean, default: true },
  deliveredAt: { type: Date, default: Date.now },
  attachments: { type: [String], default: [] },
  repliedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  replyText: { type: String }, // Original message text being replied to
  editedAt: { type: Date },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  emoji: { type: String }, // Emoji reaction
  mediaUrl: { type: String }, // URL for media files
  mediaType: { type: String }, // image, video, audio, document
  duration: { type: Number }, // For audio/video files
  fileName: { type: String }, // For attachments
  fileSize: { type: Number }, // For attachments
  location: {
    latitude: Number,
    longitude: Number,
    name: String
  },
  timestamp: { type: Date, default: Date.now }
});

// Index for faster queries
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
