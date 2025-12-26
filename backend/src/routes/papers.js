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
  body('link').optional({ checkFalsy: true }).custom((value) => {
    if (!value || value === '') return true; // Allow empty string
    return /^https?:\/\/.+/.test(value); // Validate URL format if provided
  }).withMessage('Link must be a valid URL or empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle empty link field - convert empty string to undefined (MongoDB accepts both)
    const paperData = {
      ...req.body,
      createdByUserId: req.user._id
    };
    if (paperData.link === '') {
      paperData.link = undefined;
    }

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
  body('authors').optional().trim().notEmpty(),
  body('venue').optional().trim(),
  body('year').optional().isInt({ min: 1900, max: 2100 }),
  body('link').optional({ checkFalsy: true }).custom((value) => {
    if (!value || value === '') return true; // Allow empty string
    return /^https?:\/\/.+/.test(value); // Validate URL format if provided
  }).withMessage('Link must be a valid URL or empty'),
  body('readingStatus').optional().isIn(['TO_READ', 'IN_PROGRESS', 'READ']),
  body('tags').optional().isArray()
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

    // Handle empty link field - use $unset to remove it from MongoDB
    const updateData = { ...req.body };
    const unsetFields = {};
    const setFields = {};
    
    // Check if link should be deleted (explicitly set to empty string)
    if (req.body.hasOwnProperty('link')) {
      const linkValue = req.body.link;
      if (linkValue === '' || linkValue === null || linkValue === undefined || 
          (typeof linkValue === 'string' && linkValue.trim() === '')) {
        // Mark link for removal
        unsetFields.link = '';
        delete updateData.link; // Remove from update data to avoid setting it
        console.log('Link marked for deletion via $unset');
      } else {
        // Link has a value, include it in $set
        setFields.link = linkValue;
      }
    }
    
    // Build update query - exclude link from setFields if it's being unset
    delete updateData.link; // Always remove from updateData, we handle it separately
    const updateQuery = { ...updateData, updatedAt: new Date() };
    if (setFields.link) {
      updateQuery.link = setFields.link;
    }
    
    // Use findByIdAndUpdate with both $set and $unset
    const updateOptions = {};
    if (Object.keys(unsetFields).length > 0) {
      updateOptions.$unset = unsetFields;
      console.log('Using $unset to remove link field:', unsetFields);
    }
    if (Object.keys(updateQuery).length > 0) {
      updateOptions.$set = updateQuery;
    }
    
    // Update the paper
    const updatedPaper = await Paper.findByIdAndUpdate(
      req.params.id,
      updateOptions,
      { new: true } // Return the updated document
    );
    
    // Double-check: verify link is removed
    if (unsetFields.link && updatedPaper && updatedPaper.link) {
      console.warn('Link was not removed, forcing removal...');
      // Force remove the link field
      await Paper.updateOne({ _id: req.params.id }, { $unset: { link: '' } });
      // Fetch again to ensure it's removed
      const reFetched = await Paper.findById(req.params.id).lean();
      if (reFetched) {
        delete reFetched.link;
        return res.json({ paper: reFetched });
      }
    }

    await logAudit(req.user._id, 'PAPER_UPDATE', 'PAPER', updatedPaper._id, { changes: req.body });

    // Ensure link field is not in response if it was deleted
    // Convert Mongoose document to plain object if needed
    let paperResponse = updatedPaper;
    if (updatedPaper.toObject) {
      paperResponse = updatedPaper.toObject();
    } else if (updatedPaper.toJSON) {
      paperResponse = updatedPaper.toJSON();
    }
    
    // Remove link field from response if it was deleted
    if (unsetFields.link && paperResponse.link !== undefined) {
      delete paperResponse.link;
    }
    
    res.json({ paper: paperResponse });
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

