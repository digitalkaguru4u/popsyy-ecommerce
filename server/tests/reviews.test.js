const { request, startDb, stopDb, seedAll, app, login, registerCustomer } = require('./helpers');

beforeAll(async () => { await startDb('reviews'); await seedAll(); });
afterAll(stopDb);

test('customer review is pending until approved; approval updates rating; XSS stripped', async () => {
  const agent = request.agent(app());
  await registerCustomer(agent);
  const p = (await request(app()).get('/api/products/cranberry')).body.product;
  const before = p.ratingCount;
  const r = await agent.post('/api/reviews').send({ productId: p._id, rating: 1, title: '<script>alert(1)</script>Meh', body: 'Not my thing <img src=x onerror=alert(1)>' });
  expect(r.status).toBe(201);
  expect(r.body.review.status).toBe('pending');
  expect(r.body.review.title).not.toMatch(/<script>/);
  expect(r.body.review.body).not.toMatch(/onerror/);
  expect((await agent.post('/api/reviews').send({ productId: p._id, rating: 5, body: 'again!!' })).status).toBe(409);

  const admin = request.agent(app());
  await login(admin, 'admin@test.popsyy', 'Admin@12345');
  const mod = await admin.put(`/api/admin/reviews/${r.body.review._id}`).send({ status: 'approved' });
  expect(mod.status).toBe(200);
  const after = (await request(app()).get('/api/products/cranberry')).body.product;
  expect(after.ratingCount).toBe(before + 1);
  const list = await request(app()).get(`/api/reviews?product=${p._id}`);
  expect(list.body.distribution.find((d) => d.rating === 1).count).toBe(1);
});
