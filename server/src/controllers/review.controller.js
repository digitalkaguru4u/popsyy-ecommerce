const Review = require('../models/Review');
const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/helpers');
const { notifyAdmin } = require('../services/notification.service');
const { uploadImage } = require('../services/upload.service');
const env = require('../config/env');

async function recomputeRating(productId) {
  // computed in JS (select only the rating field) — portable across MongoDB-compatible engines
  const rows = await Review.find({ product: productId, status: 'approved' }).select('rating').lean();
  const count = rows.length;
  const avg = count ? Math.round((rows.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : 0;
  await Product.updateOne({ _id: productId }, { ratingAvg: avg, ratingCount: count });
}
exports.recomputeRating = recomputeRating;

// GET /api/reviews?product=<id>
exports.list = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 10 });
  const filter = { status: 'approved' };
  if (req.query.product) filter.product = req.query.product;
  const [reviews, total, dist] = await Promise.all([
    Review.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).select('-user').lean(),
    Review.countDocuments(filter),
    req.query.product ? Review.find({ product: req.query.product, status: 'approved' }).select('rating').lean() : [],
  ]);
  const distribution = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: dist.filter((d) => d.rating === r).length }));
  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) || 1, distribution });
};

exports.featured = async (req, res) => {
  const reviews = await Review.find({ status: 'approved', isFeatured: true }).sort({ createdAt: -1 }).limit(12).populate('product', 'name slug colors').select('-user').lean();
  res.json({ success: true, reviews });
};

exports.create = async (req, res) => {
  const { productId, rating, title, body, images = [] } = req.body;
  // only accept images we hosted (uploaded through /api/reviews/images)
  const safeImages = images.filter((u) => u.startsWith(`${env.serverUrl}/uploads/`) || /^https:\/\/res\.cloudinary\.com\//.test(u));
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError('Product not found', 404);
  if (await Review.exists({ product: productId, user: req.user._id })) throw new AppError("You've already reviewed this pop", 409);
  const myOrders = await Order.find({ user: req.user._id, status: 'delivered' }).select('_id').lean();
  const verified = myOrders.length
    ? Boolean(await OrderItem.exists({ order: { $in: myOrders.map((o) => o._id) }, $or: [{ product: productId }, { 'boxSelections.product': productId }] }))
    : false;
  const review = await Review.create({
    product: productId, user: req.user._id, authorName: req.user.name.split(' ')[0] + (req.user.name.split(' ')[1] ? ` ${req.user.name.split(' ')[1][0]}.` : ''),
    rating, title, body, images: safeImages, isVerifiedPurchase: verified, status: 'pending',
  });
  notifyAdmin('review', `New ${rating}★ review on ${product.name}`, title || body.slice(0, 80), '/admin/reviews');
  res.status(201).json({ success: true, review, message: 'Thanks! Your review will appear once approved.' });
};

exports.uploadImages = async (req, res) => {
  if (!req.files?.length) throw new AppError('No images uploaded', 400);
  const out = [];
  for (const f of req.files) out.push((await uploadImage(f, 'popsyy/reviews')).url);
  res.status(201).json({ success: true, urls: out });
};

exports.mine = async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).populate('product', 'name slug').sort({ createdAt: -1 }).lean();
  res.json({ success: true, reviews });
};

/* ADMIN */
exports.adminList = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.product) filter.product = req.query.product;
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('product', 'name slug').populate('user', 'email').lean(),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.moderate = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  const { status, isFeatured } = req.body;
  if (status && !['pending', 'approved', 'rejected'].includes(status)) throw new AppError('Invalid status', 422);
  if (status) review.status = status;
  if (typeof isFeatured === 'boolean') review.isFeatured = isFeatured;
  await review.save();
  await recomputeRating(review.product);
  res.json({ success: true, review });
};

exports.remove = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  await review.deleteOne();
  await recomputeRating(review.product);
  res.json({ success: true });
};
