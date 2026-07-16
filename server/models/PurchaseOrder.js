const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crop: {
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
  paymentStatus: {
    type: String,
    enum: ['Pending Verification', 'Verified', 'Rejected'],
    default: 'Pending Verification'
  },
  orderStatus: {
    type: String,
    enum: ['Pending Seller Confirmation', 'Confirmed', 'Payment Failed', 'Completed', 'Cancelled'],
    default: 'Pending Seller Confirmation'
  },
  deliveryAddress: {
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  deliveryDate: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
