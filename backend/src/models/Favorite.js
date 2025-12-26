const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Compound index to ensure one favorite per user per paper
favoriteSchema.index({ userId: 1, paperId: 1 }, { unique: true });

// Index for faster lookups
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ paperId: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);

