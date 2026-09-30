const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    ctaText: { type: String, default: '' },
    ctaLink: { type: String, default: '' },
    image: { type: String, default: '' },
    colorFrom: { type: String, default: '#FF2E93' },
    colorTo: { type: String, default: '#FF8A00' },
    placement: { type: String, enum: ['home_promo', 'announcement', 'shop_top'], default: 'home_promo', index: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
