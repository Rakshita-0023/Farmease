const express = require('express');
const router = express.Router();
const MembershipModel = require('../models/membershipModel');
const CharchaModel = require('../models/charchaModel');
const PermissionValidator = require('../utils/permissionValidator');
const db = require('../db-sqlite');

// GET /api/charchas/:id/members - Get all members of a Charcha
router.get('/:id/members', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Check if user can view this Charcha
    const canView = await PermissionValidator.canViewCharcha(userId, charchaId);
    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all members
    const members = await MembershipModel.getMembers(charchaId);

    res.json({ success: true, members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members', details: error.message });
  }
});

// POST /api/charchas/:id/join - Join a Charcha
router.post('/:id/join', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Check if already a member
    const isMember = await MembershipModel.isMember(userId, charchaId);
    if (isMember) {
      return res.status(400).json({ error: 'You are already a member of this Charcha' });
    }

    // Check if already has pending request
    const hasPending = await MembershipModel.hasPendingRequest(userId, charchaId);
    if (hasPending) {
      return res.status(400).json({ error: 'You already have a pending join request' });
    }

    // Get Charcha visibility
    const visibility = await CharchaModel.getVisibility(charchaId);
    
    if (visibility === 'public') {
      // Public: Add member directly
      await MembershipModel.addMember(charchaId, userId, 'MEMBER');
      return res.json({ success: true, message: 'Joined Charcha successfully', status: 'joined' });
    } else {
      // Private: Create join request
      const request = await MembershipModel.createJoinRequest(charchaId, userId);
      
      // Create notification for owner
      const charcha = await CharchaModel.getById(charchaId);
      const [user] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
      
      await db.execute(
        'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
        [charcha.owner_id, 'JOIN_REQUEST', request.id, `${user[0].name} requested to join your Charcha "${charcha.title}"`]
      );
      
      return res.json({ success: true, message: 'Join request sent', status: 'pending', requestId: request.id });
    }
  } catch (error) {
    console.error('Join Charcha error:', error);
    res.status(500).json({ error: 'Failed to join Charcha', details: error.message });
  }
});

// GET /api/join-requests/pending - Get pending requests for owner
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await MembershipModel.getPendingRequestsForOwner(userId);

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests', details: error.message });
  }
});

// POST /api/join-requests/:id/approve - Approve join request
router.post('/:id/approve', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const userId = req.user.userId;

    const request = await MembershipModel.getJoinRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // Check if user is owner
    const isOwner = await PermissionValidator.isOwner(userId, request.charcha_id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the owner can approve join requests' });
    }

    // Update request status
    await MembershipModel.updateRequestStatus(requestId, 'APPROVED');
    
    // Add user as member
    await MembershipModel.addMember(request.charcha_id, request.user_id, 'MEMBER');
    
    // Mark the JOIN_REQUEST notification as read for the owner
    console.log(`Marking JOIN_REQUEST notification as read for request ${requestId}`);
    const [updateResult] = await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE type = ? AND related_id = ?',
      ['JOIN_REQUEST', requestId]
    );
    console.log(`Updated ${updateResult.affectedRows} notification(s)`);
    
    // Create notification for requester
    await db.execute(
      'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
      [request.user_id, 'JOIN_APPROVED', request.charcha_id, `Your request to join "${request.charcha_title}" was approved`]
    );

    res.json({ success: true, message: 'Join request approved' });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve request', details: error.message });
  }
});

// POST /api/join-requests/:id/reject - Reject join request
router.post('/:id/reject', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const userId = req.user.userId;

    const request = await MembershipModel.getJoinRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // Check if user is owner
    const isOwner = await PermissionValidator.isOwner(userId, request.charcha_id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the owner can reject join requests' });
    }

    // Update request status
    await MembershipModel.updateRequestStatus(requestId, 'REJECTED');
    
    // Mark the JOIN_REQUEST notification as read for the owner
    console.log(`Marking JOIN_REQUEST notification as read for request ${requestId}`);
    const [updateResult] = await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE type = ? AND related_id = ?',
      ['JOIN_REQUEST', requestId]
    );
    console.log(`Updated ${updateResult.affectedRows} notification(s)`);
    
    // Create notification for requester
    await db.execute(
      'INSERT INTO notifications (user_id, type, related_id, message) VALUES (?, ?, ?, ?)',
      [request.user_id, 'JOIN_REJECTED', request.charcha_id, `Your request to join "${request.charcha_title}" was rejected`]
    );

    res.json({ success: true, message: 'Join request rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject request', details: error.message });
  }
});

// POST /api/charchas/:id/moderators - Assign moderator
router.post('/:id/moderators', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Check if user is owner
    const isOwner = await PermissionValidator.isOwner(userId, charchaId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the owner can assign moderators' });
    }

    // Check if target is a member
    const isMember = await MembershipModel.isMember(targetUserId, charchaId);
    if (!isMember) {
      return res.status(404).json({ error: 'User is not a member of this Charcha' });
    }

    // Update role to moderator
    await MembershipModel.updateMemberRole(charchaId, targetUserId, 'MODERATOR');

    res.json({ success: true, message: 'Moderator assigned successfully' });
  } catch (error) {
    console.error('Assign moderator error:', error);
    res.status(500).json({ error: 'Failed to assign moderator', details: error.message });
  }
});

// DELETE /api/charchas/:id/moderators/:userId - Remove moderator
router.delete('/:id/moderators/:targetUserId', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;
    const targetUserId = parseInt(req.params.targetUserId);

    // Check if user is owner
    const isOwner = await PermissionValidator.isOwner(userId, charchaId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the owner can remove moderators' });
    }

    // Update role back to member
    await MembershipModel.updateMemberRole(charchaId, targetUserId, 'MEMBER');

    res.json({ success: true, message: 'Moderator removed successfully' });
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({ error: 'Failed to remove moderator', details: error.message });
  }
});

module.exports = router;
