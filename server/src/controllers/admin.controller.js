const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const Inventory = require('../models/Inventory');
const Banner = require('../models/Banner');
const FAQ = require('../models/FAQ');
const Notification = require('../models/Notification');
const Newsletter = require('../models/Newsletter');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const { paginate, escapeRegex, round2 } = require('../utils/helpers');
const orderService = require('../services/order.service');
const inventory = require('../services/inventory.service');
const { getSettings } = require('../services/settings.service');
const { renderInvoice } = require('../services/invoice.service');
const env = require('../config/env');

const REVENUE_STATUSES = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const IST_OFFSET = 330 * 60 * 1000;
const istDay = (d) => new Date(new Date(d).getTime() + IST_OFFSET).toISOString().slice(0, 10);
function startOfIstDay(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET);
}

function resolveRange(q) {
  const now = new Date();
  const preset = q.range || '30d';
  let from;
  let to = now;
  if (preset === 'custom' && q.from) {
    from = startOfIstDay(new Date(q.from));
    to = q.to ? new Date(startOfIstDay(new Date(q.to)).getTime() + 86400000 - 1) : now;
  } else if (preset === 'today') from = startOfIstDay(now);
  else {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[preset] || 30;
    from = startOfIstDay(new Date(now.getTime() - (days - 1) * 86400000));
  }
  if (from > to) throw new AppError('Invalid date range', 400);
  return { from, to, preset };
}

function buildSeries(from, to, orders) {
  const map = new Map();
  for (let t = startOfIstDay(from).getTime(); t <= to.getTime(); t += 86400000) map.set(istDay(t), { date: istDay(t), revenue: 0, orders: 0 });
  orders.forEach((o) => {
    const k = istDay(o.createdAt);
    const b = map.get(k);
    if (b) { b.revenue = round2(b.revenue + o.total); b.orders += 1; }
  });
  return [...map.values()];
}

async function salesBreakdown(orderIds) {
  const items = await OrderItem.find({ order: { $in: orderIds } }).select('kind product name flavour qty packSize lineTotal boxSelections').lean();
  const byProduct = new Map();
  const byFlavour = new Map();
  const add = (map, key, name, pops, revenue) => {
    const cur = map.get(key) || { key, name, pops: 0, revenue: 0 };
    cur.pops += pops; cur.revenue = round2(cur.revenue + revenue);
    map.set(key, cur);
  };
  for (const i of items) {
    if (i.kind === 'box') {
      const totalPops = i.boxSelections.reduce((a, s) => a + s.qty, 0) || 1;
      i.boxSelections.forEach((s) => {
        const pops = s.qty * i.qty;
        const rev = (i.lineTotal * s.qty) / totalPops;
        add(byProduct, String(s.product), s.name, pops, rev);
        add(byFlavour, s.flavour || s.name, s.name, pops, rev);
      });
    } else {
      add(byProduct, String(i.product), i.name, i.packSize * i.qty, i.lineTotal);
      add(byFlavour, i.flavour || i.name, i.name, i.packSize * i.qty, i.lineTotal);
    }
  }
  const sort = (m) => [...m.values()].sort((a, b) => b.revenue - a.revenue);
  return { byProduct: sort(byProduct), byFlavour: sort(byFlavour) };
}

