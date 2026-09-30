const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ['admin', 'user'], default: 'admin', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true }, // new_order, low_stock, out_of_stock, payment_failed, refund, review, stock_conflict
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
