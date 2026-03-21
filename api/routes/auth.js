const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Token = require('../models/Token');

const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cargodealer_temp';
const ALLOWED_ADMINS = ['ajumobiayomipo@gmail.com'];

// Middleware to check DB connection
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // If we are in local development, allow 'mock' login/register for testing
    if (process.env.NODE_ENV !== 'production' || !process.env.MONGO_URI) {
      console.warn('⚠️ Using Mock Auth Mode (Database offline)');
      return next(); 
    }
    return res.status(503).json({ 
      msg: 'Database not connected. Please ensure MongoDB is running or provide a valid MONGO_URI in the .env file.' 
    });
  }
  next();
};

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Register
router.post('/register', checkDB, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ name, email, password, role: role || 'customer' });
    await user.save();

    // Create verification token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
    });
    await token.save();

    // Attempt to send email (won't throw if fails, just log it)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const url = `${req.protocol}://${req.get('host')}/api/auth/verify/${user._id}/${token.token}`;
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Verify your CargoDealer Account',
        text: `Please click this link to verify your email address: \n\n${url}`,
      }).catch(err => console.error('Email send error:', err));
    }

    // STRICTOR MODE: No automatic login until verified.
    res.json({ 
      msg: 'Registration successful! Please check your email and click the verification link to activate your account.',
      requiresVerification: true 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify Email Route
router.get('/verify/:id/:token', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send('Invalid link');

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    // Ignore invalid/expired tokens to simplify
    if (!token) return res.status(400).send('Invalid link');

    user.isVerified = true;
    await user.save();
    await token.deleteOne();

    res.send('<h2 style="color:green;font-family:sans-serif;padding:50px;">Email successfully verified! You may now return to the app or login.</h2>');
  } catch (error) {
    res.status(400).send('Error Occurred');
  }
});

// Login (General User Portal)
router.post('/login', checkDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    // MOCK MODE: Handle login if DB is offline
    if (mongoose.connection.readyState !== 1) {
      if (email === 'test@example.com' && password === 'password') {
        return res.json({ 
          token: 'mock_token_123', 
          user: { id: 'mock_id', name: 'Mock User', email: 'test@example.com', role: 'customer', isVerified: true } 
        });
      }
      return res.status(503).json({ 
        msg: 'Database offline. For testing, use "test@example.com" with "password".' 
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if user is trying to login to user portal but is only allowed on admin?
    // Actually, usually admin can use user portal too. 
    
    // Strict Email Verification Check
    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Please verify your email address before logging in. Check your inbox.' });
    }

    // Normal Login Success
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email, role: user.role, isVerified: user.isVerified } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin-Only Login (Dedicated Portal)
router.post('/admin-login', checkDB, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // MOCK MODE: Admin bypass
    if (mongoose.connection.readyState !== 1) {
      if (email === 'ajumobiayomipo@gmail.com' && password === 'admin123') {
        return res.json({ 
          token: 'mock_admin_token', 
          user: { id: 'admin_id', name: 'Admin User', email: 'ajumobiayomipo@gmail.com', role: 'admin', isVerified: true } 
        });
      }
      return res.status(503).json({ 
        msg: 'DB offline. Admin test: "ajumobiayomipo@gmail.com" / "admin123".' 
      });
    }

    // STRICT FILTER: Only emails in ALLOWED_ADMINS can use this route
    if (!ALLOWED_ADMINS.includes(email.toLowerCase())) {
      return res.status(403).json({ msg: 'Access Denied: Unauthorized Admin Email.' });
    }
    // ... continue normal logic ...

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: 'Invalid Admin Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid Admin Credentials' });
    }

    // Trigger 2FA for Admin
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Admin Secure Access - Verification Code',
        text: `Your admin verification code is: ${otp}.`,
      }).catch(err => console.error('Admin OTP email error:', err));
    } else {
      console.log(`[TEST MODE] Admin Security OTP for ${user.email} is: ${otp}`);
    }

    res.json({ requiresOtp: true, msg: 'Security code sent to your admin email.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify Admin OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ msg: 'User not found.' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired verification code.' });
    }

    // Clear OTP upon success
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email, role: user.role, isVerified: user.isVerified } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('User with given email does not exist');

    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex'),
      }).save();
    }

    const link = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${user._id}/${token.token}`;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Password Reset Request',
        text: `Click the link to reset your password: \n\n${link}`,
      });
    }

    res.send('Password reset link sent to your email account');
  } catch (error) {
    res.status(500).send('Error occurring during password reset request');
  }
});

// Reset Password
router.post('/reset-password/:id/:token', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(400).send('Invalid link or expired');

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send('Invalid link or expired');

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    await user.save();
    await token.deleteOne();

    res.send('Password reset successfully.');
  } catch (error) {
    res.status(500).send('Error occurred while resetting password');
  }
});

// Google Login Route
router.post('/google', checkDB, async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    const isAdmin = ALLOWED_ADMINS.includes(email);
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        name,
        email,
        password: Math.random().toString(36).slice(-10), // Random password for oauth users
        role: isAdmin ? 'admin' : 'customer',
        isVerified: true // Google accounts are pre-verified
      });
      await user.save();
    } else if (isAdmin && user.role !== 'admin') {
      // Upgrade existing user to admin if they are on the list
      user.role = 'admin';
      await user.save();
    }

    // Success: Issue JWT
    const jwtPayload = { user: { id: user.id, role: user.role } };
    jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email, role: user.role, isVerified: user.isVerified } });
    });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    res.status(401).json({ msg: 'Google Token Verification Failed' });
  }
});

module.exports = router;
