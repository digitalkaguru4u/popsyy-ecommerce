const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }
  if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.type === 'entity.too.large') { status = 413; message = 'Payload too large'; }
  if (err.name === 'MulterError') { status = 400; }

  if (status >= 500 && !env.isTest) console.error('[error]', err);
  res.status(status).json({
    success: false,
    message: status >= 500 && env.isProd ? 'Something went wrong. Please try again.' : message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
