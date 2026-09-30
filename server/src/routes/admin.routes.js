const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/admin.controller'));
const p = require('../utils/wrap')(require('../controllers/product.controller'));
const r = require('../utils/wrap')(require('../controllers/review.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('/dashboard', c.dashboard);
router.get('/analytics', c.analytics);
router.get('/system', c.system);
router.get('/notifications', c.notifications);
router.post('/notifications/read', c.markNotificationsRead);
router.get('/subscribers', c.subscribers);

// products
router.get('/products', p.adminList);
router.get('/products/:id', p.adminGet);
router.post('/products', validate(v.product), p.create);
router.put('/products/:id', validate(v.product.partial().extend({ variants: v.product.shape.variants.optional() })), p.update);
router.patch('/products/:id/toggle', p.toggle);
router.delete('/products/:id', p.remove);
router.post('/uploads', upload.array('images', 10), p.uploadImages);
router.post('/uploads/delete', p.deleteImage);

// orders
router.get('/orders', c.listOrders);
router.get('/orders/:id', c.getOrder);
router.put('/orders/:id/status', validate(v.orderStatus), c.updateOrderStatus);
router.post('/orders/:id/notes', c.addOrderNote);
router.put('/orders/:id/tracking', c.updateTracking);
router.get('/orders/:id/invoice', c.invoice);

// customers
router.get('/customers', c.listCustomers);
router.get('/customers/:id', c.getCustomer);
router.put('/customers/:id/block', c.blockCustomer);

// coupons
router.get('/coupons', c.listCoupons);
router.post('/coupons', validate(v.couponAdmin), c.createCoupon);
router.put('/coupons/:id', validate(v.couponAdmin), c.updateCoupon);
router.delete('/coupons/:id', c.deleteCoupon);

// inventory
router.get('/inventory', c.inventory);
router.get('/inventory/history', c.inventoryHistory);
router.post('/inventory/adjust', validate(v.stockAdjust), c.adjustStock);
router.post('/inventory/bulk', validate(v.bulkStock), c.bulkStock);

// reviews
router.get('/reviews', r.adminList);
router.put('/reviews/:id', r.moderate);
router.delete('/reviews/:id', r.remove);

// CMS
router.get('/cms', c.getCms);
router.put('/cms', c.updateCms);
router.get('/banners', c.listBanners);
router.post('/banners', validate(v.banner), c.createBanner);
router.put('/banners/:id', validate(v.banner), c.updateBanner);
router.delete('/banners/:id', c.deleteBanner);
router.get('/faqs', c.listFaqs);
router.post('/faqs', validate(v.faq), c.createFaq);
router.put('/faqs/:id', validate(v.faq), c.updateFaq);
router.delete('/faqs/:id', c.deleteFaq);

module.exports = router;
