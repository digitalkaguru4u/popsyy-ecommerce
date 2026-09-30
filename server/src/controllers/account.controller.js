const Wishlist = require('../models/Wishlist');
const Address = require('../models/Address');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/* Wishlist */
exports.getWishlist = async (req, res) => {
  const wl = await Wishlist.findOne({ user: req.user._id }).populate({ path: 'products', match: { isActive: true } }).lean();
  res.json({ success: true, products: wl?.products || [], ids: (wl?.products || []).map((p) => p._id) });
};
exports.toggleWishlist = async (req, res) => {
  const { productId } = req.params;
  if (!(await Product.exists({ _id: productId }))) throw new AppError('Product not found', 404);
  let wl = await Wishlist.findOne({ user: req.user._id });
  if (!wl) wl = new Wishlist({ user: req.user._id, products: [] });
  const idx = wl.products.findIndex((p) => String(p) === productId);
  let added;
  if (idx >= 0) { wl.products.splice(idx, 1); added = false; } else { wl.products.unshift(productId); added = true; }
  await wl.save();
  res.json({ success: true, added, ids: wl.products });
};

/* Addresses */
exports.listAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, updatedAt: -1 }).lean();
  res.json({ success: true, addresses });
};
exports.createAddress = async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id });
  if (count >= 10) throw new AppError('You can save up to 10 addresses', 400);
  const isDefault = req.body.isDefault || count === 0;
  if (isDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });
  const address = await Address.create({ ...req.body, user: req.user._id, isDefault });
  res.status(201).json({ success: true, address });
};
exports.updateAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new AppError('Address not found', 404);
  if (req.body.isDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });
  Object.assign(address, req.body);
  await address.save();
  res.json({ success: true, address });
};
exports.deleteAddress = async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new AppError('Address not found', 404);
  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    if (next) { next.isDefault = true; await next.save(); }
  }
  res.json({ success: true });
};

/* Recently viewed */
exports.recentlyViewed = async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'recentlyViewed', match: { isActive: true } }).lean();
  res.json({ success: true, products: user?.recentlyViewed || [] });
};

/* Coupons available to this customer */
exports.coupons = async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ isActive: true, isPublic: true, startsAt: { $lte: now }, $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] }).lean();
  const out = [];
  for (const c of coupons) {
    if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) continue;
    const used = await Order.countDocuments({ user: req.user._id, couponCode: c.code, couponCounted: true });
    out.push({ code: c.code, description: c.description, minOrder: c.minOrder, expiresAt: c.expiresAt, discountType: c.discountType, value: c.value, maxDiscount: c.maxDiscount, usable: !(c.perUserLimit > 0 && used >= c.perUserLimit), used });
  }
  res.json({ success: true, coupons: out });
};

exports.summary = async (req, res) => {
  const [orders, spentAgg] = await Promise.all([
    Order.countDocuments({ user: req.user._id }),
    Order.find({ user: req.user._id, status: { $nin: ['pending', 'cancelled', 'refunded'] } }).select('total').lean(),
  ]);
  res.json({ success: true, orders, spent: spentAgg.reduce((a, o) => a + o.total, 0) });
};
