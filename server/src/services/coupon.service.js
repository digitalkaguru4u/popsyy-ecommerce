const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const { round2 } = require('../utils/helpers');

function computeDiscount(coupon, subtotal) {
  let d = coupon.discountType === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.discountType === 'percentage' && coupon.maxDiscount > 0) d = Math.min(d, coupon.maxDiscount);
  return round2(Math.min(d, subtotal));
}

async function validateCoupon(code, { userId, subtotal }) {
  if (!code) throw new AppError('Enter a coupon code', 400);
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  const now = new Date();
  if (!coupon || !coupon.isActive) throw new AppError("That code doesn't exist (or it melted)", 404);
  if (coupon.startsAt && coupon.startsAt > now) throw new AppError('This code is not live yet', 400);
  if (coupon.expiresAt && coupon.expiresAt < now) throw new AppError('This code has expired', 400);
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new AppError('This code has hit its usage limit', 400);
  if (subtotal < coupon.minOrder) throw new AppError(`Add ₹${round2(coupon.minOrder - subtotal)} more to use ${coupon.code}`, 400);
  if (userId && coupon.perUserLimit > 0) {
    const used = await Order.countDocuments({ user: userId, couponCode: coupon.code, couponCounted: true });
    if (used >= coupon.perUserLimit) throw new AppError("You've already used this code", 400);
  }
  return { coupon, discount: computeDiscount(coupon, subtotal) };
}

module.exports = { validateCoupon, computeDiscount };
