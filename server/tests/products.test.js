const { request, startDb, stopDb, seedAll, app, login, registerCustomer } = require('./helpers');

let adminAgent;
beforeAll(async () => {
  await startDb('products');
  await seedAll();
  adminAgent = request.agent(app());
  await login(adminAgent, 'admin@test.popsyy', 'Admin@12345');
});
afterAll(stopDb);

const newProduct = {
  name: 'Mango Chilli', flavour: 'mango-chilli', tagline: 'Sweet. Spicy. Unhinged.', description: 'Test',
  colors: { from: '#FFD600', to: '#FF3D00' }, stock: 300,
  variants: [{ name: 'Pack of 6', packSize: 6, sku: 'PSY-MAN-06', price: 229, mrp: 260, isDefault: true }, { name: 'Pack of 12', packSize: 12, sku: 'PSY-MAN-12', price: 429, mrp: 520 }],
};

describe('Products', () => {
  test('lists seeded products with variants', async () => {
    const res = await request(app()).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(4);
    expect(res.body.products[0].variants.length).toBe(3);
  });

  test('filters by flavour and sorts by price', async () => {
    const res = await request(app()).get('/api/products?flavour=kala-khatta');
    expect(res.body.products.map((p) => p.slug)).toEqual(['kala-khatta']);
    const sorted = await request(app()).get('/api/products?sort=price-desc');
    expect(sorted.body.products[0].slug).toBe('cranberry');
  });

  test('search works and regex input is escaped', async () => {
    const res = await request(app()).get('/api/products?search=lime');
    expect(res.body.products[0].slug).toBe('lemon-lime');
    const weird = await request(app()).get('/api/products?search=.*(');
    expect(weird.status).toBe(200);
    expect(weird.body.products).toHaveLength(0);
  });

  test('get by slug returns related products', async () => {
    const res = await request(app()).get('/api/products/orange');
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe('Orange');
    expect(res.body.related.length).toBeGreaterThan(0);
    expect((await request(app()).get('/api/products/nope')).status).toBe(404);
  });

  test('customers cannot create products (admin authorization)', async () => {
    const agent = request.agent(app());
    await registerCustomer(agent);
    expect((await agent.post('/api/admin/products').send(newProduct)).status).toBe(403);
    expect((await request(app()).post('/api/admin/products').send(newProduct)).status).toBe(401);
    expect((await agent.get('/api/admin/dashboard')).status).toBe(403);
  });

  test('admin CRUD lifecycle', async () => {
    const created = await adminAgent.post('/api/admin/products').send(newProduct);
    expect(created.status).toBe(201);
    const id = created.body.product._id;
    expect(created.body.product.slug).toBe('mango-chilli');
    expect(created.body.product.stock).toBe(300);
    expect(created.body.product.price).toBe(229);

    const upd = await adminAgent.put(`/api/admin/products/${id}`).send({ tagline: 'New tagline', stock: 250 });
    expect(upd.status).toBe(200);
    expect(upd.body.product.tagline).toBe('New tagline');
    expect(upd.body.product.stock).toBe(250);

    const off = await adminAgent.patch(`/api/admin/products/${id}/toggle`).send({ isActive: false });
    expect(off.body.product.isActive).toBe(false);
    expect((await request(app()).get('/api/products/mango-chilli')).status).toBe(404);

    const del = await adminAgent.delete(`/api/admin/products/${id}`);
    expect(del.status).toBe(200);
    expect((await adminAgent.get(`/api/admin/products/${id}`)).status).toBe(404);
  });

  test('invalid product payload is rejected', async () => {
    const res = await adminAgent.post('/api/admin/products').send({ name: 'X' });
    expect(res.status).toBe(422);
  });
});
