const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/helpers');
const orderService = require('../services/order.service');
const { renderInvoice } = require('../services/invoice.service');

exports.create = async (req, res) => {
  const order = await orderService.createOrder(req, req.body);
  res.status(201).json({ success: true, order: { _id: order._id, orderNumber: order.orderNumber, total: order.total, status: order.status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus } });
};

exports.listMine = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 10 });
  const filter = { user: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items').lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.getMine = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate({ path: 'items', populate: { path: 'product', select: 'slug name' } }).select('-internalNotes').lean();
  if (!order) throw new AppError('Order not found', 404);
  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 }).select('provider status method providerPaymentId failureReason refunds').lean();
  res.json({ success: true, order, payment });
};

exports.cancelMine = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new AppError('Order not found', 404);
  await orderService.cancelOrder(order, { by: req.user._id, reason: req.body?.reason || 'Cancelled by customer', actor: 'customer' });
  res.json({ success: true, order });
};

exports.invoiceMine = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!order) throw new AppError('Order not found', 404);
  if (order.status === 'pending') throw new AppError('Invoice is available once the order is confirmed', 400);
  const items = await OrderItem.find({ order: order._id }).lean();
  res.type('html').send(renderInvoice(order, items));
};

// Public tracking by order number + email (no login)
exports.track = async (req, res) => {
  const { orderNumber, email } = req.body;
  const order = await Order.findOne({ orderNumber, email }).select('orderNumber status paymentStatus statusHistory tracking createdAt total itemCount deliveryMethod shippingAddress.city').lean();
  if (!order) throw new AppError('No order found with that number and email', 404);
  res.json({ success: true, order });
};
