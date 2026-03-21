const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cargodealer';
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // process.exit(1);
  }
};

module.exports = connectDB;
