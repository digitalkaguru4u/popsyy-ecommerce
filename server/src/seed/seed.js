/* eslint-disable no-console */
/**
 * POPSYY seed
 *   npm run seed                → seeds an empty database (idempotent: skips what exists)
 *   npm run seed -- --fresh     → wipes ALL collections first (refused in production unless --force)
 *   npm run seed -- --no-samples→ skip sample reviews + demo customer (use this for production)
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');
const M = require('../models');
const { FLAVOURS, PACKS, COMMON, defaultSettings, FAQS, COUPONS, REVIEWS } = require('./defaults');
const { recomputeRating } = require('../controllers/review.controller');

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const NO_SAMPLES = args.includes('--no-samples') || (env.isProd && !args.includes('--with-samples'));

async function seed({ fresh = FRESH, samples = !NO_SAMPLES, log = console.log } = {}) {
  if (fresh) {
    if (env.isProd && !args.includes('--force')) throw new Error('Refusing to wipe a production database without --force');
    for (const model of Object.values(M)) await model.deleteMany({});
    log('[seed] wiped all collections');
  }

  // Admin
  if (!env.admin.password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to seed the admin account');
  let admin = await M.User.findOne({ email: env.admin.email });
  if (!admin) {
    admin = await M.User.create({ name: env.admin.name, email: env.admin.email, password: env.admin.password, role: 'admin' });
    log(`[seed] admin created: ${env.admin.email}`);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save({ validateBeforeSave: false });
  }

  // Demo customer (dev/testing only)
  if (samples && !(await M.User.exists({ email: 'demo@popsyy.in' }))) {
    const demo = await M.User.create({ name: 'Demo Popper', email: 'demo@popsyy.in', password: 'Demo@12345', phone: '9876543210' });
    await M.Address.create({ user: demo._id, name: 'Demo Popper', phone: '9876543210', line1: '42, Sunshine Apartments, Linking Road', line2: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', isDefault: true });
    log('[seed] demo customer: demo@popsyy.in / Demo@12345');
  }

  // Category
  let category = await M.Category.findOne({ slug: 'ice-pops' });
  if (!category) category = await M.Category.create({ name: 'Ice Pops', slug: 'ice-pops', description: 'Real fruit ice pops' });

  // Products + variants + opening stock
  const products = [];
  for (const f of FLAVOURS) {
    let p = await M.Product.findOne({ slug: f.slug });
    if (!p) {
      const base = f.premium ? PACKS[0].premium : PACKS[0];
      p = await M.Product.create({
        ...COMMON,
        name: f.name, slug: f.slug, flavour: f.flavour, tagline: f.tagline, shortDescription: f.shortDescription, description: f.description,
        category: category._id, colors: f.colors, ingredients: f.ingredients, nutrition: f.nutrition, moods: f.moods,
        isBestseller: Boolean(f.isBestseller), isNewArrival: Boolean(f.isNewArrival), isFeatured: Boolean(f.isFeatured), sortOrder: f.sortOrder,
        images: [
          { url: `/images/products/${f.slug}.svg`, alt: `POPSYY ${f.name} ice pop` },
          { url: `/images/brand/card-${f.slug}.jpg`, alt: `POPSYY ${f.name} flavour card` },
        ],
        price: base.price, mrp: base.mrp, stock: f.stock, lowStockThreshold: env.commerce.lowStockThreshold,
        seo: { title: `${f.name} Ice Pop — ${f.tagline} | POPSYY`, description: f.shortDescription },
      });
      const code = f.slug.split('-').map((w) => w.slice(0, 3)).join('').toUpperCase();
      for (const [i, pack] of PACKS.entries()) {
        const pr = f.premium ? pack.premium : pack;
        await M.ProductVariant.create({ product: p._id, name: pack.name, packSize: pack.packSize, sku: `PSY-${code}-${String(pack.packSize).padStart(2, '0')}`, price: pr.price, mrp: pr.mrp, isDefault: i === 0, sortOrder: i });
      }
      await M.Inventory.create({ product: p._id, change: f.stock, balance: f.stock, reason: 'seed', note: 'Opening stock' });
      log(`[seed] product: ${f.name}`);
    }
    products.push(p);
  }
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

  // Sample reviews (clearly flagged isSample — delete before launch)
  if (samples && !(await M.Review.exists({ isSample: true }))) {
    for (const r of REVIEWS) {
      await M.Review.create({ product: bySlug[r.slug]._id, authorName: r.name, rating: r.rating, title: r.title, body: r.body, status: 'approved', isFeatured: r.featured, isSample: true });
    }
    log(`[seed] ${REVIEWS.length} SAMPLE reviews (flagged isSample)`);
  }
  for (const p of products) await recomputeRating(p._id);

  // Coupons
  for (const c of COUPONS) {
    if (!(await M.Coupon.exists({ code: c.code }))) await M.Coupon.create({ ...c, startsAt: new Date(Date.now() - 86400000) });
  }

  // FAQs
  if (!(await M.FAQ.exists({}))) await M.FAQ.insertMany(FAQS.map((f, i) => ({ question: f.q, answer: f.a, category: f.c, sortOrder: i })));

  // Banners
  if (!(await M.Banner.exists({}))) {
    await M.Banner.create({ title: 'BUILD YOUR OWN BOX', subtitle: 'Mix any 4 flavours. Save up to 27%.', ctaText: 'START BUILDING', ctaLink: '/build-your-box', colorFrom: '#FF2E93', colorTo: '#FF8A00', placement: 'home_promo' });
  }

  // CMS settings
  let s = await M.SiteSettings.findOne({ key: 'site' });
  if (!s) {
    const d = defaultSettings();
    s = await M.SiteSettings.create({
      key: 'site', ...d,
      flavourCards: FLAVOURS.map((f) => ({ product: bySlug[f.slug]._id, title: f.name.toUpperCase(), tagline: f.tagline, from: f.colors.from, to: f.colors.to, image: `/images/products/${f.slug}.svg` })),
      featuredProducts: products.map((p) => p._id),
    });
    log('[seed] CMS settings');
  }
  return { admin, products };
}

module.exports = { seed };

if (require.main === module) {
  connectDB()
    .then(() => seed())
    .then(() => { console.log('[seed] done ✔'); return mongoose.disconnect(); })
    .catch(async (e) => { console.error('[seed] failed:', e.message); await mongoose.disconnect(); process.exit(1); });
}
