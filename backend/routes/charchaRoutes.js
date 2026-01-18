const express = require('express');
const router = express.Router();
const CharchaModel = require('../models/charchaModel');
const MembershipModel = require('../models/membershipModel');
const PermissionValidator = require('../utils/permissionValidator');

// Validation middleware
const validateCharchaInput = (req, res, next) => {
  const { title, description, category, visibility } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) errors.push('Title is required');
  if (title && title.length > 100) errors.push('Title must be 100 characters or less');
  if (!description || description.trim().length === 0) errors.push('Description is required');
  if (description && description.length > 500) errors.push('Description must be 500 characters or less');
  if (!category) errors.push('Category is required');
  
  const validCategories = ['Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'];
  if (category && !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }
  
  if (visibility && !['public', 'private'].includes(visibility)) {
    errors.push('Visibility must be either "public" or "private"');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

// POST /api/charchas - Create new Charcha
router.post('/', validateCharchaInput, async (req, res) => {
  try {
    const { title, description, category, visibility = 'public' } = req.body;
    const userId = req.user.userId;

    // Create Charcha
    const charcha = await CharchaModel.create({
      title,
      description,
      category,
      visibility,
      owner_id: userId
    });

    // Add creator as owner member
    await MembershipModel.addMember(charcha.id, userId, 'OWNER');

    res.status(201).json({
      success: true,
      charcha: {
        id: charcha.id,
        title: charcha.title,
        description: charcha.description,
        category: charcha.category,
        visibility: charcha.visibility,
        owner_id: userId,
        created_at: charcha.created_at
      }
    });
  } catch (error) {
    console.error('Create Charcha error:', error);
    res.status(500).json({ error: 'Failed to create Charcha', details: error.message });
  }
});

// GET /api/charchas/:id - Get Charcha by ID
router.get('/:id', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;

    const charcha = await CharchaModel.getById(charchaId);
    
    if (!charcha) {
      return res.status(404).json({ error: 'Charcha not found' });
    }

    // Check access permissions
    const canView = await PermissionValidator.canViewCharcha(userId, charchaId);
    
    if (!canView) {
      return res.status(403).json({ error: 'Access denied. This is a private Charcha.' });
    }

    // Get user's role in this Charcha
    const userRole = await MembershipModel.getMemberRole(userId, charchaId);

    res.json({
      success: true,
      charcha: {
        ...charcha,
        user_role: userRole
      }
    });
  } catch (error) {
    console.error('Get Charcha error:', error);
    res.status(500).json({ error: 'Failed to fetch Charcha', details: error.message });
  }
});

// GET /api/charchas/my - Get user's Charchas
router.get('/my/list', async (req, res) => {
  try {
    const userId = req.user.userId;
    const charchas = await CharchaModel.getUserCharchas(userId);

    res.json({
      success: true,
      charchas
    });
  } catch (error) {
    console.error('Get user Charchas error:', error);
    res.status(500).json({ error: 'Failed to fetch Charchas', details: error.message });
  }
});

// GET /api/charchas/browse - Browse public Charchas
router.get('/browse/public', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (search) filters.search = search;

    const charchas = await CharchaModel.browsePublic(filters);

    res.json({
      success: true,
      charchas
    });
  } catch (error) {
    console.error('Browse Charchas error:', error);
    res.status(500).json({ error: 'Failed to browse Charchas', details: error.message });
  }
});

// DELETE /api/charchas/:id - Delete Charcha (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const charchaId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Check if user is owner
    const isOwner = await PermissionValidator.isOwner(userId, charchaId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the owner can delete this Charcha' });
    }

    await CharchaModel.delete(charchaId);

    res.status(204).send();
  } catch (error) {
    console.error('Delete Charcha error:', error);
    res.status(500).json({ error: 'Failed to delete Charcha', details: error.message });
  }
});

module.exports = router;
