const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static UI files from root
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/track', shipmentRoutes);
app.use('/api/dashboard', require('./routes/dashboard'));

// Root API Endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'CargoDealer API Running' });
});

// Since Vercel Serverless Functions doesn't require app.listen
// If running locally via regular node:
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`-----------------------------------------------`);
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`🔌 API Base URL: http://localhost:${PORT}/api`);
  console.log(`-----------------------------------------------`);
});

// Keep process alive for background testing
process.stdin.resume();

module.exports = app;
