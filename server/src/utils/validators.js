const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const phone = z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128)
  .regex(/[A-Za-z]/, 'Password needs a letter').regex(/\d/, 'Password needs a number');
const email = z.string().trim().toLowerCase().email('Enter a valid email');

const register = z.object({ name: z.string().trim().min(2).max(80), email, password, phone: phone.optional().or(z.literal('')), marketingOptIn: z.boolean().optional() });
const login = z.object({ email, password: z.string().min(1, 'Password is required') });
const forgot = z.object({ email });
const reset = z.object({ token: z.string().min(20), password });
const changePassword = z.object({ currentPassword: z.string().min(1), newPassword: password });
const profile = z.object({ name: z.string().trim().min(2).max(80).optional(), phone: phone.optional().or(z.literal('')), marketingOptIn: z.boolean().optional() });

const address = z.object({
  label: z.enum(['home', 'work', 'other']).optional(),
  name: z.string().trim().min(2).max(80),
  phone,
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  landmark: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  isDefault: z.boolean().optional(),
});

const cartAdd = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('product'), productId: objectId, variantId: objectId, qty: z.coerce.number().int().min(1).max(50).default(1) }),
  z.object({
    kind: z.literal('box'),
    size: z.coerce.number().int().refine((n) => [6, 12, 24].includes(n), 'Box size must be 6, 12 or 24'),
    selections: z.array(z.object({ productId: objectId, qty: z.coerce.number().int().min(1).max(24) })).min(1).max(10),
    qty: z.coerce.number().int().min(1).max(10).default(1),
  }),
]);
const cartUpdate = z.object({ qty: z.coerce.number().int().min(1).max(50) });
const coupon = z.object({ code: z.string().trim().min(2).max(30) });

const createOrder = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: email.optional(),
  phone: phone.optional(),
  addressId: objectId.optional(),
  address: address.extend({ save: z.boolean().optional() }).optional(),
  deliveryMethod: z.enum(['standard', 'express']).default('standard'),
  paymentMethod: z.enum(['razorpay', 'cod']),
}).refine((d) => d.addressId || d.address, { message: 'Shipping address is required', path: ['address'] });

const paymentCreate = z.object({ orderId: objectId });
const paymentVerify = z.union([
  z.object({ provider: z.literal('mock'), orderId: objectId, providerOrderId: z.string().min(5), outcome: z.enum(['success', 'failed']), method: z.string().optional(), reason: z.string().max(200).optional() }),
  z.object({ provider: z.literal('razorpay').optional(), orderId: objectId, razorpay_order_id: z.string().min(5), razorpay_payment_id: z.string().min(5), razorpay_signature: z.string().min(10) }),
]);
const paymentFailed = z.object({ orderId: objectId, providerOrderId: z.string().min(5), reason: z.string().max(300).optional() });

const review = z.object({ productId: objectId, rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(100).optional().default(''), body: z.string().trim().min(5).max(1500), images: z.array(z.string().url().max(500)).max(3).optional().default([]) });

const variant = z.object({
  _id: objectId.optional(),
  name: z.string().trim().min(1).max(60),
  packSize: z.coerce.number().int().min(1).max(100),
  sku: z.string().trim().min(2).max(40),
  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const product = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug can only have a-z, 0-9 and dashes').optional(),
  flavour: z.string().trim().min(2).max(40),
  tagline: z.string().max(120).optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  category: objectId.optional().nullable(),
  colors: z.object({ from: z.string().max(20), to: z.string().max(20), ink: z.string().max(20).optional() }).optional(),
  images: z.array(z.object({ url: z.string().min(1).max(500), alt: z.string().max(200).optional(), publicId: z.string().max(200).optional() })).max(12).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  weight: z.string().max(60).optional(),
  ingredients: z.string().max(2000).optional(),
  nutrition: z.array(z.object({ label: z.string().max(60), value: z.string().max(60) })).max(20).optional(),
  allergens: z.string().max(1000).optional(),
  storage: z.string().max(1000).optional(),
  moods: z.array(z.string().max(30)).max(10).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  seo: z.object({ title: z.string().max(120).optional(), description: z.string().max(300).optional() }).optional(),
  variants: z.array(variant).min(1, 'Add at least one pack size').max(10),
});

const couponAdmin = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'Code: 3–30 letters/numbers'),
  description: z.string().max(200).optional().default(''),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).default(0),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().int().min(0).default(0),
  perUserLimit: z.coerce.number().int().min(0).default(1),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
}).refine((c) => c.discountType !== 'percentage' || c.value <= 100, { message: 'Percentage cannot exceed 100', path: ['value'] });

const orderStatus = z.object({
  status: z.enum(['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']),
  note: z.string().max(500).optional().default(''),
  tracking: z.object({ carrier: z.string().max(60).optional(), awb: z.string().max(60).optional(), url: z.string().max(300).optional() }).optional(),
});

const stockAdjust = z.object({ productId: objectId, mode: z.enum(['set', 'add', 'remove']), quantity: z.coerce.number().int().min(0), note: z.string().max(200).optional().default('') });
const bulkStock = z.object({ items: z.array(z.object({ productId: objectId, stock: z.coerce.number().int().min(0) })).min(1).max(200), note: z.string().max(200).optional().default('') });

const banner = z.object({
  title: z.string().trim().min(1).max(120), subtitle: z.string().max(300).optional(), ctaText: z.string().max(40).optional(), ctaLink: z.string().max(300).optional(),
  image: z.string().max(500).optional(), colorFrom: z.string().max(20).optional(), colorTo: z.string().max(20).optional(),
  placement: z.enum(['home_promo', 'announcement', 'shop_top']).optional(), isActive: z.boolean().optional(), sortOrder: z.coerce.number().int().optional(),
  startsAt: z.coerce.date().optional().nullable(), endsAt: z.coerce.date().optional().nullable(),
});
const faq = z.object({ question: z.string().trim().min(3).max(300), answer: z.string().trim().min(3).max(3000), category: z.string().max(40).optional(), sortOrder: z.coerce.number().int().optional(), isActive: z.boolean().optional() });

const newsletter = z.object({ email, source: z.string().max(30).optional() });
const contact = z.object({ name: z.string().trim().min(2).max(80), email, message: z.string().trim().min(5).max(2000) });
const track = z.object({ orderNumber: z.string().trim().toUpperCase().min(5).max(30), email });

module.exports = {
  z, objectId, register, login, forgot, reset, changePassword, profile, address, cartAdd, cartUpdate, coupon, createOrder,
  paymentCreate, paymentVerify, paymentFailed, review, product, couponAdmin, orderStatus, stockAdjust, bulkStock, banner, faq,
  newsletter, contact, track,
};