/* ---------------- DASHBOARD ---------------- */
exports.dashboard = async (req, res) => {
  const today = startOfIstDay();
  const from30 = startOfIstDay(new Date(Date.now() - 29 * 86400000));
  const [allRevenueOrders, customers, products, lowStock, toFulfil, awaitingPayment, recent, unread, pendingReviews] = await Promise.all([
    Order.find({ status: { $in: REVENUE_STATUSES } }).select('total createdAt').lean(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({}),
    Product.find({}).select('name slug stock lowStockThreshold colors').sort({ stock: 1 }).lean().then((ps) => ps.filter((p) => p.stock <= p.lowStockThreshold)),
    Order.countDocuments({ status: { $in: ['confirmed', 'processing', 'packed'] } }),
    Order.countDocuments({ status: 'pending' }),
    Order.find({}).sort({ createdAt: -1 }).limit(8).select('orderNumber customerName total status paymentStatus paymentMethod createdAt').lean(),
    Notification.find({ audience: 'admin' }).sort({ createdAt: -1 }).limit(10).lean(),
    Review.countDocuments({ status: 'pending' }),
  ]);
  const totalRevenue = round2(allRevenueOrders.reduce((a, o) => a + o.total, 0));
  const todays = allRevenueOrders.filter((o) => o.createdAt >= today);
  const last30 = allRevenueOrders.filter((o) => o.createdAt >= from30);
  const breakdown = await salesBreakdown(last30.map((o) => o._id));
  res.json({
    success: true,
    stats: {
      totalRevenue, todayRevenue: round2(todays.reduce((a, o) => a + o.total, 0)), todayOrders: todays.length,
      orders: allRevenueOrders.length, customers, products, lowStock: lowStock.length, pendingOrders: toFulfil, awaitingPayment, pendingReviews,
      aov: allRevenueOrders.length ? round2(totalRevenue / allRevenueOrders.length) : 0,
    },
    series: buildSeries(from30, new Date(), last30),
    salesByProduct: breakdown.byProduct,
    salesByFlavour: breakdown.byFlavour,
    recentOrders: recent,
    lowStockProducts: lowStock.slice(0, 8),
    notifications: unread,
  });
};

/* ---------------- ANALYTICS ---------------- */
exports.analytics = async (req, res) => {
  const { from, to, preset } = resolveRange(req.query);
  const span = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - span - 1);
  const [orders, allInRange, prevOrders, newCustomers, onlinePayments] = await Promise.all([
    Order.find({ status: { $in: REVENUE_STATUSES }, createdAt: { $gte: from, $lte: to } }).select('total createdAt user couponCode discount paymentMethod').lean(),
    Order.find({ createdAt: { $gte: from, $lte: to } }).select('status paymentStatus paymentMethod').lean(),
    Order.find({ status: { $in: REVENUE_STATUSES }, createdAt: { $gte: prevFrom, $lt: from } }).select('total').lean(),
    User.find({ role: 'customer', createdAt: { $gte: from, $lte: to } }).select('createdAt').lean(),
    Payment.find({ provider: { $in: ['razorpay', 'mock'] }, createdAt: { $gte: from, $lte: to } }).select('status').lean(),
  ]);
  const revenue = round2(orders.reduce((a, o) => a + o.total, 0));
  const prevRevenue = round2(prevOrders.reduce((a, o) => a + o.total, 0));
  const series = buildSeries(from, to, orders);
  const custSeries = new Map(series.map((s) => [s.date, 0]));
  newCustomers.forEach((u) => { const k = istDay(u.createdAt); if (custSeries.has(k)) custSeries.set(k, custSeries.get(k) + 1); });

  // repeat customers: buyers in range who had a revenue order before this range
  const buyers = [...new Set(orders.map((o) => String(o.user)))];
  const returning = buyers.length ? await Order.distinct('user', { user: { $in: buyers }, status: { $in: REVENUE_STATUSES }, createdAt: { $lt: from } }) : [];
  const attempted = onlinePayments.length;
  const paidOnline = onlinePayments.filter((p) => ['paid', 'refunded', 'partially_refunded'].includes(p.status)).length;
  const breakdown = await salesBreakdown(orders.map((o) => o._id));

  res.json({
    success: true,
    range: { from, to, preset },
    kpis: {
      revenue, prevRevenue,
      revenueChange: prevRevenue ? round2(((revenue - prevRevenue) / prevRevenue) * 100) : null,
      orders: orders.length,
      aov: orders.length ? round2(revenue / orders.length) : 0,
      newCustomers: newCustomers.length,
      buyers: buyers.length,
      repeatBuyerRate: buyers.length ? round2((returning.length / buyers.length) * 100) : 0,
      paymentSuccessRate: attempted ? round2((paidOnline / attempted) * 100) : null,
      abandonedCheckouts: allInRange.filter((o) => o.status === 'cancelled' && o.paymentStatus !== 'paid' && o.paymentMethod === 'razorpay').length + allInRange.filter((o) => o.status === 'pending').length,
      cancellations: allInRange.filter((o) => o.status === 'cancelled').length,
      refunds: allInRange.filter((o) => o.status === 'refunded').length,
      couponOrders: orders.filter((o) => o.couponCode).length,
      discountGiven: round2(orders.reduce((a, o) => a + (o.discount || 0), 0)),
      codShare: orders.length ? round2((orders.filter((o) => o.paymentMethod === 'cod').length / orders.length) * 100) : 0,
    },
    series: series.map((s) => ({ ...s, customers: custSeries.get(s.date) || 0 })),
    topProducts: breakdown.byProduct.slice(0, 10),
    topFlavours: breakdown.byFlavour,
  });
};

