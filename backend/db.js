import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ganpati_db';
    console.log(`⏳ Connecting to MongoDB at ${connStr}...`);
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    return false;
  }
};

export default connectDB;

