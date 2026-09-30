const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    kind: { type: String, enum: ['product', 'box'], default: 'product' },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    sku: String,
    name: { type: String, required: true },
    flavour: String,
    variantName: String,
    packSize: { type: Number, default: 1 },
    image: String,
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    unitMrp: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    boxSelections: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, flavour: String, qty: Number, _id: false }],
  },
  { timestamps: true }
);

orderItemSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
