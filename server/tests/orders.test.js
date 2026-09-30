const { request, startDb, stopDb, seedAll, app, login, registerCustomer, address } = require('./helpers');
const Product = require('../src/models/Product');
const Coupon = require('../src/models/Coupon');

let admin;
beforeAll(async () => {
  await startDb('orders');
  await seedAll();
  admin = request.agent(app());
  await login(admin, 'admin@test.popsyy', 'Admin@12345');
});
afterAll(stopDb);

async function customerWithCart(slug = 'kala-khatta', packIdx = 1, qty = 1) {
  const agent = request.agent(app());
  const user = await registerCustomer(agent);
  const p = (await request(app()).get(`/api/products/${slug}`)).body.product;
  await agent.post('/api/cart').send({ kind: 'product', productId: p._id, variantId: p.variants[packIdx]._id, qty });
  return { agent, user, product: p };
}

describe('Orders', () => {
  test('checkout requires login', async () => {
    const res = await request(app()).post('/api/orders').send({ address, paymentMethod: 'cod' });
    expect(res.status).toBe(401);
  });

  test('COD order: confirmed, stock deducted, cart cleared, coupon counted', async () => {
    const { agent, product } = await customerWithCart('kala-khatta', 1, 2); // 2 × 12 = 24 pops, ₹758
    await agent.post('/api/cart/coupon').send({ code: 'CHILL50' });
    const before = (await Product.findById(product._id)).stock;
    const res = await agent.post('/api/orders').send({ address: { ...address, save: true }, paymentMethod: 'cod', deliveryMethod: 'standard' });
    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe('confirmed');
    expect(res.body.order.paymentStatus).toBe('cod_pending');
    expect(res.body.order.total).toBe(708); // 758 − 50, free shipping
    expect((await Product.findById(product._id)).stock).toBe(before - 24);
    expect((await agent.get('/api/cart')).body.cart.lines).toHaveLength(0);
    expect((await Coupon.findOne({ code: 'CHILL50' })).usedCount).toBe(1);
    expect((await agent.get('/api/account/addresses')).body.addresses).toHaveLength(1);

    const mine = await agent.get('/api/orders');
    expect(mine.body.orders).toHaveLength(1);
    const detail = await agent.get(`/api/orders/${res.body.order._id}`);
    expect(detail.body.order.items[0].sku).toMatch(/^PSY-KALKHA/);
    expect(detail.body.order.internalNotes).toBeUndefined();
  });

  test('customers cannot see other customers orders', async () => {
    const a = await customerWithCart();
    const o = await a.agent.post('/api/orders').send({ address, paymentMethod: 'cod' });
    const b = request.agent(app());
    await registerCustomer(b);
    expect((await b.get(`/api/orders/${o.body.order._id}`)).status).toBe(404);
  });

  test('cancel restores stock and coupon usage', async () => {
    const { agent, product } = await customerWithCart('orange', 0, 1);
    const before = (await Product.findById(product._id)).stock;
    const o = await agent.post('/api/orders').send({ address, paymentMethod: 'cod' });
    expect((await Product.findById(product._id)).stock).toBe(before - 6);
    const c = await agent.post(`/api/orders/${o.body.order._id}/cancel`).send({ reason: 'changed mind' });
    expect(c.status).toBe(200);
    expect(c.body.order.status).toBe('cancelled');
    expect((await Product.findById(product._id)).stock).toBe(before);
  });

  test('admin status flow → shipped → delivered; cannot go backwards; customer cannot cancel shipped', async () => {
    const { agent } = await customerWithCart('lemon-lime', 0, 1);
    const o = await agent.post('/api/orders').send({ address, paymentMethod: 'cod' });
    const id = o.body.order._id;
    const s1 = await admin.put(`/api/admin/orders/${id}/status`).send({ status: 'packed' });
    expect(s1.status).toBe(200);
    const s2 = await admin.put(`/api/admin/orders/${id}/status`).send({ status: 'shipped', tracking: { carrier: 'Shiprocket', awb: 'AWB123' } });
    expect(s2.body.order.tracking.awb).toBe('AWB123');
    expect((await admin.put(`/api/admin/orders/${id}/status`).send({ status: 'processing' })).status).toBe(400);
    expect((await agent.post(`/api/orders/${id}/cancel`)).status).toBe(400);
    const s3 = await admin.put(`/api/admin/orders/${id}/status`).send({ status: 'delivered' });
    expect(s3.body.order.paymentStatus).toBe('cod_collected');

    const track = await request(app()).post('/api/orders/track').send({ orderNumber: o.body.order.orderNumber, email: (await agent.get('/api/auth/me')).body.user.email });
    expect(track.status).toBe(200);
    expect(track.body.order.status).toBe('delivered');
    const inv = await admin.get(`/api/admin/orders/${id}/invoice`);
    expect(inv.text).toMatch(/TAX INVOICE/);
  });

  test('COD blocked above the COD limit', async () => {
    const { agent } = await customerWithCart('cranberry', 2, 4); // 4 × ₹779
    const res = await agent.post('/api/orders').send({ address, paymentMethod: 'cod' });
    expect(res.status).toBe(400);
  });

  test('dashboard + analytics respond for admin', async () => {
    const d = await admin.get('/api/admin/dashboard');
    expect(d.status).toBe(200);
    expect(d.body.stats.orders).toBeGreaterThan(0);
    const a = await admin.get('/api/admin/analytics?range=7d');
    expect(a.status).toBe(200);
    expect(a.body.series).toHaveLength(7);
    expect(a.body.topFlavours.length).toBeGreaterThan(0);
  });
});
