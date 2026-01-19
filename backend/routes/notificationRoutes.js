const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notifications - Get user notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly = 'false', limit = 50 } = req.query;

    let sql = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    
    if (unreadOnly === 'true') {
      sql += ' AND is_read = 0';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?';

    const [notifications] = await db.query(sql, [userId, parseInt(limit)]);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Verify notification belongs to user
    const [notifications] = await db.query(
      'SELECT user_id FROM notifications WHERE id = ?',
      [notificationId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notifications[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update notification
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notificationId]
    );

    // Get updated notification
    const [updated] = await db.query('SELECT * FROM notifications WHERE id = ?', [notificationId]);

    res.json({
      success: true,
      notification: updated[0]
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification', details: error.message });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count/total', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count', details: error.message });
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.userId;

    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read', details: error.message });
  }
});

module.exports = router;
