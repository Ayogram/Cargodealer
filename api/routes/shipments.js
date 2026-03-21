const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const auth = require('../middleware/auth');

// @route   GET /api/track/:id
// @desc    Get tracking info (Public)
router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingId: req.params.id.toUpperCase() });
    if (!shipment) {
      return res.status(404).json({ msg: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/shipments
// @desc    Create a shipment
// @access  Private (Admin/Dealer)
router.post('/', auth, async (req, res) => {
  try {
    const { trackingId, service, route, staffNote } = req.body;
    let shipment = new Shipment({
      trackingId: trackingId.toUpperCase(),
      service,
      route,
      staffNote
    });
    // Add initial history element
    shipment.history.push({ statusIndex: 0, note: staffNote || 'Shipment created' });
    await shipment.save();
    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/shipments/:id
// @desc    Update a shipment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { currentIndex, staffNote } = req.body;
    let shipment = await Shipment.findOne({ trackingId: req.params.id.toUpperCase() });
    if (!shipment) return res.status(404).json({ msg: 'Shipment not found' });

    if (currentIndex !== undefined) shipment.currentIndex = currentIndex;
    if (staffNote !== undefined) shipment.staffNote = staffNote;

    shipment.history.push({
      statusIndex: shipment.currentIndex,
      note: staffNote
    });

    await shipment.save();
    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/shipments
// @desc    Get all shipments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
