const mongoose = require('mongoose');
const { Schema } = mongoose;

const selectionSchema = new Schema(
  { product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, qty: { type: Number, min: 1, required: true } },
  { _id: false }
);

const cartItemSchema = new Schema({
  kind: { type: String, enum: ['product', 'box'], default: 'product' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
  qty: { type: Number, min: 1, max: 50, default: 1 },
  box: { size: Number, selections: [selectionSchema] },
});

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestId: { type: String },
    items: [cartItemSchema],
    couponCode: { type: String, default: '' },
    expiresAt: { type: Date }, // only set for guest carts
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true } } });
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $exists: true } } });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Cart', cartSchema);
