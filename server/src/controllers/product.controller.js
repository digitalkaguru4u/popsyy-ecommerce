const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { escapeRegex, paginate, slugify } = require('../utils/helpers');
const inventory = require('../services/inventory.service');
const { uploadImage, deleteImage } = require('../services/upload.service');

const SORTS = {
  popular: { soldCount: -1, ratingAvg: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  newest: { createdAt: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
  featured: { sortOrder: 1 },
};

async function withVariants(products, { includeInactive = false } = {}) {
  const ids = products.map((p) => p._id);
  const vq = { product: { $in: ids } };
  if (!includeInactive) vq.isActive = true;
  const variants = await ProductVariant.find(vq).sort({ sortOrder: 1, packSize: 1 }).lean();
  return products.map((p) => {
    const vs = variants.filter((v) => String(v.product) === String(p._id)).map((v) => ({ ...v, available: Math.floor((p.stock || 0) / v.packSize) }));
    const discountPercent = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    return { ...p, variants: vs, discountPercent, inStock: (p.stock || 0) > 0 };
  });
}

// GET /api/products — search, filter, sort, paginate
exports.list = async (req, res) => {
  const q = req.query;
  const { page, limit, skip } = paginate(q);
  const filter = { isActive: true };
  if (q.search) {
    const rx = new RegExp(escapeRegex(String(q.search).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { flavour: rx }, { tagline: rx }, { shortDescription: rx }];
  }
  if (q.flavour) filter.flavour = { $in: String(q.flavour).split(',').map((s) => s.trim().toLowerCase()) };
  if (q.mood) filter.moods = { $in: String(q.mood).split(',').map((s) => s.trim().toLowerCase()) };
  if (q.minPrice || q.maxPrice) {
    filter.price = {};
    if (q.minPrice) filter.price.$gte = Number(q.minPrice) || 0;
    if (q.maxPrice) filter.price.$lte = Number(q.maxPrice) || 1e9;
  }
  if (q.inStock === 'true') filter.stock = { $gt: 0 };
  if (q.bestseller === 'true') filter.isBestseller = true;
  if (q.new === 'true') filter.isNewArrival = true;
  if (q.featured === 'true') filter.isFeatured = true;
  if (q.minRating) filter.ratingAvg = { $gte: Number(q.minRating) || 0 };
  if (q.packSize) {
    const sizes = String(q.packSize).split(',').map(Number).filter(Boolean);
    const pids = await ProductVariant.distinct('product', { packSize: { $in: sizes }, isActive: true });
    filter._id = { $in: pids };
  }
  const sort = SORTS[q.sort] || SORTS.featured;
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products: await withVariants(items), page, limit, total, pages: Math.ceil(total / limit) || 1 });
};

// GET /api/products/:slug
exports.getBySlug = async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!p) throw new AppError('This pop melted (product not found)', 404);
  const [product] = await withVariants([p]);
  const related = await Product.find({ _id: { $ne: p._id }, isActive: true }).sort({ soldCount: -1 }).limit(4).lean();

  // "Frequently bought together" — products co-occurring in orders with this one
  let fbt = [];
  const orderIds = await OrderItem.distinct('order', { product: p._id });
  if (orderIds.length) {
    const co = await OrderItem.find({ order: { $in: orderIds.slice(-500) }, product: { $ne: p._id, $exists: true } }).select('product').lean();
    const counts = {};
    co.forEach((c) => { counts[c.product] = (counts[c.product] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
    fbt = await Product.find({ _id: { $in: top }, isActive: true }).lean();
  }
  if (fbt.length < 2) fbt = [...fbt, ...related.filter((r) => !fbt.some((f) => String(f._id) === String(r._id)))].slice(0, 2);

  if (req.user) {
    await User.updateOne({ _id: req.user._id }, { $pull: { recentlyViewed: p._id } });
    await User.updateOne({ _id: req.user._id }, { $push: { recentlyViewed: { $each: [p._id], $position: 0, $slice: 12 } } });
  }
  res.json({ success: true, product, related: await withVariants(related), frequentlyBoughtTogether: await withVariants(fbt) });
};

exports.flavours = async (req, res) => {
  const items = await Product.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  res.json({ success: true, products: await withVariants(items) });
};

/* ---------------- ADMIN ---------------- */

exports.adminList = async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 50 });
  const filter = {};
  if (req.query.search) filter.name = new RegExp(escapeRegex(String(req.query.search)), 'i');
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products: await withVariants(items, { includeInactive: true }), total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.adminGet = async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) throw new AppError('Product not found', 404);
  const [product] = await withVariants([p], { includeInactive: true });
  res.json({ success: true, product });
};

