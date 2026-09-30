const crypto = require('crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const env = require('../config/env');
const { getBoxPricing } = require('./settings.service');
const { validateCoupon } = require('./coupon.service');
const { round2 } = require('../utils/helpers');
const { GUEST_COOKIE, setGuestCookie, clearGuestCookie } = require('../utils/tokens');

const GUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function findCart(req) {
  if (req.user) return Cart.findOne({ user: req.user._id });
  const gid = req.cookies?.[GUEST_COOKIE];
  return gid ? Cart.findOne({ guestId: gid }) : null;
}

async function getOrCreateCart(req, res) {
  let cart = await findCart(req);
  if (cart) return cart;
  if (req.user) return Cart.create({ user: req.user._id, items: [] });
  const guestId = crypto.randomUUID();
  setGuestCookie(res, guestId);
  return Cart.create({ guestId, items: [], expiresAt: new Date(Date.now() + GUEST_TTL_MS) });
}

// Merge a guest cart into the user's cart on login/register
async function mergeGuestCart(req, res, user) {
  const gid = req.cookies?.[GUEST_COOKIE];
  if (!gid) return;
  const guest = await Cart.findOne({ guestId: gid });
  clearGuestCookie(res);
  if (!guest || !guest.items.length) { if (guest) await guest.deleteOne(); return; }
  let cart = await Cart.findOne({ user: user._id });
  if (!cart) cart = new Cart({ user: user._id, items: [] });
  for (const gi of guest.items) {
    const same = gi.kind === 'product' && cart.items.find((i) => i.kind === 'product' && String(i.variant) === String(gi.variant));
    if (same) same.qty = Math.min(50, same.qty + gi.qty);
    else cart.items.push(gi.toObject ? { ...gi.toObject(), _id: undefined } : gi);
  }
  if (!cart.couponCode && guest.couponCode) cart.couponCode = guest.couponCode;
  await cart.save();
  await guest.deleteOne();
}

const productCard = (p) => ({
  _id: p._id, name: p.name, slug: p.slug, flavour: p.flavour, colors: p.colors,
  image: p.images?.[0]?.url || '', stock: p.stock, isActive: p.isActive,
});

/**
 * Turns stored cart items into priced, validated lines. Prices ALWAYS come from the DB, never the client.
 */
async function hydrate(cart) {
  const items = cart?.items || [];
  const productIds = new Set();
  const variantIds = new Set();
  for (const it of items) {
    if (it.kind === 'box') it.box?.selections?.forEach((s) => productIds.add(String(s.product)));
    else { productIds.add(String(it.product)); variantIds.add(String(it.variant)); }
  }
  const [products, variants, boxPricing] = await Promise.all([
    Product.find({ _id: { $in: [...productIds] } }).lean({ virtuals: false }),
    ProductVariant.find({ _id: { $in: [...variantIds] } }).lean(),
    getBoxPricing(),
  ]);
  const pMap = new Map(products.map((p) => [String(p._id), p]));
  const vMap = new Map(variants.map((v) => [String(v._id), v]));

  // Pops demanded per product across the whole cart (for accurate availability)
  const demand = new Map();
  const addDemand = (id, n) => demand.set(String(id), (demand.get(String(id)) || 0) + n);
  for (const it of items) {
    if (it.kind === 'box') it.box?.selections?.forEach((s) => addDemand(s.product, s.qty * it.qty));
    else { const v = vMap.get(String(it.variant)); if (v) addDemand(it.product, v.packSize * it.qty); }
  }

  const lines = [];
  for (const it of items) {
    if (it.kind === 'box') {
      const bp = boxPricing.find((b) => b.size === it.box?.size);
      const sels = (it.box?.selections || []).map((s) => ({ product: pMap.get(String(s.product)), qty: s.qty }));
      const valid = bp && sels.length && sels.every((s) => s.product && s.product.isActive) && sels.reduce((a, s) => a + s.qty, 0) === bp.size;
      if (!valid) { lines.push({ _id: it._id, kind: 'box', invalid: true, name: 'Custom box', issue: 'This box is no longer available' }); continue; }
      const issues = sels.filter((s) => s.product.stock < (demand.get(String(s.product._id)) || 0)).map((s) => `${s.product.name} is low on stock`);
      lines.push({
        _id: it._id, kind: 'box', qty: it.qty, name: `Build-Your-Box · ${bp.size} Pops`,
        box: { size: bp.size, selections: sels.map((s) => ({ product: productCard(s.product), qty: s.qty })) },
        unitPrice: bp.price, unitMrp: bp.mrp, lineTotal: round2(bp.price * it.qty), mrpTotal: round2(bp.mrp * it.qty),
        pops: bp.size * it.qty, inStock: issues.length === 0, issue: issues[0] || '',
      });
    } else {
      const p = pMap.get(String(it.product));
      const v = vMap.get(String(it.variant));
      if (!p || !v || !p.isActive || !v.isActive) { lines.push({ _id: it._id, kind: 'product', invalid: true, name: p?.name || 'Product', issue: 'No longer available' }); continue; }
      const need = demand.get(String(p._id)) || 0;
      const maxQty = Math.max(0, Math.floor(p.stock / v.packSize));
      lines.push({
        _id: it._id, kind: 'product', qty: it.qty, name: p.name,
        product: productCard(p), variant: { _id: v._id, name: v.name, packSize: v.packSize, sku: v.sku },
        unitPrice: v.price, unitMrp: v.mrp, lineTotal: round2(v.price * it.qty), mrpTotal: round2(v.mrp * it.qty),
        pops: v.packSize * it.qty, maxQty, inStock: p.stock >= need, issue: p.stock <= 0 ? 'Out of stock' : p.stock < need ? `Only ${maxQty} left` : '',
      });
    }
  }
  const valid = lines.filter((l) => !l.invalid);
  const subtotal = round2(valid.reduce((a, l) => a + l.lineTotal, 0));
  const mrpTotal = round2(valid.reduce((a, l) => a + l.mrpTotal, 0));
  return { lines, subtotal, mrpTotal, itemCount: valid.reduce((a, l) => a + l.qty, 0), pops: valid.reduce((a, l) => a + l.pops, 0) };
}

function shippingFor(amountAfterDiscount, deliveryMethod = 'standard') {
  const c = env.commerce;
  if (deliveryMethod === 'express') return c.expressShipping;
  return amountAfterDiscount >= c.freeShippingThreshold || amountAfterDiscount === 0 ? 0 : c.standardShipping;
}

async function summarize(cart, { userId, deliveryMethod = 'standard', paymentMethod, strictCoupon = false } = {}) {
  const h = await hydrate(cart);
  let discount = 0;
  let coupon = null;
  let couponError = '';
  if (cart?.couponCode && h.subtotal > 0) {
    try {
      const r = await validateCoupon(cart.couponCode, { userId, subtotal: h.subtotal });
      discount = r.discount; coupon = r.coupon;
    } catch (e) {
      if (strictCoupon) throw e;
      couponError = e.message;
    }
  }
  const afterDiscount = round2(h.subtotal - discount);
  const shippingFee = h.subtotal > 0 ? shippingFor(afterDiscount, deliveryMethod) : 0;
  const codFee = paymentMethod === 'cod' ? env.commerce.codFee : 0;
  const total = round2(afterDiscount + shippingFee + codFee);
  const r = env.commerce.gstRate;
  const taxIncluded = round2((afterDiscount * r) / (100 + r));
  const threshold = env.commerce.freeShippingThreshold;
  return {
    ...h,
    couponCode: coupon ? coupon.code : cart?.couponCode || '',
    couponValid: Boolean(coupon),
    couponError,
    coupon: coupon ? { code: coupon.code, description: coupon.description } : null,
    discount,
    shippingFee,
    codFee,
    taxIncluded,
    gstRate: r,
    total,
    savings: round2(h.mrpTotal - h.subtotal + discount),
    freeShipping: { threshold, remaining: Math.max(0, round2(threshold - afterDiscount)) },
    hasIssues: h.lines.some((l) => l.invalid || !l.inStock),
  };
}

module.exports = { findCart, getOrCreateCart, mergeGuestCart, hydrate, summarize, shippingFor };
