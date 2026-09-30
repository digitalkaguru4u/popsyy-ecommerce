const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    provider: { type: String, enum: ['razorpay', 'mock', 'cod'], required: true },
    providerOrderId: { type: String, index: true },
    providerPaymentId: { type: String, index: true },
    signature: String,
    method: String, // upi/card/netbanking/wallet/cod
    amount: { type: Number, required: true }, // rupees
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'], default: 'created' },
    failureReason: String,
    refunds: [{ refundId: String, amount: Number, status: String, at: { type: Date, default: Date.now }, _id: false }],
    events: [{ type: { type: String }, at: { type: Date, default: Date.now }, payload: Schema.Types.Mixed, _id: false }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
