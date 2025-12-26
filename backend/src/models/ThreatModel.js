const mongoose = require('mongoose');

const threatModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    enum: ['Vulnerability', 'Attack', 'Privacy', 'Security', 'Other'],
    default: 'Security'
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

// Index for faster lookups
// Note: name already has an index from unique: true
threatModelSchema.index({ category: 1 });

// Static method to find or create threat model
threatModelSchema.statics.findOrCreate = async function(threatModelName) {
  const normalizedName = threatModelName.trim().toLowerCase();
  let threatModel = await this.findOne({ name: normalizedName });
  
  if (!threatModel) {
    threatModel = await this.create({
      name: normalizedName,
      displayName: threatModelName.trim()
    });
  }
  
  return threatModel;
};

module.exports = mongoose.model('ThreatModel', threatModelSchema);

