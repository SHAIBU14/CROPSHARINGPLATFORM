const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { check, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('./paymentController');

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads/payments');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Validation middleware
const validateCreatePayment = [
  check('sellerId', 'Seller ID is required').notEmpty(),
  check('cropId', 'Crop ID is required').notEmpty(),
  check('quantity', 'Quantity must be a positive number').isInt({ min: 1 }),
  check('totalAmount', 'Total amount must be a positive number').isFloat({ min: 0 }),
  check('transactionId', 'Transaction ID is required').notEmpty().trim(),
  check('paymentApp', 'Payment app is required').isIn(['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Other']),
  check('paymentDate', 'Payment date is required').notEmpty()
];

const validateVerifyPayment = [
  check('notes', 'Notes can be maximum 500 characters').optional().isLength({ max: 500 })
];

// POST /api/payments - Create new payment
router.post('/', authMiddleware, upload.single('screenshot'), ...validateCreatePayment, paymentController.createPayment);

// GET /api/payments/buyer - Get buyer's payments
router.get('/buyer', authMiddleware, paymentController.getBuyerPayments);

// GET /api/payments/seller - Get seller's payments for verification
router.get('/seller', authMiddleware, paymentController.getSellerPayments);

// GET /api/crops/:cropId/seller-info - Get seller info for payment page (must be before /:id)
router.get('/crop/:cropId/seller-info', authMiddleware, paymentController.getSellerInfo);

// GET /api/payments/:id - Get payment details
router.get('/:id', authMiddleware, paymentController.getPaymentDetails);

// PATCH /api/payments/:id/verify - Verify payment
router.patch('/:id/verify', authMiddleware, ...validateVerifyPayment, paymentController.verifyPayment);

// PATCH /api/payments/:id/reject - Reject payment
router.patch('/:id/reject', authMiddleware, ...validateVerifyPayment, paymentController.rejectPayment);

module.exports = router;
