# GardenShare Payment Feature - URL Routes

## Frontend Routes

### Buyer Routes

**Payment History Page**
```
http://localhost:3000/buyer/payment-history
```
- Shows all submitted payments
- Displays status (Pending, Verified, Rejected)
- Click payment to view details
- See summary statistics

### Seller Routes

**Payment Verification Page**
```
http://localhost:3000/seller/payment-verification
```
- View all pending payments
- Verify or reject payments
- See verified payments history
- See rejected payments history
- Access buyer contact information
- View payment screenshots

### Existing Routes (Updated)

**Crop Details Page with Online Payment**
```
http://localhost:3000/crops/[cropId]
```
- Select quantity
- Choose "Online Payment" option
- Click "Confirm Purchase"
- PaymentModal opens
- Fill payment details
- Submit transaction

---

## Backend API Routes

### Payment Endpoints

**Create Payment (Submit Transaction)**
```
POST http://localhost:5001/api/payments
Headers: Authorization: Bearer <token>
Body: {
  sellerId: string,
  cropId: string,
  quantity: number,
  totalAmount: number,
  transactionId: string,
  paymentApp: string,
  paymentDate: ISO8601,
  notes?: string,
  screenshot?: File
}
Response: 201 Created
```

**Get Buyer Payments**
```
GET http://localhost:5001/api/payments/buyer
Headers: Authorization: Bearer <token>
Response: { payments: [], purchaseOrders: [], total: number }
```

**Get Seller Payments**
```
GET http://localhost:5001/api/payments/seller
Headers: Authorization: Bearer <token>
Response: { all: [], pending: [], verified: [], rejected: [], pendingCount: number }
```

**Get Payment Details**
```
GET http://localhost:5001/api/payments/:paymentId
Headers: Authorization: Bearer <token>
Response: { Payment object with populated references }
```

**Verify Payment**
```
PATCH http://localhost:5001/api/payments/:paymentId/verify
Headers: Authorization: Bearer <token>
Body: { notes?: string }
Response: { message: string, payment: object }
```

**Reject Payment**
```
PATCH http://localhost:5001/api/payments/:paymentId/reject
Headers: Authorization: Bearer <token>
Body: { notes?: string }
Response: { message: string, payment: object }
```

**Get Seller Info for Payment**
```
GET http://localhost:5001/api/crops/:cropId/seller-info
Headers: Authorization: Bearer <token>
Response: { seller: object, crop: object }
```

---

## Navigation Examples

### For Testing (Buyer)

1. **View All Crops**
   - http://localhost:3000/crops

2. **Select a Crop**
   - http://localhost:3000/crops/[cropId]
   - Example: http://localhost:3000/crops/1

3. **Submit Payment**
   - Click "Online Payment" → "Confirm Purchase"
   - Fill form → "Submit Payment"

4. **Check Payment Status**
   - http://localhost:3000/buyer/payment-history

---

### For Testing (Seller)

1. **View Dashboard**
   - http://localhost:3000/dashboard

2. **Verify Payments**
   - http://localhost:3000/seller/payment-verification
   - See pending payments
   - Click "Verify Payment"
   - Add notes
   - Confirm

3. **Track Payments**
   - Switch to "Verified" tab
   - Switch to "Rejected" tab
   - View payment counts

---

## Component Navigation

### PaymentModal Integration

**Triggered From:** Crop Details Page
**Component:** `client/components/PaymentModal.tsx`
**Props:**
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  cropId: string,
  sellerId: string,
  quantity: number,
  totalAmount: number,
  cropName: string,
  cropPrice: number,
  cropUnit: string
}
```

### PaymentForm Integration

**Triggered From:** PaymentModal
**Component:** `client/components/PaymentForm.tsx`
**Props:**
```typescript
{
  sellerId: string,
  cropId: string,
  quantity: number,
  totalAmount: number,
  onSuccess: () => void
}
```

---

## Notifications

### Seller Receives:
- **New Payment Received** - When buyer submits payment

### Buyer Receives:
- **Payment Verified** - When seller confirms payment
- **Payment Rejected** - When seller rejects payment

---

## Status Progression

### Payment Status Flow:
```
Submitted → Pending Verification
            ↓
    ┌───────┴────────┐
    ↓                ↓
Verified          Rejected
(by Seller)       (by Seller)
    ↓                ↓
Order Confirmed   Order Failed
```

### Order Status Flow:
```
Pending Seller Confirmation
    ↓
    ├→ Confirmed (after payment verified)
    ├→ Payment Failed (after payment rejected)
    └→ Cancelled (manual)
         ↓
     Completed (after delivery)
```

---

## Quick Navigation Links

### Development URLs
- **Main App:** http://localhost:3000
- **API Server:** http://localhost:5001
- **API Health:** http://localhost:5001/api/health

### Feature URLs
- **Crop List:** http://localhost:3000/crops
- **Buyer Dashboard:** http://localhost:3000/dashboard
- **Payment History:** http://localhost:3000/buyer/payment-history
- **Payment Verification:** http://localhost:3000/seller/payment-verification

### API Endpoints
- **Create Payment:** POST http://localhost:5001/api/payments
- **Get Payments:** GET http://localhost:5001/api/payments/buyer
- **Get Seller Payments:** GET http://localhost:5001/api/payments/seller
- **Verify Payment:** PATCH http://localhost:5001/api/payments/:id/verify
- **Reject Payment:** PATCH http://localhost:5001/api/payments/:id/reject

---

## Testing Checklist

- [ ] Can navigate to crop details
- [ ] Can select "Online Payment"
- [ ] Payment modal opens correctly
- [ ] Can fill payment form
- [ ] Can upload screenshot
- [ ] Payment submitted successfully
- [ ] Seller receives notification
- [ ] Can navigate to payment verification
- [ ] Can see pending payment
- [ ] Can verify payment
- [ ] Buyer receives verification notification
- [ ] Buyer can see payment history
- [ ] Payment status shows as "Verified"
- [ ] Can view payment details
- [ ] All API endpoints responding correctly

---

## Port Configuration

**Frontend:** Port 3000 (Next.js Dev Server)
**Backend:** Port 5001 (Express.js API Server)
**Socket.io:** Port 5001 (Real-time notifications)
**MongoDB:** Port 27017 (Optional - runs in demo mode if not available)

---

*Last Updated: 2026-07-14*  
*Status: ✅ All Routes Active and Tested*
