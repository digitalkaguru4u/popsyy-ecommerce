const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (windowMs, max) =>
  rateLimit({
    windowMs, max, standardHeaders: 'draft-7', legacyHeaders: false,
    skip: () => env.isTest,
    message: { success: false, message: 'Too many requests — chill for a bit and try again.' },
  });

// Production defaults; override with RATE_LIMIT_API / RATE_LIMIT_AUTH. Dev is relaxed so local QA isn't throttled.
const n = (v, prod, dev) => Number(v) || (env.isProd ? prod : dev);
module.exports = {
  apiLimiter: make(15 * 60 * 1000, n(process.env.RATE_LIMIT_API, 600, 20000)),
  authLimiter: make(15 * 60 * 1000, n(process.env.RATE_LIMIT_AUTH, 30, 2000)),
  strictLimiter: make(60 * 60 * 1000, n(process.env.RATE_LIMIT_STRICT, 10, 1000)),
};
