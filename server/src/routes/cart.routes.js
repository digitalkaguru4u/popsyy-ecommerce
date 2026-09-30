const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/cart.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth); // works for guests (cookie cart) and logged-in users
router.get('/', c.get);
router.post('/', validate(v.cartAdd), c.add);
router.delete('/', c.clear);
router.post('/coupon', validate(v.coupon), c.applyCoupon);
router.delete('/coupon', c.removeCoupon);
router.put('/:item', validate(v.cartUpdate), c.update);
router.delete('/:item', c.remove);

module.exports = router;
