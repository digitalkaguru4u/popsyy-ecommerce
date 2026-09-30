const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { getRazorpay, razorpayEnabled } = require('../config/razorpay');
const email = require('./email.service');
const { notifyAdmin } = require('./notification.service');

const toPaise = (r) => Math.round(Number(r) * 100);

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, signature, secret = env.razorpay.keySecret) {
  const expected = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

function verifyWebhookSignature(rawBody, signature, secret = env.razorpay.webhookSecret) {
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

function mode() {
  if (razorpayEnabled()) return 'razorpay';
  if (env.paymentMock) return 'mock';
  return 'disabled';
}

async function createForOrder(order, user) {
  if (order.paymentMethod !== 'razorpay') throw new AppError('This order is Cash on Delivery', 400);
  if (order.status !== 'pending' || order.paymentStatus === 'paid') throw new AppError('This order is already paid', 400);
  const m = mode();
  if (m === 'disabled') throw new AppError('Online payments are not available right now. Please choose Cash on Delivery.', 503);

  let providerOrderId;
  if (m === 'razorpay') {
    const rzpOrder = await getRazorpay().orders.create({
      amount: toPaise(order.total),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: String(order._id), orderNumber: order.orderNumber },
    });
    providerOrderId = rzpOrder.id;
  } else {
    providerOrderId = `mock_order_${crypto.randomBytes(8).toString('hex')}`;
  }
  const payment = await Payment.create({
    order: order._id, user: user._id, provider: m, providerOrderId, amount: order.total, status: 'created',
  });
  return {
    provider: m,
    keyId: m === 'razorpay' ? env.razorpay.keyId : undefined,
    providerOrderId,
    paymentId: payment._id,
    amount: toPaise(order.total),
    currency: 'INR',
    orderNumber: order.orderNumber,
    prefill: { name: order.customerName, email: order.email, contact: order.phone },
  };
}

async function markPaid(payment, order, { providerPaymentId, signature, method, event } = {}) {
  if (payment.status === 'paid') return { order, payment, alreadyPaid: true };
  payment.status = 'paid';
  if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
  if (signature) payment.signature = signature;
  if (method) payment.method = method;
  if (event) payment.events.push({ type: event });
  await payment.save();

  order.paymentStatus = 'paid';
  const orderService = require('./order.service');
  if (order.status === 'pending') await orderService.confirmOrder(order, { paymentStatus: 'paid', note: 'Payment received' });
  else if (order.status === 'cancelled') {
    // paid after auto-cancel — keep money safe: flag for admin to refund or reinstate
    order.internalNotes.push({ text: `Payment ${providerPaymentId} captured after cancellation — refund or reinstate.`, by: 'system' });
    await order.save();
    notifyAdmin('payment_after_cancel', `Late payment on ${order.orderNumber}`, 'Payment captured after order was cancelled.', `/admin/orders/${order._id}`);
  } else await order.save();
  email.send('paymentConfirmation', order.email, order, payment);
  return { order, payment };
}

async function markFailed(payment, order, reason = 'Payment failed', event) {
  if (payment.status === 'paid') return;
  payment.status = 'failed';
  payment.failureReason = reason;
  if (event) payment.events.push({ type: event });
  await payment.save();
  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    order.statusHistory.push({ status: order.status, note: `Payment failed: ${reason}` });
    await order.save();
  }
  notifyAdmin('payment_failed', `Payment failed on ${order.orderNumber}`, reason, `/admin/orders/${order._id}`);
}

async function loadForVerify(orderId, userId, providerOrderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found', 404);
  const payment = await Payment.findOne({ order: order._id, providerOrderId });
  if (!payment) throw new AppError('Payment session not found', 404);
  return { order, payment };
}

