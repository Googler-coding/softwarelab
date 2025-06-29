// Database Reset Script
// Use this script to clear all data for clean testing

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/foodDeliveryApp";

async function resetDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🗑️  Dropping database...");
    await mongoose.connection.dropDatabase();
    console.log("✅ Database dropped successfully");

    console.log("🔄 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");

    console.log("🎉 Database reset completed!");
    console.log("💡 You can now run your tests with a clean database.");
    
  } catch (error) {
    console.error("❌ Database reset failed:", error.message);
    process.exit(1);
  }
}

// Run the reset
resetDatabase(); 