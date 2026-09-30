const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "Pack of 6"
    packSize: { type: Number, required: true, min: 1 }, // pops per pack
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductVariant', variantSchema);
