import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import Admin from "./models/Admin.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/foodDeliveryApp";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected");
    await Admin.createDefaultAdmin(); // Create default admin on server start
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.use("/api/auth", authRoutes);

// Debug route to check environment variables
app.get("/debug/env", (req, res) => {
  res.json({ JWT_SECRET: process.env.JWT_SECRET });
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});
