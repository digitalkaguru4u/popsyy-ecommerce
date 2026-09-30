const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, alt: { type: String, default: '' }, publicId: { type: String, default: '' } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    flavour: { type: String, required: true, trim: true, lowercase: true, index: true },
    tagline: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    colors: {
      from: { type: String, default: '#FF2E93' },
      to: { type: String, default: '#7B2FF7' },
      ink: { type: String, default: '#2B0A6B' },
    },
    images: [imageSchema],
    // "from" price shown on cards — synced from the default variant
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    // Stock is tracked in individual pops. Variant availability = floor(stock / packSize)
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 50 },
    weight: { type: String, default: '60 ml per pop' },
    ingredients: { type: String, default: '' },
    nutrition: [{ label: String, value: String, _id: false }],
    allergens: { type: String, default: '' },
    storage: { type: String, default: '' },
    moods: [{ type: String, lowercase: true }],
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    seo: { title: { type: String, default: '' }, description: { type: String, default: '' } },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('discountPercent').get(function discount() {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});
productSchema.virtual('variants', { ref: 'ProductVariant', localField: '_id', foreignField: 'product' });

productSchema.index({ isActive: 1, sortOrder: 1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, ratingAvg: -1 });
productSchema.index({ isActive: 1, soldCount: -1 });
productSchema.index({ name: 'text', flavour: 'text', tagline: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
