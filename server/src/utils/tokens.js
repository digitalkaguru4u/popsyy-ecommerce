const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const COOKIE_NAME = 'popsyy_token';
const GUEST_COOKIE = 'popsyy_guest';

const signToken = (user) => jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

const baseCookie = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: '/',
});

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...baseCookie(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, baseCookie());
}
function setGuestCookie(res, id) {
  res.cookie(GUEST_COOKIE, id, { ...baseCookie(), maxAge: 30 * 24 * 60 * 60 * 1000 });
}
function clearGuestCookie(res) {
  res.clearCookie(GUEST_COOKIE, baseCookie());
}

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  COOKIE_NAME, GUEST_COOKIE, signToken, verifyToken, setAuthCookie, clearAuthCookie,
  setGuestCookie, clearGuestCookie, hashToken, randomToken,
};