async function syncVariants(product, variants) {
  if (!variants.some((v) => v.isDefault)) variants[0].isDefault = true;
  const keep = [];
  for (const [i, v] of variants.entries()) {
    const data = { product: product._id, name: v.name, packSize: v.packSize, sku: v.sku.toUpperCase(), price: v.price, mrp: Math.max(v.mrp, v.price), isDefault: Boolean(v.isDefault), isActive: v.isActive !== false, sortOrder: i };
    let doc;
    if (v._id) doc = await ProductVariant.findOneAndUpdate({ _id: v._id, product: product._id }, data, { returnDocument: 'after', runValidators: true });
    if (!doc) doc = await ProductVariant.create(data);
    keep.push(doc);
  }
  await ProductVariant.deleteMany({ product: product._id, _id: { $nin: keep.map((d) => d._id) } });
  const def = keep.find((d) => d.isDefault) || keep[0];
  product.price = def.price;
  product.mrp = def.mrp;
  await product.save();
}

exports.create = async (req, res) => {
  const { variants, stock = 0, ...data } = req.body;
  data.slug = data.slug || slugify(data.name);
  if (await Product.exists({ slug: data.slug })) throw new AppError('A product with this slug already exists', 409);
  const product = await Product.create({ ...data, stock: 0, price: variants[0].price, mrp: variants[0].mrp });
  try {
    await syncVariants(product, variants);
  } catch (e) {
    await ProductVariant.deleteMany({ product: product._id });
    await product.deleteOne();
    throw e;
  }
  if (stock > 0) await inventory.adjust(product._id, stock, 'restock', { by: req.user._id, note: 'Initial stock' });
  res.status(201).json({ success: true, product: await Product.findById(product._id).lean() });
};

exports.update = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const { variants, stock, ...data } = req.body;
  if (data.slug && data.slug !== product.slug && (await Product.exists({ slug: data.slug }))) throw new AppError('Slug already in use', 409);
  Object.assign(product, data);
  await product.save();
  if (variants) await syncVariants(product, variants);
  if (stock !== undefined && stock !== product.stock) await inventory.setStock(product._id, stock, 'adjustment', { by: req.user._id, note: 'Edited in product form' });
  res.json({ success: true, product: await Product.findById(product._id).lean() });
};

exports.toggle = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  product.isActive = req.body.isActive ?? !product.isActive;
  await product.save();
  res.json({ success: true, product });
};

exports.remove = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const hasOrders = await OrderItem.exists({ product: product._id });
  if (hasOrders) {
    // keep order history intact — soft delete
    product.isActive = false;
    await product.save();
    return res.json({ success: true, softDeleted: true, message: 'Product has orders, so it was deactivated instead of deleted.' });
  }
  await Promise.all(product.images.map((i) => deleteImage(i.publicId)));
  await ProductVariant.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ success: true });
};

exports.uploadImages = async (req, res) => {
  if (!req.files?.length) throw new AppError('No images uploaded', 400);
  const uploaded = [];
  for (const f of req.files) uploaded.push(await uploadImage(f, req.query.folder === 'cms' ? 'popsyy/cms' : 'popsyy/products'));
  res.status(201).json({ success: true, images: uploaded });
};

exports.deleteImage = async (req, res) => {
  await deleteImage(req.body.publicId);
  res.json({ success: true });
};
