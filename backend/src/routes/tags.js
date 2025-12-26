const express = require('express');
const { body, validationResult } = require('express-validator');
const Tag = require('../models/Tag');
const Paper = require('../models/Paper');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

// Get all tags
router.get('/', authenticate, async (req, res) => {
  try {
    const tags = await Tag.find().sort({ displayName: 1 });
    res.json({ tags });
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Get single tag
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ tag });
  } catch (err) {
    console.error('Get tag error:', err);
    res.status(500).json({ message: 'Failed to fetch tag' });
  }
});

// Create tag (SUPER_ADMIN only)
router.post('/', authenticate, requireSuperAdmin, [
  body('name').trim().notEmpty().withMessage('Tag name is required'),
  body('displayName').optional().trim(),
  body('description').optional().trim(),
  body('color').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, displayName, description, color } = req.body;
    const normalizedName = name.trim().toLowerCase();

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: normalizedName });
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const tag = await Tag.create({
      name: normalizedName,
      displayName: displayName || name.trim(),
      description: description || '',
      color: color || '#3b82f6'
    });

    res.status(201).json({ tag });
  } catch (err) {
    console.error('Create tag error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    res.status(500).json({ message: 'Failed to create tag' });
  }
});

// Update tag (SUPER_ADMIN only)
router.patch('/:id', authenticate, requireSuperAdmin, [
  body('displayName').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('color').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ tag });
  } catch (err) {
    console.error('Update tag error:', err);
    res.status(500).json({ message: 'Failed to update tag' });
  }
});

// Delete tag (SUPER_ADMIN only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Check if tag is used in any papers (using tag.name, not displayName)
    const papersWithTag = await Paper.find({ tags: tag.name }).select('title _id').lean();
    if (papersWithTag.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete tag. It is used in ${papersWithTag.length} paper(s). Please remove it from all papers first.`,
        papersUsingTag: papersWithTag.map(p => ({ _id: p._id, title: p.title }))
      });
    }

    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tag deleted successfully' });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ message: 'Failed to delete tag' });
  }
});

module.exports = router;

