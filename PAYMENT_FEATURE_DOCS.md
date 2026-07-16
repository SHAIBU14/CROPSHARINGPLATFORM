# GardenShare Online Payment Feature

## Overview
Complete implementation of online payment feature for the Community Garden Platform with UPI support, seller verification, and buyer payment history tracking.

## Features Implemented

### 1. Backend

#### Database Models

**Payment Model** (`server/models/Payment.js`)
- Stores online payment details
- Fields: buyerId, sellerId, cropId, quantity, totalAmount, transactionId, paymentApp, paymentDate, screenshot, notes, paymentStatus, verification details
- Payment statuses: Pending Verification, Verified, Rejected

**PurchaseOrder Model** (`server/models/PurchaseOrder.js`)
- Links payments to purchase orders
- Tracks order status: Pending Seller Confirmation, Confirmed, Payment Failed, Completed, Cancelled
- Maintains buyer-seller-crop relationships

#### REST APIs

**POST /api/payments**
- Create new online payment submission
- Requires: sellerId, cropId, quantity, totalAmount, transactionId, paymentApp, paymentDate
- Optional: notes, screenshot file upload
- Validates: unique transaction ID, stock availability, amount calculation
- Creates both Payment and PurchaseOrder documents
- Sends notification to seller

**GET /api/payments/buyer**
- Get buyer's payment history
- Returns all payments with status filtering
- Populated with seller and crop details

**GET /api/payments/seller**
- Get all payments for seller verification
- Grouped by status: pending, verified, rejected
- Shows pending count for dashboard

**GET /api/payments/:id**
- Get detailed payment information
- Fully populated with buyer, seller, and crop details

**PATCH /api/payments/:id/verify**
- Seller verifies payment
- Updates payment status to "Verified"
- Updates purchase order to "Confirmed"
- Sends notification to buyer

**PATCH /api/payments/:id/reject**
- Seller rejects payment with optional reason
- Updates payment status to "Rejected"
- Updates purchase order to "Payment Failed"
- Sends notification to buyer

**GET /api/crops/:cropId/seller-info**
- Get seller information for payment page
- Returns seller details and crop information

### 2. Frontend Components

#### PaymentModal.tsx
- Modal displaying payment interface
- Shows seller information (name, username, email, phone, UPI ID)
- Displays crop details and total amount
- QR code placeholder for future integration
- Payment instructions
- Embeds PaymentForm component

#### PaymentForm.tsx
- Form for submitting payment details
- Fields: Transaction ID, Payment App, Date, Time, Screenshot (optional), Notes
- Screenshot upload with preview
- Validation: Transaction ID required, image files only, max 5MB
- Loading states and error handling
- Security notice about sensitive data

#### Crop Details Page (crops/[id]/page.tsx)
- Updated with online payment option
- Triggers PaymentModal on "Online Payment" selection
- Passes crop and quantity data to modal

#### Seller Payment Verification (seller/payment-verification/page.tsx)
- Dashboard for sellers to verify payments
- Tabs: Pending, Verified, Rejected
- Shows buyer info, transaction details, screenshot
- Actions: Verify Payment, Reject Payment
- Verification modal with optional notes
- Displays payment status indicators

#### Buyer Payment History (buyer/payment-history/page.tsx)
- Shows all buyer's payments with statuses
- Summary stats: total, pending, verified, rejected
- Payment cards with crop image and details
- Click to view payment details modal
- Status badges with icons
- Date and amount filtering

### 3. Integration Points

#### Database Integration
- MongoDB with Mongoose schemas
- Timestamps for all transactions
- Proper indexing and relationships

#### Authentication
- JWT token validation via auth middleware
- User identity verification for buyer/seller roles
- Secure payment operations

#### Notifications (existing system)
- Payment Submitted → Seller
- Payment Verified → Buyer
- Payment Rejected → Buyer

#### Error Handling
- Validation at both frontend and backend
- Proper HTTP status codes
- User-friendly error messages
- Loading states and spinners

## File Structure

```
Backend:
server/
├── models/
│   ├── Payment.js          (NEW)
│   └── PurchaseOrder.js    (NEW)
├── routes/
│   ├── paymentController.js (NEW)
│   └── payments.js         (NEW)
└── index.js                (UPDATED)

Frontend:
client/
├── components/
│   ├── PaymentModal.tsx    (NEW)
│   └── PaymentForm.tsx     (NEW)
└── app/
    ├── crops/[id]/page.tsx (UPDATED)
    ├── seller/
    │   └── payment-verification/page.tsx (NEW)
    └── buyer/
        └── payment-history/page.tsx (NEW)
```

## API Documentation

### Payment Submission
```bash
POST /api/payments
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "sellerId": "seller_id",
  "cropId": "crop_id",
  "quantity": 5,
  "totalAmount": 250,
  "transactionId": "UPI1234567890",
  "paymentApp": "Google Pay",
  "paymentDate": "2026-07-14T15:30:00Z",
  "notes": "Payment received successfully",
  "screenshot": <File>
}

Response:
{
  "message": "Payment submitted successfully",
  "payment": { ... },
  "purchaseOrder": { ... }
}
```

