const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, default: 1 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: false }, // shown in customer "My coupons"
  },
  { timestamps: true }
);

couponSchema.index({ isActive: 1, isPublic: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
