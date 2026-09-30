const { request, startDb, stopDb, seedAll, app, registerCustomer } = require('./helpers');

beforeAll(async () => { await startDb('auth'); await seedAll(); });
afterAll(stopDb);

describe('Authentication', () => {
  test('register sets an http-only cookie and returns the user without password', async () => {
    const agent = request.agent(app());
    const res = await agent.post('/api/auth/register').send({ name: 'Riya', email: 'riya@test.in', password: 'Secret123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('riya@test.in');
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie'].join(';')).toMatch(/popsyy_token=.*HttpOnly/i);
    const me = await agent.get('/api/auth/me');
    expect(me.body.user.email).toBe('riya@test.in');
  });

  test('duplicate email is rejected', async () => {
    const res = await request(app()).post('/api/auth/register').send({ name: 'Riya', email: 'riya@test.in', password: 'Secret123' });
    expect(res.status).toBe(409);
  });

  test('weak password is rejected by validation', async () => {
    const res = await request(app()).post('/api/auth/register').send({ name: 'Weak', email: 'weak@test.in', password: 'short' });
    expect(res.status).toBe(422);
  });

  test('login with wrong password fails, right password works', async () => {
    const bad = await request(app()).post('/api/auth/login').send({ email: 'riya@test.in', password: 'Wrong1234' });
    expect(bad.status).toBe(401);
    const ok = await request(app()).post('/api/auth/login').send({ email: 'riya@test.in', password: 'Secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
  });

  test('NoSQL injection in login body is neutralised', async () => {
    const res = await request(app()).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect([401, 422]).toContain(res.status);
  });

  test('forgot + reset password flow', async () => {
    const f = await request(app()).post('/api/auth/forgot-password').send({ email: 'riya@test.in' });
    expect(f.status).toBe(200);
    const token = f.body._testToken;
    expect(token).toBeTruthy();
    const r = await request(app()).post('/api/auth/reset-password').send({ token, password: 'NewSecret123' });
    expect(r.status).toBe(200);
    const again = await request(app()).post('/api/auth/reset-password').send({ token, password: 'NewSecret123' });
    expect(again.status).toBe(400); // single use
    const ok = await request(app()).post('/api/auth/login').send({ email: 'riya@test.in', password: 'NewSecret123' });
    expect(ok.status).toBe(200);
  });

  test('forgot password does not reveal whether an email exists', async () => {
    const res = await request(app()).post('/api/auth/forgot-password').send({ email: 'nobody@test.in' });
    expect(res.status).toBe(200);
  });

  test('change password requires current password', async () => {
    const agent = request.agent(app());
    await registerCustomer(agent, 'change@test.in');
    const bad = await agent.put('/api/auth/change-password').send({ currentPassword: 'nope', newPassword: 'Another123' });
    expect(bad.status).toBe(400);
    const ok = await agent.put('/api/auth/change-password').send({ currentPassword: 'Secret123', newPassword: 'Another123' });
    expect(ok.status).toBe(200);
  });

  test('blocked user cannot log in', async () => {
    const User = require('../src/models/User');
    await registerCustomer(request.agent(app()), 'blocked@test.in');
    await User.updateOne({ email: 'blocked@test.in' }, { isBlocked: true });
    const res = await request(app()).post('/api/auth/login').send({ email: 'blocked@test.in', password: 'Secret123' });
    expect(res.status).toBe(403);
  });
});
