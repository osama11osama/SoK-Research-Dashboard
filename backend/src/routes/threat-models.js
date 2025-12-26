const express = require('express');
const { body, validationResult } = require('express-validator');
const ThreatModel = require('../models/ThreatModel');
const Paper = require('../models/Paper');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

// Get all threat models
router.get('/', authenticate, async (req, res) => {
  try {
    const threatModels = await ThreatModel.find().sort({ displayName: 1 });
    res.json({ threatModels });
  } catch (err) {
    console.error('Get threat models error:', err);
    res.status(500).json({ message: 'Failed to fetch threat models' });
  }
});

// Get single threat model
router.get('/:id', authenticate, async (req, res) => {
  try {
    const threatModel = await ThreatModel.findById(req.params.id);
    if (!threatModel) {
      return res.status(404).json({ message: 'Threat model not found' });
    }
    res.json({ threatModel });
  } catch (err) {
    console.error('Get threat model error:', err);
    res.status(500).json({ message: 'Failed to fetch threat model' });
  }
});

// Create threat model (SUPER_ADMIN only)
router.post('/', authenticate, requireSuperAdmin, [
  body('name').trim().notEmpty().withMessage('Threat model name is required'),
  body('displayName').optional().trim(),
  body('description').optional().trim(),
  body('category').optional().isIn(['Vulnerability', 'Attack', 'Privacy', 'Security', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, displayName, description, category } = req.body;
    const normalizedName = name.trim().toLowerCase();

    // Check if threat model already exists
    const existingThreatModel = await ThreatModel.findOne({ name: normalizedName });
    if (existingThreatModel) {
      return res.status(400).json({ message: 'Threat model already exists' });
    }

    const threatModel = await ThreatModel.create({
      name: normalizedName,
      displayName: displayName || name.trim(),
      description: description || '',
      category: category || 'Security'
    });

    res.status(201).json({ threatModel });
  } catch (err) {
    console.error('Create threat model error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Threat model already exists' });
    }
    res.status(500).json({ message: 'Failed to create threat model' });
  }
});

// Update threat model (SUPER_ADMIN only)
router.patch('/:id', authenticate, requireSuperAdmin, [
  body('displayName').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('category').optional().isIn(['Vulnerability', 'Attack', 'Privacy', 'Security', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const threatModel = await ThreatModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!threatModel) {
      return res.status(404).json({ message: 'Threat model not found' });
    }

    res.json({ threatModel });
  } catch (err) {
    console.error('Update threat model error:', err);
    res.status(500).json({ message: 'Failed to update threat model' });
  }
});

// Delete threat model (SUPER_ADMIN only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const threatModel = await ThreatModel.findById(req.params.id);
    if (!threatModel) {
      return res.status(404).json({ message: 'Threat model not found' });
    }

    // Check if threat model is used in any papers
    const papersWithThreatModel = await Paper.countDocuments({ 
      'sok.threatModel': threatModel.displayName 
    });
    if (papersWithThreatModel > 0) {
      return res.status(400).json({ 
        message: `Cannot delete threat model. It is used in ${papersWithThreatModel} paper(s). Please remove it from all papers first.` 
      });
    }

    await ThreatModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Threat model deleted successfully' });
  } catch (err) {
    console.error('Delete threat model error:', err);
    res.status(500).json({ message: 'Failed to delete threat model' });
  }
});

module.exports = router;

