const { request, startDb, stopDb, seedAll, app, login, registerCustomer } = require('./helpers');

let products;
beforeAll(async () => {
  await startDb('cart');
  await seedAll();
  products = (await request(app()).get('/api/products')).body.products;
});
afterAll(stopDb);

const bySlug = (s) => products.find((p) => p.slug === s);
const variant = (s, size) => bySlug(s).variants.find((v) => v.packSize === size);

describe('Cart', () => {
  test('guest can add products; prices come from the server', async () => {
    const agent = request.agent(app());
    const p = bySlug('orange');
    const res = await agent.post('/api/cart').send({ kind: 'product', productId: p._id, variantId: variant('orange', 6)._id, qty: 2, price: 1 });
    expect(res.status).toBe(201);
    expect(res.body.cart.subtotal).toBe(398);
    expect(res.headers['set-cookie'].join(';')).toMatch(/popsyy_guest=/);
    // adding again merges quantity
    const again = await agent.post('/api/cart').send({ kind: 'product', productId: p._id, variantId: variant('orange', 6)._id, qty: 1 });
    expect(again.body.cart.lines).toHaveLength(1);
    expect(again.body.cart.lines[0].qty).toBe(3);
  });

  test('shipping is free above the threshold', async () => {
    const agent = request.agent(app());
    const small = await agent.post('/api/cart').send({ kind: 'product', productId: bySlug('orange')._id, variantId: variant('orange', 6)._id, qty: 1 });
    expect(small.body.cart.shippingFee).toBe(49);
    expect(small.body.cart.freeShipping.remaining).toBe(300);
    const big = await agent.post('/api/cart').send({ kind: 'product', productId: bySlug('orange')._id, variantId: variant('orange', 12)._id, qty: 1 });
    expect(big.body.cart.shippingFee).toBe(0);
  });

  test('cannot add more than stock', async () => {
    const agent = request.agent(app());
    const res = await agent.post('/api/cart').send({ kind: 'product', productId: bySlug('cranberry')._id, variantId: variant('cranberry', 24)._id, qty: 50 });
    expect(res.status).toBe(409);
  });

  test('build-your-box must add up to the box size', async () => {
    const agent = request.agent(app());
    const bad = await agent.post('/api/cart').send({ kind: 'box', size: 6, selections: [{ productId: bySlug('orange')._id, qty: 2 }] });
    expect(bad.status).toBe(422);
    const ok = await agent.post('/api/cart').send({
      kind: 'box', size: 6,
      selections: [{ productId: bySlug('orange')._id, qty: 2 }, { productId: bySlug('kala-khatta')._id, qty: 4 }],
    });
    expect(ok.status).toBe(201);
    expect(ok.body.cart.lines[0].kind).toBe('box');
    expect(ok.body.cart.subtotal).toBe(199);
    expect(ok.body.cart.pops).toBe(6);
  });

  test('update and remove lines', async () => {
    const agent = request.agent(app());
    const add = await agent.post('/api/cart').send({ kind: 'product', productId: bySlug('lemon-lime')._id, variantId: variant('lemon-lime', 6)._id, qty: 1 });
    const lineId = add.body.cart.lines[0]._id;
    const upd = await agent.put(`/api/cart/${lineId}`).send({ qty: 4 });
    expect(upd.body.cart.lines[0].qty).toBe(4);
    const del = await agent.delete(`/api/cart/${lineId}`);
    expect(del.body.cart.lines).toHaveLength(0);
  });

  test('coupon validation: min order, valid code, unknown code', async () => {
    const agent = request.agent(app());
    await agent.post('/api/cart').send({ kind: 'product', productId: bySlug('orange')._id, variantId: variant('orange', 6)._id, qty: 1 });
    expect((await agent.post('/api/cart/coupon').send({ code: 'CHILL50' })).status).toBe(400); // min ₹499
    expect((await agent.post('/api/cart/coupon').send({ code: 'NOPE' })).status).toBe(404);
    const ok = await agent.post('/api/cart/coupon').send({ code: 'popfirst' });
    expect(ok.status).toBe(200);
    expect(ok.body.cart.discount).toBe(29.85); // 15% of 199
    expect(ok.body.cart.couponValid).toBe(true);
  });

  test('guest cart merges into account on login', async () => {
    const agent = request.agent(app());
    const email = `merge${Date.now()}@test.in`;
    await registerCustomer(request.agent(app()), email);
    await agent.post('/api/cart').send({ kind: 'product', productId: bySlug('orange')._id, variantId: variant('orange', 6)._id, qty: 2 });
    await login(agent, email, 'Secret123');
    const cart = await agent.get('/api/cart');
    expect(cart.body.cart.lines).toHaveLength(1);
    expect(cart.body.cart.lines[0].qty).toBe(2);
  });
});
