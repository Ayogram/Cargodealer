const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  statusIndex: { type: Number, required: true },
  note: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  qty: { type: Number, required: true },
  description: { type: String, required: true },
  value: { type: Number, required: true }
});

const shipmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for guests, required for logged-in
  trackingId: { type: String, required: true, unique: true }, // Format: CDI-XXXXXX
  service: { type: String, required: true, enum: ['Air Freight', 'Ocean Freight', 'Courier', 'Choose for Me'] },
  route: { type: String, required: true }, // General route description
  
  // New Dashboard Fields
  shippingTo: { type: String, default: '' },
  shipper: { type: String, default: '' },
  recipient: {
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    address: String
  },
  items: [itemSchema],
  totalValue: { type: Number, default: 0 },
  
  currentIndex: { type: Number, default: 0 },
  staffNote: { type: String, default: "Shipment created. Awaiting processing." },
  history: [historySchema]
}, { timestamps: true });

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
