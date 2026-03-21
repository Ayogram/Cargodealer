const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cargodealer';
    console.log(`📡 Attempting MongoDB connection to: ${uri}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️ Server will run, but database features (Login/Register) will fail until MongoDB is started.');
  }
};

module.exports = connectDB;
