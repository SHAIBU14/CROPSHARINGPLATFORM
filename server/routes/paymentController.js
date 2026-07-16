const Payment = require('../models/Payment');
const PurchaseOrder = require('../models/PurchaseOrder');
const Notification = require('../models/Notification');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const emailService = require('../services/emailService');

// Demo mode file paths
const CROPS_FILE = path.join(__dirname, '../data/demo-crops.json');
const USERS_FILE = path.join(__dirname, '../data/demo-users.json');
const PAYMENTS_FILE = path.join(__dirname, '../data/demo-payments.json');
const PURCHASE_ORDERS_FILE = path.join(__dirname, '../data/demo-purchase-orders.json');

const isDbReady = () => mongoose.connection.readyState === 1;

const loadCropsFromStorage = async () => {
  try {
    const data = await fs.readFile(CROPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveDemoCrops = async (crops) => {
  await fs.writeFile(CROPS_FILE, JSON.stringify(crops, null, 2));
};

const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const loadStoredPayments = async () => {
  try {
    const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveStoredPayments = async (payments) => {
  await fs.writeFile(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
};

const loadStoredPurchaseOrders = async () => {
  try {
    const data = await fs.readFile(PURCHASE_ORDERS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveStoredPurchaseOrders = async (purchaseOrders) => {
  await fs.writeFile(PURCHASE_ORDERS_FILE, JSON.stringify(purchaseOrders, null, 2));
};

// POST /api/payments - Create new payment
exports.createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      sellerId,
      cropId,
      quantity,
      totalAmount,
      paymentApp,
      paymentDate,
      transactionId,
      notes,
      paymentMethod = 'ONLINE'
    } = req.body;

    const buyerId = req.user.id || req.user._id || req.user.userId;
    const quantityValue = Number(quantity);
    const totalAmountValue = Number(totalAmount);

    if (!Number.isInteger(quantityValue) || quantityValue < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    if (!Number.isFinite(totalAmountValue) || totalAmountValue < 0) {
      return res.status(400).json({ message: 'Total amount must be a valid positive number' });
    }

    let crop = null;
    let seller = null;

    // Try database first when connected
    if (isDbReady() && mongoose.Types.ObjectId.isValid(cropId)) {
      crop = await Crop.findById(cropId);
      if (crop) {
        seller = await User.findById(sellerId);
      }
    }

    // Fall back to demo data when the database is unavailable
    if (!crop) {
      const demoCrops = await loadCropsFromStorage();
      crop = demoCrops.find((entry) => entry._id === cropId || entry._id?.toString() === cropId);
    }

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (!seller) {
      const demoUsers = await readUsers();
      seller = demoUsers.find((entry) => entry._id === sellerId || entry._id?.toString() === sellerId);
    }

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (crop.quantity.amount < quantityValue) {
      return res.status(400).json({ message: 'Quantity exceeds available stock' });
    }

    // Check duplicate transaction ID only for ONLINE payments
    if (paymentMethod === 'ONLINE') {
      let existingPayment = null;
      if (isDbReady()) {
        existingPayment = await Payment.findOne({ transactionId });
      } else {
        const storedPayments = await loadStoredPayments();
        existingPayment = storedPayments.find((entry) => entry.transactionId === transactionId);
      }

      if (existingPayment) {
        return res.status(400).json({ message: 'This transaction ID has already been used' });
      }
    }

    const expectedTotal = crop.price * quantityValue;
    if (Math.abs(expectedTotal - totalAmountValue) > 1) {
      return res.status(400).json({ message: 'Total amount calculation error' });
    }

    // Deduct available crop quantity
    if (isDbReady()) {
      crop.quantity.amount -= quantityValue;
      if (crop.quantity.amount <= 0) {
        crop.availability = 'sold out';
      }
      await crop.save();
    } else {
      const demoCrops = await loadCropsFromStorage();
      const cIndex = demoCrops.findIndex(c => c._id === cropId || c._id.toString() === cropId);
      if (cIndex !== -1) {
        demoCrops[cIndex].quantity.amount = Math.max(0, demoCrops[cIndex].quantity.amount - quantityValue);
        if (demoCrops[cIndex].quantity.amount <= 0) {
          demoCrops[cIndex].availability = 'sold out';
        }
        await saveDemoCrops(demoCrops);
        crop.quantity.amount = demoCrops[cIndex].quantity.amount;
        crop.availability = demoCrops[cIndex].availability;
      }
    }

    // Create payment
    const payment = new Payment({
      buyerId,
      sellerId,
      cropId,
      quantity: {
        amount: quantityValue,
        unit: crop.quantity.unit
      },
      totalAmount: totalAmountValue,
      paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
      transactionId,
      paymentApp,
      paymentDate: new Date(paymentDate),
      notes,
      screenshot: req.file ? {
        url: req.file.path,
        publicId: req.file.filename
      } : undefined
    });

    let persistedPayment = payment;
    let persistedPurchaseOrder = null;

    if (isDbReady()) {
      await payment.save();
      persistedPayment = payment;
    } else {
      const storedPayments = await loadStoredPayments();
      const paymentRecord = {
        _id: new mongoose.Types.ObjectId().toString(),
        buyerId,
        sellerId,
        cropId,
        quantity: {
          amount: quantityValue,
          unit: crop.quantity.unit
        },
        totalAmount: totalAmountValue,
        paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
        transactionId,
        paymentApp,
        paymentDate: new Date(paymentDate).toISOString(),
        notes,
        screenshot: req.file ? {
          url: req.file.path,
          publicId: req.file.filename
        } : undefined,
        paymentStatus: 'Pending Verification',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storedPayments.unshift(paymentRecord);
      await saveStoredPayments(storedPayments);
      persistedPayment = paymentRecord;
    }

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      paymentId: persistedPayment._id,
      buyer: buyerId,
      seller: sellerId,
      crop: cropId,
      quantity: {
        amount: quantityValue,
        unit: crop.quantity.unit
      },
      totalAmount: totalAmountValue,
      paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
      paymentStatus: 'Pending Verification',
      orderStatus: 'Pending Seller Confirmation'
    });

    if (isDbReady()) {
      await purchaseOrder.save();
      persistedPurchaseOrder = purchaseOrder;
    } else {
      const storedPurchaseOrders = await loadStoredPurchaseOrders();
      const purchaseOrderRecord = {
        _id: new mongoose.Types.ObjectId().toString(),
        paymentId: persistedPayment._id,
        buyer: buyerId,
        seller: sellerId,
        crop: cropId,
        quantity: {
          amount: quantityValue,
          unit: crop.quantity.unit
        },
        totalAmount: totalAmountValue,
        paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
        paymentStatus: 'Pending Verification',
        orderStatus: 'Pending Seller Confirmation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storedPurchaseOrders.unshift(purchaseOrderRecord);
      await saveStoredPurchaseOrders(storedPurchaseOrders);
      persistedPurchaseOrder = purchaseOrderRecord;
    }

    // Send notification to seller
    const notification = new Notification({
      recipient: sellerId,
      type: 'PAYMENT_RECEIVED',
      title: paymentMethod === 'CASH' ? 'New COD Order Received' : 'New Online Payment Received',
      message: `${req.user.firstName} has submitted an order of ₹${totalAmountValue} for ${crop.name}`,
      relatedPayment: persistedPayment._id,
      read: false
    });

    if (isDbReady()) {
      await notification.save();
    }

    // Send emails to buyer and seller (only if email is configured/handled)
    const paymentDetailsForEmail = {
      transactionId,
      paymentApp,
      totalAmount: totalAmountValue,
      paymentDate,
      cropName: crop.name,
      cropPrice: crop.price,
      cropUnit: crop.quantity.unit,
      quantity: quantityValue,
      sellerName: `${seller.firstName} ${seller.lastName}`,
      buyerName: `${req.user.firstName} ${req.user.lastName}`,
      buyerEmail: req.user.email,
      buyerPhone: req.user.phoneNumber
    };

    if (isDbReady()) {
      try {
        await emailService.sendPaymentConfirmationEmail(
          req.user.email,
          `${req.user.firstName} ${req.user.lastName}`,
          paymentDetailsForEmail
        );

        if (seller.email) {
          await emailService.sendPaymentVerificationEmail(
            seller.email,
            `${seller.firstName} ${seller.lastName}`,
            paymentDetailsForEmail
          );
        }
      } catch (err) {
        console.warn('Could not send confirmation emails:', err.message);
      }
    }

    res.status(201).json({
      message: paymentMethod === 'CASH' ? 'COD Purchase successful!' : 'Payment submitted successfully. Confirmation email sent to your inbox.',
      payment: persistedPayment,
      purchaseOrder: persistedPurchaseOrder,
      successDetails: {
        orderId: persistedPurchaseOrder._id || persistedPurchaseOrder.id,
        sellerName: `${seller.firstName} ${seller.lastName}`,
        sellerPhone: seller.phoneNumber || 'Not provided',
        sellerPhoto: seller.profileImage || '',
        quantity: `${quantityValue} ${crop.quantity.unit}`,
        totalPaid: totalAmountValue,
        paymentMethod: paymentMethod,
        purchaseDate: new Date(persistedPayment.createdAt || persistedPayment.paymentDate).toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/payments/buyer - Get buyer's payments
exports.getBuyerPayments = async (req, res) => {
  try {
    const buyerId = req.user.id;

    let payments = [];
    let purchaseOrders = [];

    if (isDbReady()) {
      payments = await Payment.find({ buyerId })
        .populate('sellerId', 'firstName lastName email phoneNumber')
        .populate('cropId', 'name images price')
        .sort({ createdAt: -1 });

      purchaseOrders = await PurchaseOrder.find({ buyer: buyerId })
        .populate('seller', 'firstName lastName email')
        .populate('crop', 'name images')
        .sort({ createdAt: -1 });
    } else {
      const storedPayments = await loadStoredPayments();
      payments = storedPayments.filter((entry) => entry.buyerId === buyerId || entry.buyerId?.toString() === buyerId);
      const storedPurchaseOrders = await loadStoredPurchaseOrders();
      purchaseOrders = storedPurchaseOrders.filter((entry) => entry.buyer === buyerId || entry.buyer?.toString() === buyerId);
    }

    res.json({
      payments,
      purchaseOrders,
      total: payments.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/payments/seller - Get seller's pending payments for verification
exports.getSellerPayments = async (req, res) => {
  try {
    const sellerId = req.user.id;

    let payments = [];

    if (isDbReady()) {
      payments = await Payment.find({ sellerId })
        .populate('buyerId', 'firstName lastName email phoneNumber username')
        .populate('cropId', 'name images price')
        .sort({ createdAt: -1 });
    } else {
      const storedPayments = await loadStoredPayments();
      payments = storedPayments.filter((entry) => entry.sellerId === sellerId || entry.sellerId?.toString() === sellerId);
    }

    const pendingPayments = payments.filter(p => p.paymentStatus === 'Pending Verification');
    const verifiedPayments = payments.filter(p => p.paymentStatus === 'Verified');
    const rejectedPayments = payments.filter(p => p.paymentStatus === 'Rejected');

    res.json({
      all: payments,
      pending: pendingPayments,
      verified: verifiedPayments,
      rejected: rejectedPayments,
      total: payments.length,
      pendingCount: pendingPayments.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/payments/:id/verify - Seller verifies payment
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const sellerId = req.user.id;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify seller is the one verifying
    if (payment.sellerId.toString() !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (payment.paymentStatus !== 'Pending Verification') {
      return res.status(400).json({ message: 'Payment is not pending verification' });
    }

    // Update payment
    payment.paymentStatus = 'Verified';
    payment.verificationNotes = notes;
    payment.verifiedBy = sellerId;
    payment.verifiedAt = new Date();
    await payment.save();

    // Update purchase order
    const purchaseOrder = await PurchaseOrder.findOne({ paymentId: id });
    if (purchaseOrder) {
      purchaseOrder.paymentStatus = 'Verified';
      purchaseOrder.orderStatus = 'Confirmed';
      await purchaseOrder.save();
    }

    // Send notification to buyer
    const notification = new Notification({
      recipient: payment.buyerId,
      type: 'PAYMENT_VERIFIED',
      title: 'Payment Verified',
      message: `Your payment of ₹${payment.totalAmount} has been verified by the seller`,
      relatedPayment: payment._id,
      read: false
    });

    await notification.save();

    // Get buyer and crop details to send email
    const buyer = await User.findById(payment.buyerId);
    const crop = await Crop.findById(payment.cropId);
    const seller = await User.findById(payment.sellerId);

    if (buyer && crop && seller) {
      const paymentDetailsForEmail = {
        transactionId: payment.transactionId,
        totalAmount: payment.totalAmount,
        cropName: crop.name,
        cropPrice: crop.price,
        cropUnit: crop.quantity.unit,
        quantity: payment.quantity.amount,
        sellerName: `${seller.firstName} ${seller.lastName}`
      };

      // Send verified email to buyer
      await emailService.sendPaymentVerifiedEmail(
        buyer.email,
        `${buyer.firstName} ${buyer.lastName}`,
        paymentDetailsForEmail
      );
    }

    res.json({
      message: 'Payment verified successfully. Buyer has been notified via email.',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/payments/:id/reject - Seller rejects payment
exports.rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const sellerId = req.user.id;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify seller is the one rejecting
    if (payment.sellerId.toString() !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (payment.paymentStatus !== 'Pending Verification') {
      return res.status(400).json({ message: 'Payment is not pending verification' });
    }

    // Update payment
    payment.paymentStatus = 'Rejected';
    payment.verificationNotes = notes;
    payment.verifiedBy = sellerId;
    payment.verifiedAt = new Date();
    await payment.save();

    // Update purchase order
    const purchaseOrder = await PurchaseOrder.findOne({ paymentId: id });
    if (purchaseOrder) {
      purchaseOrder.paymentStatus = 'Rejected';
      purchaseOrder.orderStatus = 'Payment Failed';
      await purchaseOrder.save();
    }

    // Send notification to buyer
    const notification = new Notification({
      recipient: payment.buyerId,
      type: 'PAYMENT_REJECTED',
      title: 'Payment Rejected',
      message: `Your payment of ₹${payment.totalAmount} has been rejected. Reason: ${notes || 'No reason provided'}`,
      relatedPayment: payment._id,
      read: false
    });

    await notification.save();

    // Get buyer and crop details to send email
    const buyer = await User.findById(payment.buyerId);
    const crop = await Crop.findById(payment.cropId);
    const seller = await User.findById(payment.sellerId);

    if (buyer && crop && seller) {
      const paymentDetailsForEmail = {
        transactionId: payment.transactionId,
        totalAmount: payment.totalAmount,
        cropName: crop.name,
        cropPrice: crop.price,
        cropUnit: crop.quantity.unit,
        quantity: payment.quantity.amount,
        sellerName: `${seller.firstName} ${seller.lastName}`
      };

      // Send rejection email to buyer
      await emailService.sendPaymentRejectedEmail(
        buyer.email,
        `${buyer.firstName} ${buyer.lastName}`,
        paymentDetailsForEmail,
        notes || 'No specific reason provided. Please contact the seller for more information.'
      );
    }

    res.json({
      message: 'Payment rejected successfully. Buyer has been notified via email.',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/payments/:id - Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('buyerId', 'firstName lastName email phoneNumber username')
      .populate('sellerId', 'firstName lastName email phoneNumber username')
      .populate('cropId', 'name images price description');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/crops/:cropId/seller-info - Get seller info for payment
exports.getSellerInfo = async (req, res) => {
  try {
    const { cropId } = req.params;

    let crop = null;
    let seller = null;

    // Try database first if connected
    if (isDbReady() && mongoose.Types.ObjectId.isValid(cropId)) {
      crop = await Crop.findById(cropId)
        .populate('owner', 'firstName lastName phoneNumber email username upiId profileImage location')
        .populate('garden', 'name location');
      if (crop) {
        seller = crop.owner;
      }
    }

    // Fall back to demo data
    if (!crop) {
      const crops = await loadCropsFromStorage();
      crop = crops.find(c => c._id === cropId || c._id.toString() === cropId);

      if (!crop) {
        return res.status(404).json({ message: 'Crop not found for the purchase' });
      }

      // Find seller info from demo users
      const users = await readUsers();
      
      // Determine the seller ID safely from owner object or string
      let sellerId = null;
      if (crop.sellerId) {
        sellerId = crop.sellerId.toString();
      } else if (crop.owner) {
        if (typeof crop.owner === 'object') {
          sellerId = crop.owner._id ? crop.owner._id.toString() : null;
        } else {
          sellerId = crop.owner.toString();
        }
      }

      if (sellerId) {
        seller = users.find(u => u._id === sellerId || u._id.toString() === sellerId);
      }

      if (!seller) {
        return res.status(404).json({ message: 'Seller information is missing for this crop' });
      }
    }

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found for the purchase' });
    }

    if (!seller) {
      return res.status(404).json({ message: 'Seller information is missing for this crop' });
    }

    // Return complete seller and garden location info
    res.json({
      seller: {
        _id: seller._id,
        firstName: seller.firstName || '',
        lastName: seller.lastName || '',
        username: seller.username || 'unknown',
        email: seller.email || '',
        phoneNumber: seller.phoneNumber || '',
        upiId: seller.upiId || 'seller@upi',
        profileImage: seller.profileImage || '',
        location: {
          address: seller.location?.address || crop.garden?.location?.address || '',
          city: seller.location?.city || crop.garden?.location?.city || '',
          state: seller.location?.state || crop.garden?.location?.state || '',
          country: seller.location?.country || crop.garden?.location?.country || 'India',
          zipCode: seller.location?.zipCode || crop.garden?.location?.zipCode || '',
          coordinates: seller.location?.coordinates || crop.garden?.location?.coordinates || null
        },
        gardenName: crop.garden ? (crop.garden.name || 'My Garden') : 'My Garden'
      },
      crop: {
        _id: crop._id,
        name: crop.name,
        price: crop.price,
        quantity: crop.quantity
      }
    });
  } catch (error) {
    console.error('Error fetching seller info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
