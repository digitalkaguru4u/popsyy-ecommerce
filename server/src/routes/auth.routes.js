const router = require('express').Router();
const c = require('../utils/wrap')(require('../controllers/auth.controller'));
const v = require('../utils/validators');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validate(v.register), c.register);
router.post('/login', authLimiter, validate(v.login), c.login);
router.post('/admin/login', authLimiter, validate(v.login), c.adminLogin);
router.post('/logout', c.logout);
router.get('/me', optionalAuth, c.me);
router.post('/forgot-password', strictLimiter, validate(v.forgot), c.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.reset), c.resetPassword);
router.put('/change-password', protect, validate(v.changePassword), c.changePassword);
router.put('/profile', protect, validate(v.profile), c.updateProfile);

module.exports = router;
