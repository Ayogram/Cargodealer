const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Token = require('../models/Token');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_cargodealer_temp';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ name, email, password, role: role || 'admin' });
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

    // For testing/prototype purposes, we still log them in immediately,
    // but in strict mode, you'd require them to hit the link first.
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: 360000 }, (err, jwtToken) => {
      if (err) throw err;
      res.json({ token: jwtToken, user: { id: user.id, name, email, role: user.role, isVerified: user.isVerified }, msg: 'A verification email has been sent.' });
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

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

// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a native user account mapped to this Google auth
      user = new User({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random complex password since they use Google
        role: 'customer',
        isVerified: true // Google accounts are pre-verified
      });
      await user.save();
    } else {
      // If user exists but hasn't verified email, Google login implicitly verifies them
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    const jwtPayload = { user: { id: user.id, role: user.role } };
    jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: 360000 }, (err, jwtToken) => {
      if (err) throw err;
      res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
    });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    res.status(500).json({ msg: 'Google Authentication Failed' });
  }
});

module.exports = router;
