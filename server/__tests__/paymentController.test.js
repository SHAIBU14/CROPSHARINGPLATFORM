const jwt = require('jsonwebtoken');
const request = require('supertest');
const { app } = require('../index');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key';

describe('payment controller demo fallback', () => {
  it('creates a payment response without requiring a MongoDB connection', async () => {
    const token = jwt.sign({ userId: '6' }, JWT_SECRET, { expiresIn: '7d' });
    const transactionId = `demo-transaction-${Date.now()}`;

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .field('sellerId', '6')
      .field('cropId', '1783865273430')
      .field('quantity', '2')
      .field('totalAmount', '100')
      .field('paymentApp', 'Google Pay')
      .field('paymentDate', '2026-07-12')
      .field('transactionId', transactionId)
      .field('notes', 'demo payment');

    expect(res.status).toBe(201);
    expect(res.body.payment).toBeDefined();
    expect(res.body.purchaseOrder).toBeDefined();
  });
});
