const express = require('express');
const Paper = require('../models/Paper');
const Note = require('../models/Note');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get overview statistics
router.get('/overview', authenticate, async (req, res) => {
  try {
    const stats = {
      papers: {
        total: await Paper.countDocuments(),
        toRead: await Paper.countDocuments({ readingStatus: 'TO_READ' }),
        inProgress: await Paper.countDocuments({ readingStatus: 'IN_PROGRESS' }),
        read: await Paper.countDocuments({ readingStatus: 'READ' })
      },
      notes: {
        total: await Note.countDocuments(),
        public: await Note.countDocuments({ visibility: 'PUBLIC' }),
        private: await Note.countDocuments({ visibility: 'PRIVATE' })
      },
      users: {
        total: await User.countDocuments({ status: 'APPROVED' }),
        pending: await User.countDocuments({ status: 'PENDING' })
      }
    };

    // Add user-specific stats if not super admin
    if (req.user.role !== 'SUPER_ADMIN') {
      stats.notes.private = await Note.countDocuments({ 
        visibility: 'PRIVATE',
        authorUserId: req.user._id
      });
      
      stats.papers.createdByMe = await Paper.countDocuments({ 
        createdByUserId: req.user._id 
      });
    }

    res.json({ stats });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;

