const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const paymentService = require('../services/payment.service');

exports.config = async (req, res) => {
  const mode = paymentService.mode();
  res.json({
    success: true,
    online: mode !== 'disabled',
    mode, // 'razorpay' | 'mock' (local simulator, dev only) | 'disabled'
    keyId: mode === 'razorpay' ? env.razorpay.keyId : null,
    cod: { enabled: true, maxOrder: env.commerce.codMaxOrder, fee: env.commerce.codFee },
    shipping: { freeThreshold: env.commerce.freeShippingThreshold, standard: env.commerce.standardShipping, express: env.commerce.expressShipping },
    gstRate: env.commerce.gstRate,
  });
};

exports.create = async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) throw new AppError('Order not found', 404);
  const session = await paymentService.createForOrder(order, req.user);
  res.status(201).json({ success: true, payment: session });
};

exports.verify = async (req, res) => {
  const { order } = await paymentService.verify(req.user, req.body);
  res.json({ success: true, order: { _id: order._id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, total: order.total } });
};

exports.failed = async (req, res) => {
  const order = await paymentService.reportFailure(req.user, req.body);
  res.json({ success: true, order: { _id: order._id, status: order.status, paymentStatus: order.paymentStatus } });
};

// Razorpay webhook — raw body, HMAC verified
exports.webhook = async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  if (!sig) throw new AppError('Missing signature', 400);
  const result = await paymentService.handleWebhook(req.body, sig);
  res.json({ success: true, ...result });
};
