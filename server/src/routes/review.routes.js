const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/review.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { strictLimiter } = require('../middleware/rateLimit');

router.get('/', c.list);
router.get('/featured', c.featured);
router.get('/mine', protect, c.mine);
router.post('/images', protect, strictLimiter, upload.array('images', 3), c.uploadImages);
router.post('/', protect, validate(v.review), c.create);

module.exports = router;
