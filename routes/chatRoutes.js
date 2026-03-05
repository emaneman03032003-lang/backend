// 💬 Chat Routes - WhatsApp-like Features
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyJWT, isAdmin, optionalAuth } = require('../middleware/auth');

// ✓ Send message (with reply & media support)
router.post('/send', optionalAuth, chatController.sendMessage);

// ✓ Get conversation
router.get('/conversation/:conversationId', chatController.getConversation);

// ✓ Search messages
router.get('/search', chatController.searchMessages);

// ADMIN ROUTES
// ✓ Get all conversations
router.get('/admin/conversations', verifyJWT, isAdmin, chatController.getAllConversations);

// ✓ Mark message as read
router.put('/:messageId/read', verifyJWT, isAdmin, chatController.markAsRead);

// ✓ Mark conversation as read
router.put('/conversation/:conversationId/read', verifyJWT, isAdmin, chatController.markConversationAsRead);

// ✓ Delete message (soft delete)
router.delete('/:messageId', verifyJWT, isAdmin, chatController.deleteMessage);

// ✓ Edit message
router.put('/:messageId/edit', verifyJWT, isAdmin, chatController.editMessage);

// ✓ Pin/Unpin message
router.put('/:messageId/pin', verifyJWT, isAdmin, chatController.togglePinMessage);

// ✓ Get pinned messages
router.get('/conversation/:conversationId/pinned', verifyJWT, isAdmin, chatController.getPinnedMessages);

// ✓ Add emoji reaction
router.put('/:messageId/emoji', verifyJWT, isAdmin, chatController.addEmojiReaction);

// ✓ Archive conversation
router.put('/conversation/:conversationId/archive', verifyJWT, isAdmin, chatController.archiveConversation);

// ✓ Mute conversation
router.put('/conversation/:conversationId/mute', verifyJWT, isAdmin, chatController.muteConversation);

// ✓ Clear chat history
router.delete('/conversation/:conversationId/clear', verifyJWT, isAdmin, chatController.clearChatHistory);

module.exports = router;