### Get Buyer Payments
```bash
GET /api/payments/buyer
Authorization: Bearer <token>

Response:
{
  "payments": [...],
  "purchaseOrders": [...],
  "total": 5
}
```

### Get Seller Payments
```bash
GET /api/payments/seller
Authorization: Bearer <token>

Response:
{
  "all": [...],
  "pending": [...],
  "verified": [...],
  "rejected": [...],
  "total": 10,
  "pendingCount": 3
}
```

### Verify Payment
```bash
PATCH /api/payments/:id/verify
Authorization: Bearer <token>

{
  "notes": "Payment verified successfully"
}

Response:
{
  "message": "Payment verified successfully",
  "payment": { ... with status: "Verified" }
}
```

### Reject Payment
```bash
PATCH /api/payments/:id/reject
Authorization: Bearer <token>

{
  "notes": "Transaction ID not found"
}

Response:
{
  "message": "Payment rejected successfully",
  "payment": { ... with status: "Rejected" }
}
```

## Usage

### For Buyers

1. **Browse Crops**
   - Go to crop details page
   - Select quantity

2. **Choose Payment Method**
   - Select "Online Payment" option

3. **Payment Modal Opens**
   - View seller information (UPI ID, contact)
   - Scan QR code or send UPI payment manually
   - Fill transaction details from UPI app
   - Upload screenshot (optional but recommended)
   - Add notes if needed

4. **Submit Payment**
   - Click "Submit Payment"
   - Receive confirmation toast
   - Payment goes to "Pending Verification" status

5. **Track Payment**
   - Go to "Payment History" in buyer dashboard
   - View all payments and their statuses
   - Check details and seller contact info

### For Sellers

1. **Receive Notifications**
   - Get notification when buyer submits payment
   - View pending payments in "Payment Verification" page

2. **Verify Payment**
   - Click "View Screenshot" to see payment proof
   - Review buyer details and transaction ID
   - Click "Verify Payment" to confirm
   - Add verification notes (optional)
   - Payment status changes to "Verified"

3. **Reject Payment (if needed)**
   - If payment details don't match, click "Reject"
   - Provide reason for rejection
   - Payment status changes to "Rejected"

4. **Track Verified Payments**
   - Switch to "Verified" tab to see completed payments
   - Access seller dashboard statistics

## Security Features

### Frontend
- No password/OTP/sensitive data collection
- File upload validation (image only, max 5MB)
- Transaction ID validation
- Amount verification
- Security warning about sensitive data

### Backend
- JWT authentication on all endpoints
- Transaction ID uniqueness check
- Stock availability validation
- Amount calculation verification
- Seller authorization checks
- Proper error handling

### Data Privacy
- Screenshot uploaded securely
- Transaction details stored encrypted
- User sensitive data not exposed

## Future Enhancements

1. **QR Code Generation**
   - Use qrcode.react library to generate dynamic QR codes
   - Include UPI string: `upi://pay?pa=UPI_ID&pn=Seller_Name&am=Amount`

2. **Payment Gateway Integration**
   - Razorpay/Stripe integration
   - Real payment processing instead of manual verification

3. **Automated Notifications**
   - Email confirmations
   - SMS alerts
   - Push notifications

4. **Analytics**
   - Payment success/failure rates
   - Seller reputation based on verification
   - Transaction history reports

5. **Refund Management**
   - Handle payment disputes
   - Initiate refunds
   - Transaction reversal

## Testing

### Test Scenario 1: Successful Payment
1. Login as buyer
2. Find crop listing
3. Select "Online Payment"
4. Fill payment details
5. Submit
6. Login as seller
7. Verify payment in "Payment Verification"

### Test Scenario 2: Rejected Payment
1. Follow steps 1-5 above
2. As seller, click "Reject Payment"
3. Add reason
4. Buyer receives notification

### Test Scenario 3: Payment History
1. Login as buyer
2. Go to "Payment History"
3. View all submitted payments
4. Click payment card to see details

## Dependencies

### Backend
- express-validator (validation)
- mongoose (database)
- dotenv (environment)

### Frontend
- react-hook-form (form handling)
- react-hot-toast (notifications)
- lucide-react (icons)
- axios (HTTP client)

## Database Schema Changes

No changes to existing models required. New collections added:
- `payments` (new)
- `purchaseorders` (new)

## Environment Variables

No new environment variables required. Existing setup works as-is.

## Performance Considerations

- Pagination for seller payment list (future enhancement)
- Image compression for screenshots (future enhancement)
- Caching for seller info lookups
- Indexing on transactionId for quick lookups

## Troubleshooting

### Payment submission fails
- Check transaction ID is unique
- Verify quantity doesn't exceed stock
- Ensure total amount calculation is correct

### Screenshot not uploading
- Check file is an image (PNG, JPG, GIF)
- File size must be < 5MB
- Ensure browser has file upload permission

### Payment verification not showing
- Clear browser cache
- Refresh page
- Check user is logged in as seller
- Verify payment exists in database

## Support

For issues or questions:
1. Check API responses for error messages
2. Review browser console for client errors
3. Check server logs for backend errors
4. Verify database connections
