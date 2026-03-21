const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  statusIndex: { type: Number, required: true },
  note: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true }, // Format: CDI-XXXXXX
  service: { type: String, required: true, enum: ['Air Freight', 'Ocean Freight', 'Courier'] },
  route: { type: String, required: true }, // e.g. "Lagos → Port Harcourt"
  currentIndex: { type: Number, default: 0 },
  staffNote: { type: String, default: "Shipment created. Awaiting processing." },
  history: [historySchema]
}, { timestamps: true });

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
