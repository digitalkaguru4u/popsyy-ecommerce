const { request, startDb, stopDb, seedAll, app, login } = require('./helpers');
const { computeDiscount } = require('../src/services/coupon.service');

let admin;
beforeAll(async () => {
  await startDb('coupons');
  await seedAll();
  admin = request.agent(app());
  await login(admin, 'admin@test.popsyy', 'Admin@12345');
});
afterAll(stopDb);

describe('Coupon maths', () => {
  test('percentage with cap', () => {
    expect(computeDiscount({ discountType: 'percentage', value: 20, maxDiscount: 100 }, 1000)).toBe(100);
    expect(computeDiscount({ discountType: 'percentage', value: 20, maxDiscount: 0 }, 1000)).toBe(200);
  });
  test('fixed never exceeds subtotal', () => {
    expect(computeDiscount({ discountType: 'fixed', value: 500 }, 300)).toBe(300);
  });
});

describe('Coupon admin + validation', () => {
  test('admin creates, customers see expiry/limits enforced', async () => {
    const past = await admin.post('/api/admin/coupons').send({ code: 'OLDPOP', discountType: 'fixed', value: 20, expiresAt: '2020-01-01' });
    expect(past.status).toBe(201);
    const bad = await admin.post('/api/admin/coupons').send({ code: 'BAD', discountType: 'percentage', value: 150 });
    expect(bad.status).toBe(422);

    const agent = request.agent(app());
    const p = (await request(app()).get('/api/products/orange')).body.product;
    await agent.post('/api/cart').send({ kind: 'product', productId: p._id, variantId: p.variants[0]._id, qty: 1 });
    const res = await agent.post('/api/cart/coupon').send({ code: 'OLDPOP' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);

    await admin.post('/api/admin/coupons').send({ code: 'MAXED', discountType: 'fixed', value: 20, usageLimit: 1 });
    const Coupon = require('../src/models/Coupon');
    await Coupon.updateOne({ code: 'MAXED' }, { usedCount: 1 });
    expect((await agent.post('/api/cart/coupon').send({ code: 'MAXED' })).status).toBe(400);

    await admin.post('/api/admin/coupons').send({ code: 'OFFPOP', discountType: 'fixed', value: 20, isActive: false });
    expect((await agent.post('/api/cart/coupon').send({ code: 'OFFPOP' })).status).toBe(404);
  });
});
