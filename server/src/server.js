const env = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/db');
const { expireStalePendingOrders } = require('./services/order.service');
const paymentService = require('./services/payment.service');

async function start() {
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`[api] POPSYY API on :${env.port} (${env.nodeEnv}) · payments: ${paymentService.mode()}`);
    if (paymentService.mode() === 'mock') console.log('[api] ⚠ Razorpay keys not set — using the LOCAL PAYMENT SIMULATOR (dev only).');
  });
  // housekeeping: close abandoned online checkouts every hour
  const timer = setInterval(() => expireStalePendingOrders().catch((e) => console.error('[cron]', e.message)), 60 * 60 * 1000);
  const shutdown = () => { clearInterval(timer); server.close(() => process.exit(0)); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('[api] failed to start', err);
  process.exit(1);
});
