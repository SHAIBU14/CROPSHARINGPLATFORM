const mongoose = require('mongoose');

const gardenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String,
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    required: true
  },
  gardenType: {
    type: String,
    enum: ['vegetable', 'herb', 'fruit', 'flower', 'mixed'],
    required: true
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  features: [{
    type: String,
    enum: ['greenhouse', 'compost', 'irrigation', 'raised-beds', 'organic', 'permaculture']
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  visitors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    visitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
gardenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate average rating
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = sum / this.ratings.length;
  }
  
  next();
});

// Index for location-based queries
gardenSchema.index({ 'location.coordinates': '2dsphere' });
gardenSchema.index({ owner: 1 });
gardenSchema.index({ isPublic: 1, isActive: 1 });

module.exports = mongoose.model('Garden', gardenSchema);
