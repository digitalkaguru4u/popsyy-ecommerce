const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/product.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { protect, optionalAuth, requireAdmin } = require('../middleware/auth');

router.get('/', c.list);
router.get('/flavours', c.flavours);
router.get('/:slug', optionalAuth, c.getBySlug);
// admin CRUD (also mirrored under /api/admin/products)
router.post('/', protect, requireAdmin, validate(v.product), c.create);
router.put('/:id', protect, requireAdmin, validate(v.product.partial().extend({ variants: v.product.shape.variants.optional() })), c.update);
router.delete('/:id', protect, requireAdmin, c.remove);

module.exports = router;
