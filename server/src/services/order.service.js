const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { generateOrderNumber } = require('../utils/helpers');
const cartService = require('./cart.service');
const inventory = require('./inventory.service');
const email = require('./email.service');
const { notifyAdmin } = require('./notification.service');

const FLOW = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const CANCELLABLE_BY_CUSTOMER = ['pending', 'confirmed', 'processing'];
const CANCELLABLE_BY_ADMIN = ['pending', 'confirmed', 'processing', 'packed'];

async function resolveAddress(user, { addressId, address }) {
  if (addressId) {
    const a = await Address.findOne({ _id: addressId, user: user._id }).lean();
    if (!a) throw new AppError('Address not found', 404);
    return a;
  }
  if (!address) throw new AppError('Shipping address is required', 422);
  if (address.save) {
    const created = await Address.create({ ...address, user: user._id, isDefault: !(await Address.exists({ user: user._id })) });
    return created.toObject();
  }
  return address;
}

async function createOrder(req, input) {
  const user = req.user;
  const cart = await cartService.findCart(req);
  if (!cart || !cart.items.length) throw new AppError('Your cart is empty', 400);
  const summary = await cartService.summarize(cart, {
    userId: user._id, deliveryMethod: input.deliveryMethod, paymentMethod: input.paymentMethod, strictCoupon: true,
  });
  if (!summary.lines.length || summary.subtotal <= 0) throw new AppError('Your cart is empty', 400);
  if (summary.hasIssues) throw new AppError('Some items in your cart are unavailable. Please review your cart.', 409);
  if (input.paymentMethod === 'cod' && summary.total > env.commerce.codMaxOrder) {
    throw new AppError(`Cash on Delivery is available for orders up to ₹${env.commerce.codMaxOrder}`, 400);
  }
  const addr = await resolveAddress(user, input);
  const shippingAddress = {
    name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', landmark: addr.landmark || '',
    city: addr.city, state: addr.state, pincode: addr.pincode, country: 'India',
  };

  const order = new Order({
    orderNumber: generateOrderNumber(),
    user: user._id,
    customerName: input.name || user.name,
    email: input.email || user.email,
    phone: input.phone || addr.phone || user.phone,
    shippingAddress,
    deliveryMethod: input.deliveryMethod,
    subtotal: summary.subtotal,
    mrpTotal: summary.mrpTotal,
    discount: summary.discount,
    couponCode: summary.couponValid ? summary.couponCode : '',
    shippingFee: summary.shippingFee,
    codFee: summary.codFee,
    taxIncluded: summary.taxIncluded,
    total: summary.total,
    paymentMethod: input.paymentMethod,
    status: 'pending',
    paymentStatus: 'pending',
    statusHistory: [{ status: 'pending', note: input.paymentMethod === 'cod' ? 'Order placed (COD)' : 'Awaiting payment' }],
  });

  const itemDocs = summary.lines.map((l) => ({
    order: order._id,
    kind: l.kind,
    product: l.kind === 'product' ? l.product._id : undefined,
    variant: l.kind === 'product' ? l.variant._id : undefined,
    sku: l.kind === 'product' ? l.variant.sku : `BOX-${l.box.size}`,
    name: l.name,
    flavour: l.kind === 'product' ? l.product.flavour : 'mixed',
    variantName: l.kind === 'product' ? l.variant.name : `${l.box.size} pops`,
    packSize: l.kind === 'product' ? l.variant.packSize : l.box.size,
    image: l.kind === 'product' ? l.product.image : l.box.selections[0]?.product.image,
    qty: l.qty,
    unitPrice: l.unitPrice,
    unitMrp: l.unitMrp,
    lineTotal: l.lineTotal,
    boxSelections: l.kind === 'box' ? l.box.selections.map((s) => ({ product: s.product._id, name: s.product.name, flavour: s.product.flavour, qty: s.qty })) : [],
  }));
  const items = await OrderItem.insertMany(itemDocs);
  order.items = items.map((i) => i._id);
  order.itemCount = items.reduce((a, i) => a + i.qty, 0);
  await order.save();

  if (input.paymentMethod === 'cod') {
    await Payment.create({ order: order._id, user: user._id, provider: 'cod', method: 'cod', amount: order.total, status: 'created' });
    await confirmOrder(order, { paymentStatus: 'cod_pending', note: 'Cash on Delivery' });
  }
  return order;
}

async function clearCartForUser(userId) {
  await Cart.updateOne({ user: userId }, { $set: { items: [], couponCode: '' } });
}

