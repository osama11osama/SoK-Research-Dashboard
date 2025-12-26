const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  authors: {
    type: String,
    required: true,
    trim: true
  },
  venue: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  link: {
    type: String,
    trim: true
  },
  readingStatus: {
    type: String,
    enum: ['TO_READ', 'IN_PROGRESS', 'READ'],
    default: 'TO_READ'
  },
  tags: [{
    type: String,
    trim: true
  }],
  sok: {
    category: {
      type: String,
      trim: true
    },
    method: {
      type: String,
      trim: true
    },
    threatModel: [{
      type: String,
      trim: true
    }],
    dataset: {
      type: String,
      trim: true
    },
    keyFindings: {
      type: String,
      trim: true
    },
    limitations: {
      type: String,
      trim: true
    },
    reproducibility: {
      code: {
        type: String,
        trim: true
      },
      data: {
        type: String,
        trim: true
      }
    }
  },
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
paperSchema.index({ createdByUserId: 1 });
paperSchema.index({ readingStatus: 1 });
paperSchema.index({ tags: 1 });
paperSchema.index({ createdAt: -1 });

// Update updatedAt before save
paperSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Paper', paperSchema);

