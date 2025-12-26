const express = require('express');
const { body, validationResult } = require('express-validator');
const Paper = require('../models/Paper');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, logAudit } = require('../middleware/rbac');

const router = express.Router();

// Get all papers (with visibility rules for creator)
router.get('/', authenticate, async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 }).lean();

    // Apply creator visibility rules
    const papersWithVisibility = papers.map(paper => {
      const paperObj = paper;
      
      // SUPER_ADMIN sees all creators
      if (req.user.role === 'SUPER_ADMIN') {
        return paperObj;
      }
      
      // Creator sees their own identity
      if (paper.createdByUserId.toString() === req.user._id.toString()) {
        return paperObj;
      }
      
      // Others see anonymous
      paperObj.createdByUserId = null;
      return paperObj;
    });

    res.json({ papers: papersWithVisibility });
  } catch (err) {
    console.error('Get papers error:', err);
    res.status(500).json({ message: 'Failed to fetch papers' });
  }
});

// Get single paper
router.get('/:id', authenticate, async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id).lean();
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Apply creator visibility rules
    if (req.user.role !== 'SUPER_ADMIN' && 
        paper.createdByUserId.toString() !== req.user._id.toString()) {
      paper.createdByUserId = null;
    }

    res.json({ paper });
  } catch (err) {
    console.error('Get paper error:', err);
    res.status(500).json({ message: 'Failed to fetch paper' });
  }
});

// Create new paper (any approved user)
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('authors').trim().notEmpty().withMessage('Authors are required'),
  body('link').optional().isURL().withMessage('Link must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const paperData = {
      ...req.body,
      createdByUserId: req.user._id
    };

    const paper = await Paper.create(paperData);
    
    await logAudit(req.user._id, 'PAPER_CREATE', 'PAPER', paper._id);

    res.status(201).json({ paper });
  } catch (err) {
    console.error('Create paper error:', err);
    res.status(500).json({ message: 'Failed to create paper' });
  }
});

// Update paper (SUPER_ADMIN only)
router.patch('/:id', authenticate, requireSuperAdmin, [
  body('title').optional().trim().notEmpty(),
  body('link').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const paper = await Paper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    Object.assign(paper, req.body);
    paper.updatedAt = new Date();
    await paper.save();

    await logAudit(req.user._id, 'PAPER_UPDATE', 'PAPER', paper._id, { changes: req.body });

    res.json({ paper });
  } catch (err) {
    console.error('Update paper error:', err);
    res.status(500).json({ message: 'Failed to update paper' });
  }
});

// Delete paper (SUPER_ADMIN only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    await Paper.findByIdAndDelete(req.params.id);

    await logAudit(req.user._id, 'PAPER_DELETE', 'PAPER', req.params.id);

    res.json({ message: 'Paper deleted successfully' });
  } catch (err) {
    console.error('Delete paper error:', err);
    res.status(500).json({ message: 'Failed to delete paper' });
  }
});

module.exports = router;

