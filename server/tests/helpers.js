/* Shared test harness. Uses TEST_MONGODB_URI if set, otherwise mongodb-memory-server if installed. */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_EMAIL = 'admin@test.popsyy';
process.env.ADMIN_PASSWORD = 'Admin@12345';

const mongoose = require('mongoose');
const request = require('supertest');

let memoryServer;
async function startDb(name) {
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
    } catch {
      uri = 'mongodb://127.0.0.1:27017/';
    }
  }
  await mongoose.connect(uri, { dbName: `popsyy_test_${name}` });
  await mongoose.connection.db.dropDatabase();
}

async function stopDb() {
  await mongoose.connection.db.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

async function seedAll() {
  const { seed } = require('../src/seed/seed');
  return seed({ fresh: false, samples: true, log: () => {} });
}

const app = () => require('../src/app');

async function login(agent, email, password) {
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

async function registerCustomer(agent, email = `u${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.in`) {
  const res = await agent.post('/api/auth/register').send({ name: 'Test Popper', email, password: 'Secret123', phone: '9876543210' });
  if (res.status !== 201) throw new Error(`register failed ${res.status} ${JSON.stringify(res.body)}`);
  return { ...res.body, email };
}

const address = { name: 'Test Popper', phone: '9876543210', line1: '1 Test Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' };

module.exports = { request, startDb, stopDb, seedAll, app, login, registerCustomer, address, mongoose };
