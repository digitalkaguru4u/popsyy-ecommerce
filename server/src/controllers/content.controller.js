const Banner = require('../models/Banner');
const FAQ = require('../models/FAQ');
const Newsletter = require('../models/Newsletter');
const Product = require('../models/Product');
const { getSettings } = require('../services/settings.service');
const { notifyAdmin } = require('../services/notification.service');
const email = require('../services/email.service');
const env = require('../config/env');

exports.settings = async (req, res) => {
  const s = await getSettings();
  const doc = await s.populate([{ path: 'flavourCards.product', select: 'name slug flavour colors images tagline price mrp stock isActive' }, { path: 'featuredProducts', select: 'name slug flavour colors images tagline price mrp ratingAvg ratingCount isBestseller isNewArrival stock isActive' }]);
  const out = doc.toObject();
  out.flavourCards = (out.flavourCards || []).filter((c) => c.product && c.product.isActive);
  out.featuredProducts = (out.featuredProducts || []).filter((p) => p && p.isActive);
  if (!out.flavourCards.length) {
    const ps = await Product.find({ isActive: true }).sort({ sortOrder: 1 }).limit(4).lean();
    out.flavourCards = ps.map((p) => ({ product: p, title: p.name.toUpperCase(), tagline: p.tagline, from: p.colors.from, to: p.colors.to }));
  }
  out.shipping = { freeThreshold: env.commerce.freeShippingThreshold, standard: env.commerce.standardShipping, express: env.commerce.expressShipping };
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, settings: out });
};

exports.banners = async (req, res) => {
  const now = new Date();
  const filter = { isActive: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }] }] };
  if (req.query.placement) filter.placement = req.query.placement;
  const banners = await Banner.find(filter).sort({ sortOrder: 1 }).lean();
  res.json({ success: true, banners });
};

exports.faqs = async (req, res) => {
  const faqs = await FAQ.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  res.json({ success: true, faqs });
};

exports.subscribe = async (req, res) => {
  await Newsletter.updateOne({ email: req.body.email }, { $setOnInsert: { email: req.body.email, source: req.body.source || 'newsletter' } }, { upsert: true });
  res.json({ success: true, message: "You're in the Pop Club. 🍭" });
};

exports.contact = async (req, res) => {
  const { name, email: from, message } = req.body;
  await notifyAdmin('contact', `Message from ${name}`, `${from}: ${message.slice(0, 400)}`, '/admin');
  const s = await getSettings();
  const to = s.footer?.email || env.smtp.from;
  await email.sendMail(to, { subject: `[POPSYY contact] ${name}`, html: `<p><b>${name}</b> (${from})</p><p>${message.replace(/</g, '&lt;')}</p>` });
  res.json({ success: true, message: "Got it! We'll reply within a day." });
};
