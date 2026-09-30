const User = require('../models/User');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const email = require('../services/email.service');
const { mergeGuestCart } = require('../services/cart.service');
const { signToken, setAuthCookie, clearAuthCookie, hashToken, randomToken } = require('../utils/tokens');

async function issue(req, res, user, status = 200) {
  const token = signToken(user);
  setAuthCookie(res, token);
  await mergeGuestCart(req, res, user);
  // token is also returned so non-browser clients (mobile apps, tests) can use Bearer auth
  res.status(status).json({ success: true, user: user.toSafeJSON(), token });
}

exports.register = async (req, res) => {
  const { name, email: mail, password, phone, marketingOptIn } = req.body;
  if (await User.exists({ email: mail })) throw new AppError('An account with this email already exists', 409);
  const user = await User.create({ name, email: mail, password, phone: phone || '', marketingOptIn: Boolean(marketingOptIn) });
  email.send('welcome', user.email, user);
  await issue(req, res, user, 201);
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new AppError('Wrong email or password', 401);
  if (user.isBlocked) throw new AppError('This account has been blocked. Contact support.', 403);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  await issue(req, res, user);
};

exports.adminLogin = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || user.role !== 'admin' || !(await user.comparePassword(req.body.password))) throw new AppError('Invalid admin credentials', 401);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ success: true, user: user.toSafeJSON(), token });
};

exports.logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user ? req.user.toSafeJSON() : null });
};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Always respond the same way so emails can't be enumerated
  if (user && !user.isBlocked) {
    const token = randomToken();
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const url = `${env.clientUrl}/reset-password?token=${token}`;
    await email.send('passwordReset', user.email, user, url);
    if (env.isTest) res.locals.resetToken = token;
  }
  res.json({ success: true, message: 'If that email has an account, a reset link is on its way.', ...(env.isTest && res.locals.resetToken ? { _testToken: res.locals.resetToken } : {}) });
};

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throw new AppError('This reset link is invalid or has expired', 400);
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ success: true, user: user.toSafeJSON(), token });
};

exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new AppError('Current password is incorrect', 400);
  user.password = req.body.newPassword;
  await user.save();
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ success: true, message: 'Password updated', token });
};

exports.updateProfile = async (req, res) => {
  const { name, phone, marketingOptIn } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (marketingOptIn !== undefined) req.user.marketingOptIn = marketingOptIn;
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, user: req.user.toSafeJSON() });
};
