const { filterXSS } = require('xss');

// Strip Mongo operator keys ($ / .) and HTML from every incoming string.
// Admin long-form CMS fields are plain text rendered by React (escaped), so stripping tags everywhere is safe.
function clean(value, depth = 0) {
  if (depth > 10) return undefined;
  if (typeof value === 'string') return filterXSS(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] });
  if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1));
  if (value && typeof value === 'object' && !(value instanceof Buffer)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v, depth + 1);
    }
    return out;
  }
  return value;
}

module.exports = function sanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  if (req.query) {
    const q = clean(req.query);
    for (const k of Object.keys(req.query)) delete req.query[k];
    Object.assign(req.query, q);
  }
  next();
};
module.exports.clean = clean;
