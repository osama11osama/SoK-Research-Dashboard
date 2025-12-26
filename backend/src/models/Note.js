const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper',
    required: true
  },
  authorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['PRIVATE', 'PUBLIC'],
    required: true,
    default: 'PUBLIC'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes
noteSchema.index({ paperId: 1, createdAt: -1 });
noteSchema.index({ authorUserId: 1 });
noteSchema.index({ visibility: 1 });

// Update updatedAt before save
noteSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Note', noteSchema);