/* ---------------- ORDERS ---------------- */
exports.listOrders = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i');
    filter.$or = [{ orderNumber: rx }, { customerName: rx }, { email: rx }, { phone: rx }];
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = startOfIstDay(new Date(req.query.from));
    if (req.query.to) filter.createdAt.$lte = new Date(startOfIstDay(new Date(req.query.to)).getTime() + 86400000 - 1);
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-statusHistory -internalNotes').lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items').populate('user', 'name email phone createdAt').lean();
  if (!order) throw new AppError('Order not found', 404);
  const payments = await Payment.find({ order: order._id }).sort({ createdAt: -1 }).select('-events.payload').lean();
  res.json({ success: true, order, payments });
};

exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  await orderService.updateStatus(order, req.body.status, { by: req.user._id, note: req.body.note, tracking: req.body.tracking });
  res.json({ success: true, order });
};

exports.addOrderNote = async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) throw new AppError('Note cannot be empty', 422);
  const order = await Order.findByIdAndUpdate(req.params.id, { $push: { internalNotes: { text: text.slice(0, 1000), by: req.user.name } } }, { returnDocument: 'after' });
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, internalNotes: order.internalNotes });
};

exports.updateTracking = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  order.tracking = { carrier: req.body.carrier || '', awb: req.body.awb || '', url: req.body.url || '' };
  await order.save();
  res.json({ success: true, tracking: order.tracking });
};

exports.invoice = async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new AppError('Order not found', 404);
  const items = await OrderItem.find({ order: order._id }).lean();
  res.type('html').send(renderInvoice(order, items));
};

/* ---------------- CUSTOMERS ---------------- */
exports.listCustomers = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = { role: 'customer' };
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (req.query.blocked === 'true') filter.isBlocked = true;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const ids = users.map((u) => u._id);
  const orders = await Order.find({ user: { $in: ids }, status: { $in: REVENUE_STATUSES } }).select('user total').lean();
  const stats = new Map();
  orders.forEach((o) => { const k = String(o.user); const s = stats.get(k) || { orders: 0, spent: 0 }; s.orders += 1; s.spent = round2(s.spent + o.total); stats.set(k, s); });
  res.json({ success: true, customers: users.map((u) => ({ ...u, ...(stats.get(String(u._id)) || { orders: 0, spent: 0 }) })), total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.getCustomer = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).lean();
  if (!user) throw new AppError('Customer not found', 404);
  const [orders, addresses] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).select('orderNumber total status paymentStatus createdAt itemCount').lean(),
    Address.find({ user: user._id }).lean(),
  ]);
  const spent = round2(orders.filter((o) => REVENUE_STATUSES.includes(o.status)).reduce((a, o) => a + o.total, 0));
  res.json({ success: true, customer: user, orders, addresses, spent });
};

exports.blockCustomer = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Customer not found', 404);
  if (user.role === 'admin') throw new AppError("Admins can't be blocked here", 400);
  user.isBlocked = Boolean(req.body.blocked);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, isBlocked: user.isBlocked });
};

/* ---------------- COUPONS ---------------- */
exports.listCoupons = async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  res.json({ success: true, coupons });
};
exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
};
exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ success: true, coupon });
};
exports.deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ success: true });
};

/* ---------------- INVENTORY ---------------- */
exports.inventory = async (req, res) => {
  const products = await Product.find({}).select('name slug flavour stock lowStockThreshold isActive colors images soldCount').sort({ sortOrder: 1 }).lean();
  const withState = products.map((p) => ({ ...p, state: p.stock <= 0 ? 'out' : p.stock <= p.lowStockThreshold ? 'low' : 'ok' }));
  res.json({
    success: true,
    products: withState,
    totals: { pops: products.reduce((a, p) => a + p.stock, 0), low: withState.filter((p) => p.state === 'low').length, out: withState.filter((p) => p.state === 'out').length },
  });
};

