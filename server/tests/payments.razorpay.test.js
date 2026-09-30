// Razorpay integration with a stubbed SDK client (no network)
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

const crypto = require('crypto');

const mockRzpState = { payments: {} };
const mockRzpClient = {
  orders: { create: jest.fn(async ({ amount }) => ({ id: `order_${crypto.randomBytes(5).toString('hex')}`, amount })) },
  payments: {
    fetch: jest.fn(async (id) => mockRzpState.payments[id]),
    capture: jest.fn(async () => ({ status: 'captured' })),
    refund: jest.fn(async (id, { amount }) => ({ id: `rfnd_${id}`, amount, status: 'processed' })),
  },
};
jest.mock('../src/config/razorpay', () => ({ getRazorpay: () => mockRzpClient, razorpayEnabled: () => true }));

const { request, startDb, stopDb, seedAll, app, registerCustomer, address, login } = require('./helpers');

const sign = (orderId, paymentId) => crypto.createHmac('sha256', 'test_key_secret').update(`${orderId}|${paymentId}`).digest('hex');

beforeAll(async () => { await startDb('payrzp'); await seedAll(); });
afterAll(stopDb);

async function pendingOrder() {
  const agent = request.agent(app());
  await registerCustomer(agent);
  const p = (await request(app()).get('/api/products/lemon-lime')).body.product;
  await agent.post('/api/cart').send({ kind: 'product', productId: p._id, variantId: p.variants[1]._id, qty: 1 });
  const o = await agent.post('/api/orders').send({ address, paymentMethod: 'razorpay' });
  const s = await agent.post('/api/payments/create').send({ orderId: o.body.order._id });
  return { agent, order: o.body.order, session: s.body.payment };
}

describe('Razorpay verification', () => {
  test('create returns key + Razorpay order in paise', async () => {
    const { session, order } = await pendingOrder();
    expect(session.provider).toBe('razorpay');
    expect(session.keyId).toBe('rzp_test_dummy');
    expect(session.amount).toBe(Math.round(order.total * 100));
  });

  test('tampered signature is rejected and payment marked failed', async () => {
    const { agent, order, session } = await pendingOrder();
    const res = await agent.post('/api/payments/verify').send({ orderId: order._id, razorpay_order_id: session.providerOrderId, razorpay_payment_id: 'pay_fake1', razorpay_signature: 'deadbeef'.repeat(8) });
    expect(res.status).toBe(400);
    const d = await agent.get(`/api/orders/${order._id}`);
    expect(d.body.order.paymentStatus).toBe('failed');
    expect(d.body.order.status).toBe('pending');
  });

  test('valid signature + captured payment confirms order; amount mismatch rejected', async () => {
    const { agent, order, session } = await pendingOrder();
    mockRzpState.payments.pay_bad = { id: 'pay_bad', amount: 100, status: 'captured', method: 'upi' };
    const mismatch = await agent.post('/api/payments/verify').send({ orderId: order._id, razorpay_order_id: session.providerOrderId, razorpay_payment_id: 'pay_bad', razorpay_signature: sign(session.providerOrderId, 'pay_bad') });
    expect(mismatch.status).toBe(400);

    const s2 = (await agent.post('/api/payments/create').send({ orderId: order._id })).body.payment;
    mockRzpState.payments.pay_ok = { id: 'pay_ok', amount: s2.amount, status: 'authorized', method: 'upi' };
    const ok = await agent.post('/api/payments/verify').send({ orderId: order._id, razorpay_order_id: s2.providerOrderId, razorpay_payment_id: 'pay_ok', razorpay_signature: sign(s2.providerOrderId, 'pay_ok') });
    expect(ok.status).toBe(200);
    expect(ok.body.order.paymentStatus).toBe('paid');
    expect(mockRzpClient.payments.capture).toHaveBeenCalled(); // authorized → captured server-side
  });

  test('webhook: bad signature rejected, payment.captured confirms order idempotently', async () => {
    const { agent, order, session } = await pendingOrder();
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_wh', order_id: session.providerOrderId, amount: session.amount, method: 'card', status: 'captured' } } } });
    const bad = await request(app()).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', 'nope').send(body);
    expect(bad.status).toBe(400);
    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(body).digest('hex');
    const ok = await request(app()).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', sig).send(body);
    expect(ok.status).toBe(200);
    const again = await request(app()).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', sig).send(body);
    expect(again.status).toBe(200);
    const d = await agent.get(`/api/orders/${order._id}`);
    expect(d.body.order.status).toBe('confirmed');
    expect(d.body.order.paymentStatus).toBe('paid');
    expect(d.body.order.statusHistory.filter((h) => h.status === 'confirmed')).toHaveLength(1);
  });

  test('admin cancelling a paid order triggers a Razorpay refund', async () => {
    const { order, session } = await pendingOrder();
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_rf', order_id: session.providerOrderId, amount: session.amount, method: 'upi' } } } });
    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(body).digest('hex');
    await request(app()).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', sig).send(body);
    const admin = request.agent(app());
    await login(admin, 'admin@test.popsyy', 'Admin@12345');
    const res = await admin.put(`/api/admin/orders/${order._id}/status`).send({ status: 'cancelled', note: 'Out of delivery zone' });
    expect(res.status).toBe(200);
    expect(res.body.order.paymentStatus).toBe('refunded');
    expect(mockRzpClient.payments.refund).toHaveBeenCalledWith('pay_rf', expect.objectContaining({ amount: session.amount }));
  });
});
