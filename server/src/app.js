const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const env = require('./config/env');
const sanitize = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');
const asyncHandler = require('./utils/asyncHandler');
const paymentController = require('./controllers/payment.controller');
const seo = require('./controllers/seo.controller');
const { LOCAL_DIR } = require('./services/upload.service');

const app = express();
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // CSP matters when this server also serves the SPA (SERVE_CLIENT=true): allow Razorpay Checkout, Google Fonts, Cloudinary
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
      frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", 'https://api.razorpay.com'],
    },
  },
}));
app.use(cors({
  origin(origin, cb) {
    if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(compression());
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Razorpay webhook needs the exact raw body for HMAC verification — mount BEFORE json parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), asyncHandler(paymentController.webhook));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(sanitize);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', env: env.nodeEnv }));
app.get('/sitemap.xml', asyncHandler(seo.sitemap));
app.get('/robots.txt', seo.robots);
app.use('/uploads', express.static(LOCAL_DIR, { maxAge: '30d', immutable: true }));

app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/account', require('./routes/account.routes'));
app.use('/api/content', require('./routes/content.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Optional: serve the built client from the same server (single-host deploys)
if (process.env.SERVE_CLIENT === 'true') {
  const dist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(dist, { maxAge: '1y', index: false, setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use('/api', notFound);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
