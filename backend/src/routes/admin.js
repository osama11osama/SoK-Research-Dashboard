const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, logAudit } = require('../middleware/rbac');

const router = express.Router();

// Get all users (with optional status filter)
router.get('/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Approve user
router.post('/users/:id/approve', authenticate, requireSuperAdmin, [
  body('role').isIn(['REVIEWER_VIEW', 'REVIEWER_NOTE', 'SUPER_ADMIN'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'APPROVED') {
      return res.status(400).json({ message: 'User already approved' });
    }

    user.status = 'APPROVED';
    user.role = req.body.role;
    user.approvedAt = new Date();
    user.approvedByUserId = req.user._id;
    await user.save();

    await logAudit(req.user._id, 'USER_APPROVE', 'USER', user._id, { 
      role: user.role 
    });

    res.json({ 
      message: 'User approved successfully',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

// Reject user
router.post('/users/:id/reject', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'REJECTED';
    await user.save();

    await logAudit(req.user._id, 'USER_REJECT', 'USER', user._id);

    res.json({ message: 'User rejected successfully' });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ message: 'Failed to reject user' });
  }
});

// Disable user
router.post('/users/:id/disable', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN' && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot disable your own super admin account' });
    }

    user.status = 'DISABLED';
    await user.save();

    await logAudit(req.user._id, 'USER_DISABLE', 'USER', user._id);

    res.json({ message: 'User disabled successfully' });
  } catch (err) {
    console.error('Disable user error:', err);
    res.status(500).json({ message: 'Failed to disable user' });
  }
});

// Update user role
router.patch('/users/:id/role', authenticate, requireSuperAdmin, [
  body('role').isIn(['REVIEWER_VIEW', 'REVIEWER_NOTE', 'SUPER_ADMIN'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN' && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own super admin role' });
    }

    const oldRole = user.role;
    user.role = req.body.role;
    await user.save();

    await logAudit(req.user._id, 'USER_ROLE_UPDATE', 'USER', user._id, { 
      oldRole, 
      newRole: user.role 
    });

    res.json({ 
      message: 'User role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

module.exports = router;

