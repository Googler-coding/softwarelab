import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Rider from "../models/Rider.js";
import Restaurant from "../models/Restaurant.js";
import Admin from "../models/Admin.js";

const router = express.Router();

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Health check for auth routes
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Auth routes are running" });
});

// User Signup
router.post("/signup/user", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    console.log("User sign-up attempt:", { name, email, phone });
    if (!name || !email || !phone || !password) {
      console.error("Missing required fields", {
        name,
        email,
        phone,
        password,
      });
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      console.error("Password too short", { email });
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("User email already exists:", { email });
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword });
    await user.save();
    console.log("User registered:", { email, id: user._id });

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("User sign-up error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Rider Signup
router.post("/signup/rider", async (req, res) => {
  try {
    const { name, email, nid, password } = req.body;
    console.log("Rider sign-up attempt:", { name, email, nid });
    if (!name || !email || !nid || !password) {
      console.error("Missing required fields", { name, email, nid, password });
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      console.error("Password too short", { email });
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existingRider = await Rider.findOne({ email });
    if (existingRider) {
      console.error("Rider email already exists:", { email });
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rider = new Rider({ name, email, nid, password: hashedPassword });
    await rider.save();
    console.log("Rider registered:", { email, id: rider._id });

    res.status(201).json({ message: "Rider registered successfully" });
  } catch (err) {
    console.error("Rider sign-up error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Restaurant Signup
router.post("/signup/restaurant", async (req, res) => {
  try {
    const { restaurantName, ownerName, email, password } = req.body;
    console.log("Restaurant sign-up attempt:", {
      restaurantName,
      ownerName,
      email,
    });
    if (!restaurantName || !ownerName || !email || !password) {
      console.error("Missing required fields", {
        restaurantName,
        ownerName,
        email,
        password,
      });
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      console.error("Password too short", { email });
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      console.error("Restaurant already exists", { email });
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate random coordinates within Dhaka area
    const lat = 23.7 + Math.random() * 0.2; // Range: 23.7 to 23.9
    const lon = 90.3 + Math.random() * 0.3; // Range: 90.3 to 90.6
    
    const restaurant = new Restaurant({
      restaurantName,
      ownerName,
      email,
      password: hashedPassword,
      lat,
      lon,
    });
    await restaurant.save();
    console.log("Restaurant registered:", { email, id: restaurant._id, lat, lon });

    res.status(201).json({ message: "Restaurant registered successfully" });
  } catch (err) {
    console.error("Restaurant sign-up error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Admin Signup
router.post("/signup/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin sign-up attempt:", { email });
    
    // Prevent creating additional admin accounts for security
    return res.status(403).json({ 
      error: "Admin account creation is disabled for security reasons. Please contact the system administrator." 
    });
    
    // The code below is commented out for security
    /*
    if (!email || !password) {
      console.error("Missing required fields", { email, password });
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 5) {
      console.error("Password too short", { email });
      return res
        .status(400)
        .json({ error: "Password must be at least 5 characters" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.error("Admin email already exists:", { email });
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();
    console.log("Admin registered:", { email, id: admin._id });

    res.status(201).json({ message: "Admin registered successfully" });
    */
  } catch (err) {
    console.error("Admin sign-up error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// User Signin
router.post("/signin/user", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("User sign-in attempt:", { email });
    if (!email || !password) {
      console.error("Missing required fields", { email, password });
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found:", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Password mismatch for user:", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "User signed in successfully",
      token,
      role: "user",
      id: user._id,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("User sign-in error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Rider Signin
router.post("/signin/rider", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Rider sign-in attempt:", { email });
    if (!email || !password) {
      console.error("Missing required fields", { email, password });
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }

    const rider = await Rider.findOne({ email });
    if (!rider) {
      console.error("Rider not found:", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) {
      console.error("Password mismatch for rider:", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: rider._id, role: "rider" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Rider signed in successfully",
      token,
      role: "rider",
      id: rider._id,
    });
  } catch (err) {
    console.error("Rider sign-in error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Restaurant Signin
router.post("/signin/restaurant", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Restaurant sign-in attempt:", { email });
    if (!email || !password) {
      console.error("Missing required fields", { email, password });
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }

    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant) {
      console.error("Restaurant not found", { email });
      return res.status(401).json({ error: "Restaurant not found" });
    }

    const isMatch = await bcrypt.compare(password, restaurant.password);
    if (!isMatch) {
      console.error("Invalid credentials", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: restaurant._id, role: "restaurant" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Restaurant signed in successfully",
      token,
      role: "restaurant",
      id: restaurant._id,
    });
  } catch (err) {
    console.error("Restaurant sign-in error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Admin Signin
router.post("/signin/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin sign-in attempt:", { email });
    if (!email || !password) {
      console.error("Missing required fields", { email, password });
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      console.error("Invalid email format", { email });
      return res.status(400).json({ error: "Invalid email format" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.error("Admin not found:", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.error("Password mismatch for admin:", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Admin signed in successfully",
      token,
      role: "admin",
      id: admin._id,
    });
  } catch (err) {
    console.error("Admin sign-in error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Get Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    console.log("Fetched users:", users.length);
    res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Get Riders
router.get("/riders", async (req, res) => {
  try {
    const riders = await Rider.find().select("-password");
    console.log("Fetched riders:", riders.length);
    res.status(200).json(riders);
  } catch (err) {
    console.error("Get riders error:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Get Restaurants
router.get("/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select("-password");
    console.log("Fetched restaurants:", restaurants.length);
    res.status(200).json(restaurants);
  } catch (err) {
    console.error("Get restaurants error:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Error Handler
router.use((err, req, res, next) => {
  console.error("Auth router error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

export default router;
