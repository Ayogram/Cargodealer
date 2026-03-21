const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard summary stats
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const lastOrders = await Shipment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalShipments = await Shipment.countDocuments({ userId: req.user.id });
    
    res.json({
      user,
      totalShipments,
      lastOrders,
      usAddress: {
        name: user.name,
        address: "11969 Plano Road, suite " + (user.suiteNumber || "150-xxxx"),
        city: "Dallas",
        state: "TX",
        zip: "75243"
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dashboard/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/dashboard/preferences
// @desc    Update user preferences
// @access  Private
router.post('/preferences', auth, async (req, res) => {
  try {
    const { autoShip, askBeforeShip, consolidate } = req.body;
    const user = await User.findById(req.user.id);
    
    if (autoShip !== undefined) user.preferences.autoShip = autoShip;
    if (askBeforeShip !== undefined) user.preferences.askBeforeShip = askBeforeShip;
    if (consolidate !== undefined) user.preferences.consolidate = consolidate;

    await user.save();
    res.json(user.preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
