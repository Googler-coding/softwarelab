import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import jwt from "jsonwebtoken";
import net from "net";

dotenv.config();

const app = express();

// Middleware to enforce JSON content type
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body,
  });
  const originalSend = res.send;
  res.send = function (body) {
    console.log(
      `[${new Date().toISOString()}] Response for ${req.method} ${req.url}`,
      {
        status: res.statusCode,
        body: typeof body === "string" ? body : JSON.stringify(body),
      }
    );
    return originalSend.call(this, body);
  };
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/foodDeliveryApp";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  userId: { type: String, required: true },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.error("No token provided", {
      headers: req.headers,
      path: req.path,
    });
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined");
      return res.status(500).json({ message: "Server configuration error" });
    }
    console.log("Verifying token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    if (decoded.role !== "restaurant") {
      console.error("Unauthorized: Restaurant role required", {
        role: decoded.role,
        userId: decoded.id,
      });
      return res
        .status(403)
        .json({ message: "Unauthorized: Restaurant role required" });
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error("Token verification error:", {
      message: error.message,
      name: error.name,
      token,
    });
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired", details: error.message });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token", details: error.message });
    }
    res
      .status(401)
      .json({ message: "Authentication error", details: error.message });
  }
};

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

app.get("/api/menu/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.userId,
        paramUserId: req.params.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    const items = await MenuItem.find({ userId: req.params.userId });
    console.log("Fetched menu items:", items);
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch items", details: error.message });
  }
});

app.post("/api/menu", authMiddleware, async (req, res) => {
  try {
    const { name, price, userId } = req.body;
    console.log("Received POST payload:", { name, price, userId });
    if (!name || !price || !userId) {
      console.error("Missing required fields", { name, price, userId });
      return res
        .status(400)
        .json({ message: "Name, price, and userId are required" });
    }
    if (req.userId !== userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.userId,
        bodyUserId: userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (isNaN(price) || Number(price) <= 0) {
      console.error("Invalid price", { price });
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
    }
    const newItem = new MenuItem({ name, price: Number(price), userId });
    await newItem.save();
    console.log("Saved new menu item:", newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error saving item:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/menu/:id", authMiddleware, async (req, res) => {
  try {
    const { name, price } = req.body;
    console.log("Received PUT payload:", { name, price, id: req.params.id });
    if (!name || !price) {
      console.error("Missing required fields", { name, price });
      return res.status(400).json({ message: "Name and price are required" });
    }
    if (isNaN(price) || Number(price) <= 0) {
      console.error("Invalid price", { price });
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
    }
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      console.error("Item not found", { id: req.params.id });
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.userId !== req.userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.userId,
        itemUserId: item.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price: Number(price) },
      { new: true }
    );
    console.log("Updated menu item:", updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/menu/:id", authMiddleware, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      console.error("Item not found", { id: req.params.id });
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.userId !== req.userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.userId,
        itemUserId: item.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    await MenuItem.findByIdAndDelete(req.params.id);
    console.log("Deleted menu item:", { id: req.params.id });
    res.status(204).json({});
  } catch (error) {
    console.error("Error deleting item:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to delete item", details: error.message });
  }
});

app.use("/api/auth", authRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global server error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

app.get("/debug/env", (req, res) => {
  res.json({ JWT_SECRET: process.env.JWT_SECRET });
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// Error handling for invalid routes
app.use((req, res) => {
  console.error("404 Not Found", { method: req.method, url: req.url });
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

// Check if port is in use
const checkPort = (port, callback) => {
  const server = net.createServer();
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
      callback(new Error(`Port ${port} is already in use`));
    } else {
      callback(err);
    }
  });
  server.once("listening", () => {
    server.close();
    callback(null);
  });
  server.listen(port);
};

checkPort(PORT, (err) => {
  if (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
