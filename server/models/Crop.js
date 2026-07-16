const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  variety: { type: String, trim: true, maxlength: 50 },
  description: { type: String, maxlength: 500 },
  garden: { type: mongoose.Schema.Types.ObjectId, ref: 'Garden', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: {
    type: String,
    enum: ['vegetable', 'herb', 'fruit', 'flower', 'grain', 'legume'],
    required: true
  },
  quantity: {
    amount: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'pieces', 'bunches', 'bags', 'containers'],
      required: true
    }
  },
  availability: {
    type: String,
    enum: ['available', 'limited', 'unavailable', 'harvested'],
    default: 'available'
  },
  harvestDate: { type: Date, required: true },
  expiryDate: { type: Date },
  price: { type: Number, min: 0, default: 0 },
  isFree: { type: Boolean, default: false },
  tradeOptions: [{ type: String, enum: ['free', 'trade', 'sell', 'barter'] }],
  images: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  growingMethod: {
    type: String,
    enum: ['organic', 'conventional', 'hydroponic', 'permaculture'],
    default: 'conventional'
  },
  season: {
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter', 'year-round'],
    required: true
  },
  requests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: { amount: Number, unit: String },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: Date
  }],
  tags: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update timestamp
cropSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
cropSchema.index({ garden: 1 });
cropSchema.index({ owner: 1 });
cropSchema.index({ category: 1 });
cropSchema.index({ availability: 1, isActive: 1 });
cropSchema.index({ harvestDate: 1 });
// Removed invalid index

module.exports = mongoose.model('Crop', cropSchema);
