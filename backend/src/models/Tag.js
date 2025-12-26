const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
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
  color: {
    type: String,
    default: '#3b82f6', // Default blue color
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

// Note: name already has an index from unique: true

// Static method to find or create tag
tagSchema.statics.findOrCreate = async function(tagName) {
  const normalizedName = tagName.trim().toLowerCase();
  let tag = await this.findOne({ name: normalizedName });
  
  if (!tag) {
    tag = await this.create({
      name: normalizedName,
      displayName: tagName.trim()
    });
  }
  
  return tag;
};

module.exports = mongoose.model('Tag', tagSchema);