async function verify(user, body) {
  const { orderId } = body;
  if (body.provider === 'mock') {
    if (!env.paymentMock) throw new AppError('Mock payments are disabled', 400);
    const { order, payment } = await loadForVerify(orderId, user._id, body.providerOrderId);
    if (body.outcome !== 'success') {
      await markFailed(payment, order, body.reason || 'Simulated failure', 'mock.failed');
      throw new AppError('Payment failed. You can retry from your order page.', 402);
    }
    return markPaid(payment, order, { providerPaymentId: `mock_pay_${crypto.randomBytes(6).toString('hex')}`, method: body.method || 'upi', event: 'mock.success' });
  }

  const { razorpay_order_id: rzpOrderId, razorpay_payment_id: rzpPaymentId, razorpay_signature: sig } = body;
  const { order, payment } = await loadForVerify(orderId, user._id, rzpOrderId);
  if (!verifyCheckoutSignature(rzpOrderId, rzpPaymentId, sig)) {
    await markFailed(payment, order, 'Signature verification failed', 'verify.bad_signature');
    throw new AppError('Payment verification failed', 400);
  }
  // Double-check with Razorpay: amount must match and payment must be captured (capture if only authorized)
  let method;
  const rzp = getRazorpay();
  if (rzp) {
    const p = await rzp.payments.fetch(rzpPaymentId);
    if (Number(p.amount) !== toPaise(order.total)) {
      await markFailed(payment, order, 'Amount mismatch', 'verify.amount_mismatch');
      throw new AppError('Payment amount mismatch', 400);
    }
    if (p.status === 'authorized') await rzp.payments.capture(rzpPaymentId, p.amount, 'INR');
    else if (p.status !== 'captured') {
      await markFailed(payment, order, `Payment status ${p.status}`, 'verify.not_captured');
      throw new AppError('Payment not completed', 402);
    }
    method = p.method;
  }
  return markPaid(payment, order, { providerPaymentId: rzpPaymentId, signature: sig, method, event: 'verify.success' });
}

async function reportFailure(user, { orderId, providerOrderId, reason }) {
  const { order, payment } = await loadForVerify(orderId, user._id, providerOrderId);
  await markFailed(payment, order, reason || 'Payment cancelled by customer', 'client.failed');
  return order;
}

async function handleWebhook(rawBody, signature) {
  if (!verifyWebhookSignature(rawBody, signature)) throw new AppError('Invalid webhook signature', 400);
  const evt = JSON.parse(rawBody.toString('utf8'));
  const type = evt.event;
  const pay = evt.payload?.payment?.entity;
  const refund = evt.payload?.refund?.entity;

  if ((type === 'payment.captured' || type === 'order.paid') && pay) {
    const payment = await Payment.findOne({ providerOrderId: pay.order_id });
    if (!payment) return { ignored: true };
    const order = await Order.findById(payment.order);
    if (Number(pay.amount) !== toPaise(order.total)) {
      payment.events.push({ type: 'webhook.amount_mismatch', payload: { amount: pay.amount } });
      await payment.save();
      return { ignored: true };
    }
    await markPaid(payment, order, { providerPaymentId: pay.id, method: pay.method, event: `webhook.${type}` });
    return { handled: type };
  }
  if (type === 'payment.failed' && pay) {
    const payment = await Payment.findOne({ providerOrderId: pay.order_id });
    if (!payment) return { ignored: true };
    const order = await Order.findById(payment.order);
    await markFailed(payment, order, pay.error_description || 'Payment failed', 'webhook.payment.failed');
    return { handled: type };
  }
  if (type?.startsWith('refund.') && refund) {
    const payment = await Payment.findOne({ providerPaymentId: refund.payment_id });
    if (!payment) return { ignored: true };
    const r = payment.refunds.find((x) => x.refundId === refund.id);
    if (r) r.status = refund.status; else payment.refunds.push({ refundId: refund.id, amount: refund.amount / 100, status: refund.status });
    payment.events.push({ type: `webhook.${type}` });
    await payment.save();
    return { handled: type };
  }
  return { ignored: true };
}

async function refundOrder(order, { reason = '', amount } = {}) {
  const payment = await Payment.findOne({ order: order._id, status: { $in: ['paid', 'partially_refunded'] } }).sort({ createdAt: -1 });
  if (!payment) throw new AppError('No captured payment found for this order', 400);
  const refundAmount = amount ?? order.total;
  let refundId;
  let status = 'processed';
  if (payment.provider === 'razorpay') {
    const rzp = getRazorpay();
    if (!rzp) throw new AppError('Razorpay is not configured — cannot refund online payment', 503);
    const r = await rzp.payments.refund(payment.providerPaymentId, {
      amount: toPaise(refundAmount), speed: 'normal', notes: { orderNumber: order.orderNumber, reason: reason.slice(0, 200) },
    });
    refundId = r.id; status = r.status;
  } else if (payment.provider === 'mock') {
    refundId = `mock_rfnd_${crypto.randomBytes(6).toString('hex')}`;
  } else {
    refundId = `manual_${Date.now()}`; // COD refunds are settled offline (bank transfer / UPI)
    status = 'manual';
  }
  payment.refunds.push({ refundId, amount: refundAmount, status });
  payment.status = refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';
  await payment.save();
  notifyAdmin('refund', `Refund ${status} for ${order.orderNumber}`, `₹${refundAmount}`, `/admin/orders/${order._id}`);
  return payment;
}

module.exports = {
  mode, createForOrder, verify, reportFailure, handleWebhook, refundOrder,
  verifyCheckoutSignature, verifyWebhookSignature, markPaid, markFailed,
};
