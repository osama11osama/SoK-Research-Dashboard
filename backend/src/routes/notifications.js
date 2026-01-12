const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('relatedPaperId', 'title')
      .populate('relatedNoteId', 'content')
      .populate('relatedUserId', 'displayName username')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ notification });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await Notification.deleteOne({ _id: req.params.id });

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      preferences: user.notificationPreferences || {
        publicNote: true,
        paperAdded: true,
        paperEdited: true,
        mention: true
      }
    });
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ message: 'Failed to get preferences' });
  }
});

// Update notification preferences
router.patch('/preferences', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { publicNote, paperAdded, paperEdited, mention } = req.body;

    if (publicNote !== undefined) {
      user.notificationPreferences.publicNote = publicNote;
    }
    if (paperAdded !== undefined) {
      user.notificationPreferences.paperAdded = paperAdded;
    }
    if (paperEdited !== undefined) {
      user.notificationPreferences.paperEdited = paperEdited;
    }
    if (mention !== undefined) {
      user.notificationPreferences.mention = mention;
    }

    await user.save();

    res.json({
      preferences: user.notificationPreferences
    });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

module.exports = router;

