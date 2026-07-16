const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  quantity: {
    amount: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'ONLINE'],
    default: 'ONLINE'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  paymentApp: {
    type: String,
    enum: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Other'],
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  screenshot: {
    url: String,
    publicId: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  paymentStatus: {
    type: String,
    enum: ['Pending Verification', 'Verified', 'Rejected'],
    default: 'Pending Verification'
  },
  verificationNotes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

paymentSchema.pre('validate', function normalizePayment(next) {
  if (this.quantity && typeof this.quantity.amount === 'string') {
    this.quantity.amount = Number(this.quantity.amount);
  }

  if (typeof this.totalAmount === 'string') {
    this.totalAmount = Number(this.totalAmount);
  }

  if (this.paymentDate && typeof this.paymentDate === 'string') {
    this.paymentDate = new Date(this.paymentDate);
  }

  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
