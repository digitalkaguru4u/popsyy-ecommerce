const mongoose = require('mongoose');
const { Schema } = mongoose;

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'cod_pending', 'cod_collected'];

const addressSnapshot = new Schema(
  {
    name: String, phone: String, line1: String, line2: String, landmark: String,
    city: String, state: String, pincode: String, country: { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }],
    itemCount: { type: Number, default: 0 },
    shippingAddress: { type: addressSnapshot, required: true },
    deliveryMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
    subtotal: { type: Number, required: true },
    mrpTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    shippingFee: { type: Number, default: 0 },
    codFee: { type: Number, default: 0 },
    taxIncluded: { type: Number, default: 0 }, // GST component included in prices
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [
      { status: String, note: String, at: { type: Date, default: Date.now }, by: { type: Schema.Types.ObjectId, ref: 'User' }, _id: false },
    ],
    internalNotes: [{ text: String, at: { type: Date, default: Date.now }, by: String }],
    tracking: { carrier: String, awb: String, url: String },
    stockDeducted: { type: Boolean, default: false },
    couponCounted: { type: Boolean, default: false },
    confirmedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ couponCode: 1, user: 1 });

orderSchema.statics.STATUSES = ORDER_STATUSES;
orderSchema.statics.PAYMENT_STATUSES = PAYMENT_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
