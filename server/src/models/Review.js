const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true, trim: true, maxlength: 60 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100, default: '' },
    body: { type: String, trim: true, maxlength: 1500, required: true },
    images: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    isFeatured: { type: Boolean, default: false },
    isVerifiedPurchase: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false }, // seeded demo content — remove before launch
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true } } });
reviewSchema.index({ isFeatured: 1, status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
