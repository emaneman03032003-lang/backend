// Chat Controller (MongoDB) - WhatsApp-like features
const Message = require('../models/Message');

// Send Message with reply support
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderName, message, recipientId, attachments, repliedToId, messageType, mediaUrl, location } = req.body;
    if (!senderId || !message || !recipientId) return res.status(400).json({ error: 'Missing required fields' });

    const convId = conversationId || `${senderId}-${recipientId}`;

    const msgData = {
      conversationId: convId,
      senderId,
      senderName: senderName || 'Customer',
      recipientId,
      message,
      messageType: messageType || 'text',
      attachments: attachments || [],
      mediaUrl: mediaUrl || null,
      isDelivered: true,
      deliveredAt: new Date()
    };

    // Add reply reference if replying to a message
    if (repliedToId) {
      const repliedMsg = await Message.findById(repliedToId);
      if (repliedMsg) {
        msgData.repliedTo = repliedToId;
        msgData.replyText = repliedMsg.message;
      }
    }

    // Add location if provided
    if (location) {
      msgData.location = location;
    }

    const msg = await Message.create(msgData);

    res.status(201).json({ success: true, message: 'Message sent successfully', messageId: msg._id, data: msg });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
};

// Get Conversation with all messages
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId, isDeleted: false })
      .populate('repliedTo', 'message senderName')
      .sort({ timestamp: 1 })
      .lean();
    
    res.json({ success: true, conversationId, messageCount: messages.length, messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation', message: error.message });
  }
};

// Get All Conversations (Admin)
exports.getAllConversations = async (req, res) => {
  try {
    const docs = await Message.find({ isDeleted: false })
      .sort({ timestamp: -1 })
      .lean();
    
    const convMap = new Map();
    for (const d of docs) {
      const conv = convMap.get(d.conversationId) || {
        conversationId: d.conversationId,
        customerId: d.senderId === 'admin' ? d.recipientId : d.senderId,
        customerName: d.senderName,
        lastMessage: d.message,
        lastMessageTime: d.timestamp,
        unreadCount: 0,
        messages: [],
        isPinned: false
      };
      
      conv.messages.push(d);
      if (!d.isRead && d.recipientId === 'admin') conv.unreadCount++;
      convMap.set(d.conversationId, conv);
    }
    
    const conversations = Array.from(convMap.values())
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.lastMessageTime - a.lastMessageTime);
    
    res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations', message: error.message });
  }
};

// Mark as Read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.findByIdAndUpdate(messageId, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read', message: error.message });
  }
};

// Mark conversation as read
exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversationId, isRead: false, recipientId: 'admin' },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'Conversation marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark conversation as read', message: error.message });
  }
};

// Delete Message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.findByIdAndUpdate(messageId, { isDeleted: true, deletedAt: new Date() });
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message', message: error.message });
  }
};

// Edit Message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    
    if (!message) return res.status(400).json({ error: 'Message text is required' });
    
    await Message.findByIdAndUpdate(
      messageId,
      { message, isEdited: true, editedAt: new Date() }
    );
    res.json({ success: true, message: 'Message edited successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit message', message: error.message });
  }
};

// Pin/Unpin Message
exports.togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    
    await Message.findByIdAndUpdate(
      messageId,
      { isPinned: !message.isPinned, pinnedAt: new Date() }
    );
    
    res.json({ success: true, message: message.isPinned ? 'Message unpinned' : 'Message pinned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pin', message: error.message });
  }
};

// Get pinned messages in conversation
exports.getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const pinnedMessages = await Message.find({ conversationId, isPinned: true, isDeleted: false })
      .sort({ pinnedAt: -1 })
      .lean();
    
    res.json({ success: true, count: pinnedMessages.length, pinnedMessages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pinned messages', message: error.message });
  }
};

// Add emoji reaction
exports.addEmojiReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) return res.status(400).json({ error: 'Emoji is required' });
    
    await Message.findByIdAndUpdate(messageId, { emoji });
    res.json({ success: true, message: 'Emoji added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add emoji', message: error.message });
  }
};

// Pin/Unpin Conversation
exports.togglePinConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // This would need a Conversation model - for now update a flag in latest message
    res.json({ success: true, message: 'Conversation toggle pin' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pin', message: error.message });
  }
};

// Archive Conversation
exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // Mark all messages as archived
    await Message.updateMany(
      { conversationId },
      { isArchived: true, archivedAt: new Date() }
    );
    res.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive conversation', message: error.message });
  }
};

// Mute Conversation
exports.muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { duration } = req.body; // duration in minutes
    const muteUntil = new Date(Date.now() + (duration || 60) * 60000);
    
    // This would need a Conversation model to store mute settings
    res.json({ success: true, message: 'Conversation muted', muteUntil });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mute conversation', message: error.message });
  }
};

// Clear Chat History
exports.clearChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.deleteMany({ conversationId });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat', message: error.message });
  }
};

// Search Messages
exports.searchMessages = async (req, res) => {
  try {
    const { conversationId, query } = req.query;
    
    if (!query) return res.status(400).json({ error: 'Search query is required' });
    
    const messages = await Message.find({
      conversationId,
      isDeleted: false,
      message: { $regex: query, $options: 'i' }
    }).lean();
    
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search messages', message: error.message });
  }
};
