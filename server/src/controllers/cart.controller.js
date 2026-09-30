const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const AppError = require('../utils/AppError');
const cartService = require('../services/cart.service');
const { getBoxPricing } = require('../services/settings.service');
const { validateCoupon } = require('../services/coupon.service');

async function respond(req, res, cart, status = 200) {
  const summary = await cartService.summarize(cart, { userId: req.user?._id, deliveryMethod: req.query.delivery, paymentMethod: req.query.payment });
  res.status(status).json({ success: true, cart: summary });
}

exports.get = async (req, res) => {
  const cart = await cartService.findCart(req);
  await respond(req, res, cart);
};

exports.add = async (req, res) => {
  const cart = await cartService.getOrCreateCart(req, res);
  const b = req.body;
  if (b.kind === 'product') {
    const [product, variant] = await Promise.all([
      Product.findOne({ _id: b.productId, isActive: true }),
      ProductVariant.findOne({ _id: b.variantId, product: b.productId, isActive: true }),
    ]);
    if (!product || !variant) throw new AppError('Product not available', 404);
    const existing = cart.items.find((i) => i.kind === 'product' && String(i.variant) === String(variant._id));
    const newQty = (existing?.qty || 0) + b.qty;
    if (product.stock < newQty * variant.packSize) {
      const max = Math.floor(product.stock / variant.packSize);
      throw new AppError(max > 0 ? `Only ${max} of ${variant.name} left` : `${product.name} is sold out right now`, 409);
    }
    if (existing) existing.qty = Math.min(50, newQty);
    else cart.items.push({ kind: 'product', product: product._id, variant: variant._id, qty: b.qty });
  } else {
    const pricing = await getBoxPricing();
    if (!pricing.find((p) => p.size === b.size)) throw new AppError('That box size is not available', 400);
    const merged = new Map();
    b.selections.forEach((s) => merged.set(s.productId, (merged.get(s.productId) || 0) + s.qty));
    const total = [...merged.values()].reduce((a, n) => a + n, 0);
    if (total !== b.size) throw new AppError(`Pick exactly ${b.size} pops (you have ${total})`, 422);
    const products = await Product.find({ _id: { $in: [...merged.keys()] }, isActive: true });
    if (products.length !== merged.size) throw new AppError('One of those flavours is not available', 404);
    for (const p of products) {
      if (p.stock < merged.get(String(p._id)) * b.qty) throw new AppError(`Not enough ${p.name} in stock for this box`, 409);
    }
    cart.items.push({ kind: 'box', qty: b.qty, box: { size: b.size, selections: [...merged].map(([product, qty]) => ({ product, qty })) } });
  }
  await cart.save();
  await respond(req, res, cart, 201);
};

exports.update = async (req, res) => {
  const cart = await cartService.findCart(req);
  const item = cart?.items.id(req.params.item);
  if (!item) throw new AppError('Item not in cart', 404);
  if (item.kind === 'product') {
    const [product, variant] = await Promise.all([Product.findById(item.product), ProductVariant.findById(item.variant)]);
    if (product && variant && product.stock < req.body.qty * variant.packSize) {
      throw new AppError(`Only ${Math.floor(product.stock / variant.packSize)} left`, 409);
    }
  }
  item.qty = Math.min(item.kind === 'box' ? 10 : 50, req.body.qty);
  await cart.save();
  await respond(req, res, cart);
};

exports.remove = async (req, res) => {
  const cart = await cartService.findCart(req);
  if (!cart) throw new AppError('Cart is empty', 404);
  cart.items.pull({ _id: req.params.item });
  await cart.save();
  await respond(req, res, cart);
};

exports.clear = async (req, res) => {
  const cart = await cartService.findCart(req);
  if (cart) { cart.items = []; cart.couponCode = ''; await cart.save(); }
  await respond(req, res, cart);
};

exports.applyCoupon = async (req, res) => {
  const cart = await cartService.findCart(req);
  if (!cart || !cart.items.length) throw new AppError('Add some pops before applying a code', 400);
  const { subtotal } = await cartService.hydrate(cart);
  await validateCoupon(req.body.code, { userId: req.user?._id, subtotal });
  cart.couponCode = req.body.code.toUpperCase();
  await cart.save();
  await respond(req, res, cart);
};

exports.removeCoupon = async (req, res) => {
  const cart = await cartService.findCart(req);
  if (cart) { cart.couponCode = ''; await cart.save(); }
  await respond(req, res, cart);
};
