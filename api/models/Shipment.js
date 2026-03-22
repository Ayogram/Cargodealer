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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trackingId: { type: String, required: true, unique: true }, // Format: CDI-YYYY-XXXX
  service: { type: String, required: true, enum: ['Air', 'Sea', 'Courier'] },
  route: { type: String, required: true }, // Destination country/city
  weight: { type: Number, default: 0 },
  
  // Package Details
  shippingTo: { type: String, default: '' },
  recipient: {
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    address: String
  },
  items: [itemSchema],
  totalValue: { type: Number, default: 0 },
  
  currentIndex: { type: Number, default: 0 }, // 0: Received, 1: Processing, etc.
  staffNote: { type: String, default: "Shipment request created. Awaiting package arrival at office." },
  history: [historySchema]
}, { timestamps: true });

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
