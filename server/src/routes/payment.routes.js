const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/payment.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

// NOTE: /webhook is mounted in app.js with express.raw() before the JSON parser
router.get('/config', c.config);
router.post('/create', protect, validate(v.paymentCreate), c.create);
router.post('/verify', protect, validate(v.paymentVerify), c.verify);
router.post('/failed', protect, validate(v.paymentFailed), c.failed);

module.exports = router;
