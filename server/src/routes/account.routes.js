const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/account.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', c.summary);
router.get('/wishlist', c.getWishlist);
router.post('/wishlist/:productId', c.toggleWishlist);
router.get('/addresses', c.listAddresses);
router.post('/addresses', validate(v.address), c.createAddress);
router.put('/addresses/:id', validate(v.address.partial()), c.updateAddress);
router.delete('/addresses/:id', c.deleteAddress);
router.get('/recently-viewed', c.recentlyViewed);
router.get('/coupons', c.coupons);

module.exports = router;
