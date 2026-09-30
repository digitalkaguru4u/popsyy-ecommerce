const crypto = require('crypto');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `POP-${ts}${rand}`;
}

function escapeRegex(s = '') {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function slugify(s = '') {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

module.exports = { round2, generateOrderNumber, escapeRegex, paginate, slugify };
