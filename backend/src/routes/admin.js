const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Paper = require('../models/Paper');
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

// Update user password (SUPER_ADMIN only)
router.patch('/users/:id/password', authenticate, requireSuperAdmin, [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
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

    const { password } = req.body;
    user.passwordHash = await User.hashPassword(password);
    await user.save();

    await logAudit(req.user._id, 'USER_PASSWORD_UPDATE', 'USER', user._id, {
      targetUsername: user.username
    });

    res.json({ 
      message: 'User password updated successfully',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update user password error:', err);
    res.status(500).json({ message: 'Failed to update user password' });
  }
});

// Get all settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    const settings = await Settings.find().lean();
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });
    res.json({ settings: settingsMap });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Get single setting
router.get('/settings/:key', authenticate, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key }).lean();
    if (!setting) {
      return res.json({ setting: { key: req.params.key, value: null } });
    }
    res.json({ setting: { key: setting.key, value: setting.value } });
  } catch (err) {
    console.error('Get setting error:', err);
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
});

// Update setting (SUPER_ADMIN only)
router.patch('/settings/:key', authenticate, requireSuperAdmin, [
  body('value').notEmpty().withMessage('Value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    let setting = await Settings.findOne({ key });
    if (setting) {
      setting.value = value;
      if (description !== undefined) {
        setting.description = description;
      }
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      setting = await Settings.create({
        key,
        value,
        description: description || ''
      });
    }

    await logAudit(req.user._id, 'SETTING_UPDATE', 'SETTINGS', setting._id, { 
      key, 
      value 
    });

    res.json({ 
      message: 'Setting updated successfully',
      setting: {
        key: setting.key,
        value: setting.value,
        description: setting.description
      }
    });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

const searchAggregator = require('../services/search-aggregator');

// Multi-source Paper Search Tool (available to all authenticated users)
router.get('/tools/search', authenticate, async (req, res) => {
  try {
    const { query, maxResults = 50, sources } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Parse sources parameter (comma-separated list, default to all)
    const sourcesList = sources 
      ? sources.split(',').map(s => s.trim().toLowerCase())
      : ['dblp', 'semantic', 'openalex', 'arxiv'];

    const papers = await searchAggregator.searchAllSources(
      query.trim(), 
      parseInt(maxResults) || 50,
      sourcesList
    );

    // Log search action for audit trail
    await logAudit(req.user._id, 'PAPER_SEARCH', 'SYSTEM', null, {
      query: query.trim(),
      sources: sourcesList,
      resultsCount: papers.length,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      papers, 
      total: papers.length,
      sources: sourcesList,
      query: query.trim()
    });
  } catch (err) {
    console.error('Multi-source search error:', err);
    res.status(500).json({ message: 'Failed to search: ' + (err.message || 'Unknown error') });
  }
});

// DBLP Paper Search Tool (legacy endpoint, kept for backward compatibility)
router.get('/tools/dblp-search', authenticate, async (req, res) => {
  try {
    const { query, maxResults = 50 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const papers = await searchAggregator.searchDBLP(query.trim(), parseInt(maxResults) || 50);

    // Log search action
    await logAudit(req.user._id, 'PAPER_SEARCH', 'SYSTEM', null, {
      query: query.trim(),
      source: 'DBLP',
      resultsCount: papers.length,
      timestamp: new Date().toISOString()
    });

    res.json({ papers, total: papers.length });
  } catch (err) {
    console.error('DBLP search error:', err);
    res.status(500).json({ message: 'Failed to search DBLP: ' + (err.message || 'Unknown error') });
  }
});

// Get Semantic Scholar Summary/TLDR
router.get('/tools/semantic-summary/:paperId', authenticate, async (req, res) => {
  try {
    const { paperId } = req.params;
    
    // Decode the paperId in case it was URL encoded
    const decodedPaperId = decodeURIComponent(paperId);
    
    if (!decodedPaperId || decodedPaperId.trim() === '') {
      return res.status(400).json({ message: 'Paper ID is required' });
    }

    const summary = await searchAggregator.getSemanticScholarSummary(decodedPaperId);
    
    if (!summary) {
      return res.status(404).json({ message: 'Summary not found for this paper ID. The paper may not exist in Semantic Scholar database.' });
    }

    res.json({ summary });
  } catch (err) {
    console.error('Semantic Scholar summary error:', err);
    
    // Handle specific error cases
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'Paper not found in Semantic Scholar database' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'Semantic Scholar API request timeout' });
    }
    
    res.status(500).json({ message: 'Failed to get summary: ' + (err.message || 'Unknown error') });
  }
});

// Add paper from DBLP search result (available to all authenticated users)
router.post('/tools/add-paper', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('authors').trim().notEmpty().withMessage('Authors are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for duplicate
    const normalizedTitle = req.body.title.trim();
    const existingPaper = await Paper.findOne({ title: normalizedTitle });
    
    if (existingPaper) {
      return res.status(409).json({ 
        message: `A paper with the title "${normalizedTitle}" already exists`,
        duplicate: true 
      });
    }

    const paperData = {
      title: normalizedTitle,
      authors: req.body.authors.trim(),
      venue: req.body.venue?.trim() || undefined,
      year: req.body.year ? parseInt(req.body.year) : undefined,
      link: req.body.url?.trim() || req.body.link?.trim() || undefined,
      readingStatus: req.body.readingStatus || 'TO_READ',
      tags: req.body.tags || [],
      sok: req.body.sok || {},
      createdByUserId: req.user._id
    };

    // Normalize link - add https:// if missing
    if (paperData.link && !paperData.link.startsWith('http://') && !paperData.link.startsWith('https://')) {
      paperData.link = 'https://' + paperData.link;
    }

    const paper = await Paper.create(paperData);
    
    // Enhanced audit log with discovery information
    await logAudit(req.user._id, 'PAPER_CREATE', 'PAPER', paper._id, {
      source: req.body.source || 'MANUAL',
      searchQuery: req.body.searchQuery || null,
      discoveryMethod: req.body.discoveryMethod || 'MANUAL_ENTRY',
      sources: req.body.sources || [],
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ paper });
  } catch (err) {
    console.error('Add paper from DBLP error:', err);
    res.status(500).json({ message: 'Failed to add paper: ' + (err.message || 'Unknown error') });
  }
});

module.exports = router;