exports.inventoryHistory = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 30 });
  const filter = {};
  if (req.query.product) filter.product = req.query.product;
  const [rows, total] = await Promise.all([
    Inventory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('product', 'name').populate('by', 'name').populate('order', 'orderNumber').lean(),
    Inventory.countDocuments(filter),
  ]);
  res.json({ success: true, history: rows, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.adjustStock = async (req, res) => {
  const { productId, mode, quantity, note } = req.body;
  let r;
  if (mode === 'set') r = await inventory.setStock(productId, quantity, 'adjustment', { by: req.user._id, note });
  else if (mode === 'add') r = await inventory.adjust(productId, quantity, 'restock', { by: req.user._id, note });
  else r = await inventory.adjust(productId, -quantity, 'adjustment', { by: req.user._id, note });
  if (!r.ok) throw new AppError(mode === 'remove' ? 'Not enough stock to remove that many' : 'Product not found', 400);
  res.json({ success: true, product: r.product });
};

exports.bulkStock = async (req, res) => {
  const results = [];
  for (const it of req.body.items) {
    const r = await inventory.setStock(it.productId, it.stock, 'bulk_update', { by: req.user._id, note: req.body.note });
    results.push({ productId: it.productId, ok: r.ok, stock: r.product?.stock });
  }
  res.json({ success: true, results });
};

/* ---------------- CMS ---------------- */
const CMS_FIELDS = ['announcement', 'hero', 'marquee', 'boxes', 'flavourSection', 'flavourCards', 'featuredProducts', 'moods', 'socialFeed', 'about', 'pages', 'socials', 'footer', 'seo'];
exports.getCms = async (req, res) => {
  const s = await getSettings();
  res.json({ success: true, settings: s });
};
exports.updateCms = async (req, res) => {
  const s = await getSettings();
  for (const f of CMS_FIELDS) if (req.body[f] !== undefined) s[f] = req.body[f];
  if (s.boxes?.some((b) => ![6, 12, 24].includes(Number(b.size)) || !(Number(b.price) > 0))) throw new AppError('Box sizes must be 6/12/24 with a price', 422);
  await s.save();
  res.json({ success: true, settings: s });
};

exports.listBanners = async (req, res) => res.json({ success: true, banners: await Banner.find({}).sort({ placement: 1, sortOrder: 1 }).lean() });
exports.createBanner = async (req, res) => res.status(201).json({ success: true, banner: await Banner.create(req.body) });
exports.updateBanner = async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  if (!banner) throw new AppError('Banner not found', 404);
  res.json({ success: true, banner });
};
exports.deleteBanner = async (req, res) => {
  if (!(await Banner.findByIdAndDelete(req.params.id))) throw new AppError('Banner not found', 404);
  res.json({ success: true });
};

exports.listFaqs = async (req, res) => res.json({ success: true, faqs: await FAQ.find({}).sort({ sortOrder: 1 }).lean() });
exports.createFaq = async (req, res) => res.status(201).json({ success: true, faq: await FAQ.create(req.body) });
exports.updateFaq = async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  if (!faq) throw new AppError('FAQ not found', 404);
  res.json({ success: true, faq });
};
exports.deleteFaq = async (req, res) => {
  if (!(await FAQ.findByIdAndDelete(req.params.id))) throw new AppError('FAQ not found', 404);
  res.json({ success: true });
};

/* ---------------- NOTIFICATIONS / MISC ---------------- */
exports.notifications = async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ audience: 'admin' }).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ audience: 'admin', read: false }),
  ]);
  res.json({ success: true, notifications: items, unread });
};
exports.markNotificationsRead = async (req, res) => {
  await Notification.updateMany({ audience: 'admin', read: false }, { read: true });
  res.json({ success: true });
};
exports.subscribers = async (req, res) => {
  const subs = await Newsletter.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  res.json({ success: true, subscribers: subs, total: await Newsletter.countDocuments() });
};
exports.system = async (req, res) => {
  const paymentService = require('../services/payment.service');
  const { cloudinaryEnabled } = require('../services/upload.service');
  const { smtpConfigured } = require('../services/email.service');
  res.json({
    success: true,
    integrations: {
      payments: paymentService.mode(),
      webhook: Boolean(env.razorpay.webhookSecret),
      images: cloudinaryEnabled ? 'cloudinary' : 'local-disk',
      email: smtpConfigured ? 'smtp' : 'log-only',
    },
  });
};
