// Local payment simulator flow (no Razorpay keys) — also covers failed-payment handling
const { request, startDb, stopDb, seedAll, app, registerCustomer, address } = require('./helpers');
const Product = require('../src/models/Product');

beforeAll(async () => { await startDb('paymock'); await seedAll(); });
afterAll(stopDb);

test('online order stays pending until paid; failure then retry success', async () => {
  const agent = request.agent(app());
  await registerCustomer(agent);
  const p = (await request(app()).get('/api/products/orange')).body.product;
  await agent.post('/api/cart').send({ kind: 'product', productId: p._id, variantId: p.variants[0]._id, qty: 1 });
  const before = (await Product.findById(p._id)).stock;

  const cfg = await request(app()).get('/api/payments/config');
  expect(cfg.body.mode).toBe('mock');

  const o = await agent.post('/api/orders').send({ address, paymentMethod: 'razorpay' });
  expect(o.body.order.status).toBe('pending');
  expect((await Product.findById(p._id)).stock).toBe(before); // not reserved before payment
  const orderId = o.body.order._id;

  const s1 = await agent.post('/api/payments/create').send({ orderId });
  expect(s1.status).toBe(201);
  const fail = await agent.post('/api/payments/verify').send({ provider: 'mock', orderId, providerOrderId: s1.body.payment.providerOrderId, outcome: 'failed' });
  expect(fail.status).toBe(402);
  let detail = await agent.get(`/api/orders/${orderId}`);
  expect(detail.body.order.paymentStatus).toBe('failed');
  expect((await agent.get('/api/cart')).body.cart.lines).toHaveLength(1); // cart kept for retry

  const s2 = await agent.post('/api/payments/create').send({ orderId });
  const ok = await agent.post('/api/payments/verify').send({ provider: 'mock', orderId, providerOrderId: s2.body.payment.providerOrderId, outcome: 'success' });
  expect(ok.status).toBe(200);
  expect(ok.body.order.status).toBe('confirmed');
  expect(ok.body.order.paymentStatus).toBe('paid');
  expect((await Product.findById(p._id)).stock).toBe(before - 6);
  expect((await agent.get('/api/cart')).body.cart.lines).toHaveLength(0);

  // cannot pay twice
  expect((await agent.post('/api/payments/create').send({ orderId })).status).toBe(400);
});
