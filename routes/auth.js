import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Rider from "../models/Rider.js";
import Restaurant from "../models/Restaurant.js";
import Admin from "../models/Admin.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Middleware to ensure JSON response
router.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// User Sign In
router.post("/signin/user", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: "user" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({
      message: "User signed in successfully",
      token,
      role: "user",
      id: user._id,
    });
  } catch (err) {
    console.error("User sign-in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Rider Sign In
router.post("/signin/rider", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });

    const rider = await Rider.findOne({ email });
    if (!rider) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: rider._id, role: "rider" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({
      message: "Rider signed in successfully",
      token,
      role: "rider",
      id: rider._id,
    });
  } catch (err) {
    console.error("Rider sign-in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Restaurant Sign In
router.post("/signin/restaurant", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });

    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant)
      return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, restaurant.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: restaurant._id, role: "restaurant" },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({
      message: "Restaurant signed in successfully",
      token,
      role: "restaurant",
      id: restaurant._id,
    });
  } catch (err) {
    console.error("Restaurant sign-in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Sign In
router.post("/signin/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, role: "admin" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({
      message: "Admin signed in successfully",
      token,
      role: "admin",
      id: admin._id,
    });
  } catch (err) {
    console.error("Admin sign-in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User Sign Up
router.post("/signup/user", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("User sign-up error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Rider Sign Up
router.post("/signup/rider", async (req, res) => {
  try {
    const { name, email, nid, password } = req.body;
    if (!name || !email || !nid || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });

    const existingRider = await Rider.findOne({ email });
    if (existingRider)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const rider = new Rider({ name, email, nid, password: hashedPassword });
    await rider.save();

    res.status(201).json({ message: "Rider registered successfully" });
  } catch (err) {
    console.error("Rider sign-up error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Restaurant Sign Up
router.post("/signup/restaurant", async (req, res) => {
  try {
    const { restaurantName, ownerName, email, password } = req.body;
    if (!restaurantName || !ownerName || !email || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });

    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const restaurant = new Restaurant({
      restaurantName,
      ownerName,
      email,
      password: hashedPassword,
    });
    await restaurant.save();

    res.status(201).json({ message: "Restaurant registered successfully" });
  } catch (err) {
    console.error("Restaurant sign-up error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Sign Up
router.post("/signup/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!validateEmail(email))
      return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 5)
      return res
        .status(400)
        .json({ error: "Password must be at least 5 characters" });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Admin sign-up error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get All Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get All Riders
router.get("/riders", async (req, res) => {
  try {
    const riders = await Rider.find().select("-password");
    res.status(200).json(riders);
  } catch (err) {
    console.error("Get riders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get All Restaurants
router.get("/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select("-password");
    res.status(200).json(restaurants);
  } catch (err) {
    console.error("Get restaurants error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
