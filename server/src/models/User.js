const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    isBlocked: { type: Boolean, default: false },
    marketingOptIn: { type: Boolean, default: false },
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    marketingOptIn: this.marketingOptIn,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
