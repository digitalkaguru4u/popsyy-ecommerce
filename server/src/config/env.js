const path = require('path');
require('dotenv').config({ path: process.env.DOTENV_PATH || path.resolve(__dirname, '../../.env'), quiet: true });

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function required(name, fallback) {
  const v = process.env[name];
  if (v) return v;
  if (isProd && fallback === undefined) throw new Error(`Missing required env var ${name}`);
  return fallback;
}

const env = {
  isProd,
  isTest,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/popsyy'),
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-insecure-jwt-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  serverUrl: (process.env.SERVER_URL || 'http://localhost:5000').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  // Mock gateway = local test simulator. Never allowed in production.
  paymentMock: !isProd && (process.env.PAYMENT_MOCK === 'true' || (!process.env.RAZORPAY_KEY_ID && process.env.PAYMENT_MOCK !== 'false')),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'POPSYY <hello@popsyy.in>',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@popsyy.in',
    password: process.env.ADMIN_PASSWORD || (isProd ? '' : 'Admin@12345'),
    name: process.env.ADMIN_NAME || 'POPSYY Admin',
  },

  commerce: {
    currency: 'INR',
    freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 499),
    standardShipping: Number(process.env.STANDARD_SHIPPING_FEE || 49),
    expressShipping: Number(process.env.EXPRESS_SHIPPING_FEE || 99),
    codFee: Number(process.env.COD_FEE || 0),
    codMaxOrder: Number(process.env.COD_MAX_ORDER || 3000),
    gstRate: Number(process.env.GST_RATE || 5), // % — prices are GST-inclusive
    lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD || 50),
  },
};

module.exports = env;
