const mongoose = require('mongoose');
const { Schema } = mongoose;

// Singleton CMS document (key: "site") — everything the admin can edit on the storefront
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    announcement: { type: String, default: '' },
    hero: {
      eyebrow: String,
      headline: [String],
      subheading: String,
      ctaPrimary: { text: String, link: String },
      ctaSecondary: { text: String, link: String },
      image: String,
    },
    marquee: [String],
    boxes: [{ size: Number, price: Number, mrp: Number, label: String, _id: false }],
    flavourSection: { heading: String, subheading: String },
    flavourCards: [
      { product: { type: Schema.Types.ObjectId, ref: 'Product' }, title: String, tagline: String, from: String, to: String, image: String, _id: false },
    ],
    featuredProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    moods: [{ key: String, title: String, subtitle: String, from: String, to: String, emoji: String, _id: false }],
    socialFeed: [{ image: String, caption: String, handle: String, platform: String, link: String, _id: false }],
    about: { heading: String, body: String },
    pages: { shipping: String, returns: String, privacy: String, terms: String },
    socials: { instagram: String, tiktok: String, youtube: String },
    footer: { tagline: String, email: String, phone: String, address: String },
    seo: { title: String, description: String, ogImage: String },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
