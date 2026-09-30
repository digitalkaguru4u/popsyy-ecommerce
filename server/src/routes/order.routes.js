const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/order.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/track', authLimiter, validate(v.track), c.track);
router.use(protect);
router.post('/', validate(v.createOrder), c.create);
router.get('/', c.listMine);
router.get('/:id', c.getMine);
router.get('/:id/invoice', c.invoiceMine);
router.post('/:id/cancel', c.cancelMine);

module.exports = router;
