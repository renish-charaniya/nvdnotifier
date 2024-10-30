import mongoose from "mongoose";
import { config } from "../config/config";
let isConnected = false;

export const connectDB = async () => {
  const MONGO_URI = config.mongodbUri;
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return mongoose.connection;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: config.dbName,
    });
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (isConnected) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      console.log("MongoDB disconnected successfully");
    } catch (err) {
      console.error("MongoDB disconnection failed:", err);
      process.exit(1);
    }
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
