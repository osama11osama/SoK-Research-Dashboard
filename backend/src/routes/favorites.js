const express = require('express');
const Favorite = require('../models/Favorite');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all favorite paper IDs for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).select('paperId');
    const favoriteIds = favorites.map(fav => fav.paperId.toString());
    res.json({ favoriteIds });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

// Add a paper to favorites
router.post('/:paperId', authenticate, async (req, res) => {
  try {
    const { paperId } = req.params;
    
    // Check if already favorited
    const existing = await Favorite.findOne({ userId: req.user._id, paperId });
    if (existing) {
      return res.status(400).json({ message: 'Paper is already in favorites' });
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      paperId
    });

    res.status(201).json({ message: 'Paper added to favorites', favorite });
  } catch (err) {
    console.error('Add favorite error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Paper is already in favorites' });
    }
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

// Remove a paper from favorites
router.delete('/:paperId', authenticate, async (req, res) => {
  try {
    const { paperId } = req.params;
    
    const result = await Favorite.deleteOne({ userId: req.user._id, paperId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Paper removed from favorites' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

module.exports = router;

