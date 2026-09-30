const mongoose = require('mongoose');
const { Schema } = mongoose;

// Stock ledger — one row per stock movement (in pops)
const inventorySchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    change: { type: Number, required: true },
    balance: { type: Number, required: true },
    reason: { type: String, enum: ['seed', 'order', 'cancel', 'refund', 'restock', 'adjustment', 'bulk_update'], required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, createdAt: -1 });
inventorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inventory', inventorySchema);
