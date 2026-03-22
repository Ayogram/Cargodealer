const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'dealer', 'customer'], 
    default: 'customer' 
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  hasVerifiedID: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  suiteNumber: { type: String, default: '' }, // e.g., '150-5628'
  preferences: {
    autoShip: { type: Boolean, default: false },
    askBeforeShip: { type: Boolean, default: true },
    consolidate: { type: Boolean, default: false },
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