async function confirmOrder(order, { paymentStatus, note } = {}) {
  if (order.status !== 'pending') return order; // idempotent
  order.status = 'confirmed';
  order.confirmedAt = new Date();
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.statusHistory.push({ status: 'confirmed', note: note || 'Order confirmed' });
  await inventory.deductForOrder(order);
  if (order.couponCode && !order.couponCounted) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    order.couponCounted = true;
  }
  await order.save();
  await clearCartForUser(order.user);
  const items = await OrderItem.find({ order: order._id }).lean();
  email.send('orderConfirmation', order.email, order, items);
  notifyAdmin('new_order', `New order ${order.orderNumber}`, `₹${order.total} · ${order.paymentMethod.toUpperCase()}`, `/admin/orders/${order._id}`);
  return order;
}

async function cancelOrder(order, { by, reason = '', actor = 'customer' } = {}) {
  const allowed = actor === 'admin' ? CANCELLABLE_BY_ADMIN : CANCELLABLE_BY_CUSTOMER;
  if (!allowed.includes(order.status)) throw new AppError(`Orders that are ${order.status.replace(/_/g, ' ')} can't be cancelled`, 400);
  const paymentService = require('./payment.service');
  await inventory.restoreForOrder(order, 'cancel');
  if (order.couponCounted) {
    await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    order.couponCounted = false;
  }
  if (order.paymentStatus === 'paid') {
    await paymentService.refundOrder(order, { reason: reason || 'Order cancelled' });
    order.paymentStatus = 'refunded';
  } else if (order.paymentStatus === 'cod_pending' || order.paymentStatus === 'pending' || order.paymentStatus === 'failed') {
    await Payment.updateMany({ order: order._id, status: 'created' }, { $set: { status: 'cancelled' } });
  }
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = reason;
  order.statusHistory.push({ status: 'cancelled', note: reason || `Cancelled by ${actor}`, by });
  await order.save();
  email.send('cancelled', order.email, order);
  return order;
}

async function refundOrder(order, { by, reason = '', restock } = {}) {
  if (!['paid', 'cod_collected'].includes(order.paymentStatus)) throw new AppError('Only paid orders can be refunded', 400);
  if (order.status === 'refunded') throw new AppError('Order already refunded', 400);
  const paymentService = require('./payment.service');
  await paymentService.refundOrder(order, { reason });
  const shouldRestock = restock ?? order.status !== 'delivered'; // delivered frozen goods can't go back on the shelf
  if (shouldRestock) await inventory.restoreForOrder(order, 'refund');
  order.paymentStatus = 'refunded';
  order.status = 'refunded';
  order.statusHistory.push({ status: 'refunded', note: reason || 'Refund issued', by });
  await order.save();
  email.send('refunded', order.email, order, order.total);
  return order;
}

async function updateStatus(order, status, { by, note = '', tracking } = {}) {
  if (status === order.status) throw new AppError('Order is already in that status', 400);
  if (status === 'cancelled') return cancelOrder(order, { by, reason: note, actor: 'admin' });
  if (status === 'refunded') return refundOrder(order, { by, reason: note });
  if (status === 'pending') throw new AppError("Orders can't be moved back to pending", 400);
  if (order.status === 'pending') {
    if (status !== 'confirmed') throw new AppError('Confirm the order first', 400);
    if (order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid') throw new AppError("Online payment hasn't been received for this order", 400);
    return confirmOrder(order, { note: note || 'Confirmed by admin' });
  }
  if (['cancelled', 'refunded'].includes(order.status)) throw new AppError(`This order is ${order.status}`, 400);
  const from = FLOW.indexOf(order.status);
  const to = FLOW.indexOf(status);
  if (to === -1 || to <= from) throw new AppError(`Can't move from ${order.status} to ${status}`, 400);

  order.status = status;
  if (tracking) order.tracking = { ...(order.tracking?.toObject?.() || order.tracking || {}), ...tracking };
  order.statusHistory.push({ status, note, by });
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cod_collected';
      await Payment.updateOne({ order: order._id, provider: 'cod' }, { $set: { status: 'paid' } });
    }
  }
  await order.save();
  const tpl = { shipped: 'shipped', out_for_delivery: 'outForDelivery', delivered: 'delivered' }[status];
  if (tpl) email.send(tpl, order.email, order);
  return order;
}

// Online orders abandoned at payment for > 24h are closed out automatically
async function expireStalePendingOrders(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);
  const stale = await Order.find({ status: 'pending', paymentMethod: 'razorpay', paymentStatus: { $ne: 'paid' }, createdAt: { $lt: cutoff } });
  for (const o of stale) {
    o.status = 'cancelled';
    o.cancelledAt = new Date();
    o.cancelReason = 'Payment not completed';
    o.statusHistory.push({ status: 'cancelled', note: 'Auto-cancelled: payment not completed within 24h' });
    await o.save();
  }
  return stale.length;
}

module.exports = { createOrder, confirmOrder, cancelOrder, refundOrder, updateStatus, expireStalePendingOrders, FLOW };
