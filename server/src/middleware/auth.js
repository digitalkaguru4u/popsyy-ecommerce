const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken, COOKIE_NAME } = require('../utils/tokens');
const User = require('../models/User');

function extractToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

async function loadUser(token) {
  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user) return null;
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) return null;
  return user;
}

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError('Please log in to continue', 401);
  let user;
  try {
    user = await loadUser(token);
  } catch {
    throw new AppError('Session expired — please log in again', 401);
  }
  if (!user) throw new AppError('Session expired — please log in again', 401);
  if (user.isBlocked) throw new AppError('This account has been blocked. Contact support.', 403);
  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const user = await loadUser(token);
      if (user && !user.isBlocked) req.user = user;
    } catch { /* ignore invalid token for optional routes */ }
  }
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError('You do not have permission to do that', 403));
  next();
};

module.exports = { protect, optionalAuth, requireRole, requireAdmin: requireRole('admin') };
