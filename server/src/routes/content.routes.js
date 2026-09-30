const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/content.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { strictLimiter } = require('../middleware/rateLimit');

router.get('/settings', c.settings);
router.get('/banners', c.banners);
router.get('/faqs', c.faqs);
router.post('/newsletter', strictLimiter, validate(v.newsletter), c.subscribe);
router.post('/contact', strictLimiter, validate(v.contact), c.contact);

module.exports = router;
