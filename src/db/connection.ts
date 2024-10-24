import mongoose from "mongoose";
import { config } from "../config/config";

const connectDB = async () => {
  const MONGO_URI = config.mongodbUri;
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: config.dbName,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

export default connectDB;
