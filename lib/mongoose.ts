import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    throw new Error('MONGODB_URI is not defined');
  }

  if (isConnected) {
    console.log('=> Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected to websift database');
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};