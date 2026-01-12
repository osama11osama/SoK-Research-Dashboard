const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const Paper = require('../models/Paper');
const { authenticate } = require('../middleware/auth');
const { requireReviewerNote, logAudit } = require('../middleware/rbac');
const { notifyPublicNote, notifyMentions } = require('../utils/notifications');

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

    // Send notifications
    if (note.visibility === 'PUBLIC') {
      await notifyPublicNote(note._id, req.user._id);
    }
    // Always check for mentions regardless of visibility
    await notifyMentions(note._id, req.user._id, note.content);

    res.status(201).json({ note });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// Update note (author only, or SUPER_ADMIN for any note)
router.patch('/:noteId', authenticate, requireReviewerNote, [
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('visibility').optional().isIn(['PRIVATE', 'PUBLIC']).withMessage('Visibility must be PRIVATE or PUBLIC')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const paperId = req.params.paperId;
    const noteId = req.params.noteId;
    
    // Check if paper exists
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Find the note
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permissions: user can only edit their own notes, unless they're SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN' && note.authorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own notes' });
    }

    // Update note fields
    if (req.body.content !== undefined) {
      note.content = req.body.content;
    }
    if (req.body.visibility !== undefined) {
      note.visibility = req.body.visibility;
    }
    note.updatedAt = new Date();
    await note.save();

    await logAudit(req.user._id, 'NOTE_UPDATE', 'NOTE', note._id, {
      paperId,
      visibility: note.visibility
    });

    // Send notifications for edited public notes
    if (note.visibility === 'PUBLIC') {
      await notifyPublicNote(note._id, req.user._id);
    }
    // Check for mentions in updated content
    if (req.body.content) {
      await notifyMentions(note._id, req.user._id, note.content);
    }

    res.json({ note });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'Failed to update note' });
  }
});

// Delete note (author only, or SUPER_ADMIN for any note)
router.delete('/:noteId', authenticate, requireReviewerNote, async (req, res) => {
  try {
    const paperId = req.params.paperId;
    const noteId = req.params.noteId;
    
    // Check if paper exists
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Find the note
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permissions: user can only delete their own notes, unless they're SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN' && note.authorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own notes' });
    }

    await logAudit(req.user._id, 'NOTE_DELETE', 'NOTE', note._id, {
      paperId,
      visibility: note.visibility
    });

    // Send notifications for deleted public notes
    if (note.visibility === 'PUBLIC') {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      const actor = await User.findById(req.user._id);
      if (actor && paper) {
        const users = await User.find({
          status: 'APPROVED',
          _id: { $ne: req.user._id }
        });

        const notifications = [];
        for (const user of users) {
          if (user.notificationPreferences?.publicNote) {
            notifications.push({
              userId: user._id,
              type: 'PUBLIC_NOTE',
              title: 'Note Deleted',
              message: `${actor.displayName} deleted a public note on "${paper.title}"`,
              relatedPaperId: paper._id,
              relatedUserId: req.user._id,
              read: false
            });
          }
        }

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    await Note.findByIdAndDelete(noteId);

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;

