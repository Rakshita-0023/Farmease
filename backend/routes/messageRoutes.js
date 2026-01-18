const express = require('express');
const router = express.Router();
const db = require('../db-sqlite');
const MentionParser = require('../utils/mentionParser');
const PermissionValidator = require('../utils/permissionValidator');

// Sanitize HTML to prevent XSS
const sanitizeHTML = (text) => {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
};

// POST /api/charchas/:id/messages - Post a message
router.post('/:id/messages', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;
    let { content } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message must be 2000 characters or less' });
    }

    // Check if user is a member
    const canPost = await PermissionValidator.canPostMessages(userId, charchaId);
    if (!canPost) {
      return res.status(403).json({ error: 'You must be a member to post messages' });
    }

    // Sanitize content
    content = sanitizeHTML(content);

    // Parse and validate mentions
    const { validUserIds } = await MentionParser.parseAndValidate(content, charchaId, userId);

    // Create message
    const [result] = await db.execute(
      'INSERT INTO messages (charcha_id, user_id, content) VALUES (?, ?, ?)',
      [charchaId, userId, content]
    );

    const messageId = result.insertId;

    // Create mention records
    if (validUserIds.length > 0) {
      await MentionParser.createMentions(messageId, validUserIds);

      // Create notifications for mentioned users
      const [user] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
      const [charcha] = await db.query('SELECT title FROM charchas WHERE id = ?', [charchaId]);

      for (const mentionedUserId of validUserIds) {
        await db.execute(
          'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
          [mentionedUserId, 'MENTION', messageId, `${user[0].name} mentioned you in "${charcha[0].title}"`]
        );
      }
    }

    // Get created message with user info
    const [messages] = await db.query(
      `SELECT m.*, u.name as user_name 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.id = ?`,
      [messageId]
    );

    res.status(201).json({
      success: true,
      message: messages[0]
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ error: 'Failed to post message', details: error.message });
  }
});

// GET /api/charchas/:id/messages - Get messages for a Charcha
router.get('/:id/messages', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Check if user can view
    const canView = await PermissionValidator.canViewCharcha(userId, charchaId);
    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const [messages] = await db.query(
      `SELECT m.*, u.name as user_name 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.charcha_id = ? 
       ORDER BY m.created_at ASC 
       LIMIT ? OFFSET ?`,
      [charchaId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// DELETE /api/messages/:id - Delete a message
router.delete('/:id', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Get message to find charcha_id
    const [messages] = await db.query('SELECT charcha_id FROM messages WHERE id = ?', [messageId]);
    
    if (messages.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const charchaId = messages[0].charcha_id;

    // Check if user can delete messages
    const canDelete = await PermissionValidator.canDeleteMessages(userId, charchaId);
    if (!canDelete) {
      return res.status(403).json({ error: 'Only owners and moderators can delete messages' });
    }

    // Delete message (mentions will cascade)
    await db.execute('DELETE FROM messages WHERE id = ?', [messageId]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message', details: error.message });
  }
});

module.exports = router;
