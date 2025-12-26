const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const Paper = require('../models/Paper');
const { authenticate } = require('../middleware/auth');
const { requireReviewerNote, logAudit } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// Get notes for a paper (with visibility rules)
router.get('/', authenticate, async (req, res) => {
  try {
    const paperId = req.params.paperId;
    
    // Check if paper exists
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Get all notes for this paper
    const notes = await Note.find({ paperId }).sort({ createdAt: -1 }).lean();

    // Apply visibility rules
    const visibleNotes = notes.filter(note => {
      // SUPER_ADMIN sees all notes
      if (req.user.role === 'SUPER_ADMIN') {
        return true;
      }
      
      // PUBLIC notes are visible to all
      if (note.visibility === 'PUBLIC') {
        return true;
      }
      
      // PRIVATE notes only visible to author
      return note.authorUserId.toString() === req.user._id.toString();
    });

    // Hide author identity for non-public notes (except SUPER_ADMIN)
    const notesWithVisibility = visibleNotes.map(note => {
      const noteObj = { ...note };
      
      if (req.user.role !== 'SUPER_ADMIN') {
        // Only show author for PUBLIC notes or own PRIVATE notes
        if (note.visibility === 'PRIVATE' && 
            note.authorUserId.toString() !== req.user._id.toString()) {
          // This shouldn't happen due to filter above, but just in case
          return null;
        }
      }
      
      return noteObj;
    }).filter(Boolean);

    res.json({ notes: notesWithVisibility });
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// Create note (REVIEWER_NOTE and SUPER_ADMIN only)
router.post('/', authenticate, requireReviewerNote, [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('visibility').isIn(['PRIVATE', 'PUBLIC']).withMessage('Visibility must be PRIVATE or PUBLIC')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const paperId = req.params.paperId;
    
    // Check if paper exists
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const note = await Note.create({
      paperId,
      authorUserId: req.user._id,
      visibility: req.body.visibility || 'PUBLIC',
      content: req.body.content
    });

    await logAudit(req.user._id, 'NOTE_CREATE', 'NOTE', note._id, { 
      paperId, 
      visibility: note.visibility 
    });

    res.status(201).json({ note });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

module.exports = router;

