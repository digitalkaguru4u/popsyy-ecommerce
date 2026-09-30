const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const OrderItem = require('../models/OrderItem');
const { notifyAdmin } = require('./notification.service');

// Aggregate pops needed per product for an order's items
function popsByProduct(items) {
  const map = new Map();
  const add = (id, n) => { const k = String(id); map.set(k, (map.get(k) || 0) + n); };
  for (const it of items) {
    if (it.kind === 'box') for (const s of it.boxSelections || []) add(s.product, s.qty * it.qty);
    else add(it.product, (it.packSize || 1) * it.qty);
  }
  return map;
}

async function checkStockLevel(product) {
  if (product.stock <= 0) await notifyAdmin('out_of_stock', `${product.name} is OUT of stock`, 'Restock to keep it live.', `/admin/inventory`);
  else if (product.stock <= (product.lowStockThreshold || 50)) await notifyAdmin('low_stock', `${product.name} is running low`, `${product.stock} pops left.`, `/admin/inventory`);
}

async function adjust(productId, change, reason, { order, by, note = '' } = {}) {
  let product;
  if (change < 0) {
    // atomic conditional decrement — never goes below zero
    product = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: -change } },
      { $inc: { stock: change } },
      { returnDocument: 'after' }
    );
    if (!product) return { ok: false };
  } else {
    product = await Product.findByIdAndUpdate(productId, { $inc: { stock: change } }, { returnDocument: 'after' });
    if (!product) return { ok: false };
  }
  await Inventory.create({ product: productId, change, balance: product.stock, reason, order, by, note });
  if (change < 0) await checkStockLevel(product);
  return { ok: true, product };
}

async function setStock(productId, newStock, reason, { by, note } = {}) {
  const product = await Product.findById(productId);
  if (!product) return { ok: false };
  const change = newStock - product.stock;
  if (change === 0) return { ok: true, product };
  return adjust(productId, change, reason, { by, note });
}

async function deductForOrder(order) {
  if (order.stockDeducted) return { shortfalls: [] };
  const items = await OrderItem.find({ order: order._id });
  const shortfalls = [];
  for (const [productId, pops] of popsByProduct(items)) {
    const r = await adjust(productId, -pops, 'order', { order: order._id, note: order.orderNumber });
    if (!r.ok) shortfalls.push({ productId, pops });
    await Product.updateOne({ _id: productId }, { $inc: { soldCount: pops } });
  }
  order.stockDeducted = true;
  if (shortfalls.length) {
    order.internalNotes.push({ text: `Stock shortfall at confirmation for ${shortfalls.length} product(s) — verify before packing.`, by: 'system' });
    await notifyAdmin('stock_conflict', `Stock shortfall on ${order.orderNumber}`, 'Order confirmed but inventory was insufficient.', `/admin/orders/${order._id}`);
  }
  return { shortfalls };
}

async function restoreForOrder(order, reason = 'cancel') {
  if (!order.stockDeducted) return;
  const items = await OrderItem.find({ order: order._id });
  for (const [productId, pops] of popsByProduct(items)) {
    await adjust(productId, pops, reason, { order: order._id, note: order.orderNumber });
    await Product.updateOne({ _id: productId, soldCount: { $gte: pops } }, { $inc: { soldCount: -pops } });
  }
  order.stockDeducted = false;
}

module.exports = { adjust, setStock, deductForOrder, restoreForOrder, popsByProduct };
