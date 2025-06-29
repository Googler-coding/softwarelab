import express from "express";
import Chat from "../models/Chat.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Rider from "../models/Rider.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get chat messages for an order
router.get("/order/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    let chat = await Chat.findOne({ orderId });
    
    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        orderId,
        participants: [req.user.id],
        messages: []
      });
      await chat.save();
    } else {
      // Add user to participants if not already present
      if (!chat.participants.includes(req.user.id)) {
        chat.participants.push(req.user.id);
        await chat.save();
      }
    }

    res.json({
      chatId: chat._id,
      messages: chat.messages,
      participants: chat.participants
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ message: "Failed to fetch chat" });
  }
});

// Send a message
router.post("/message", auth, async (req, res) => {
  try {
    const { orderId, message, messageType = "text" } = req.body;
    
    if (!orderId || !message) {
      return res.status(400).json({ message: "Order ID and message are required" });
    }

    let chat = await Chat.findOne({ orderId });
    
    if (!chat) {
      chat = new Chat({
        orderId,
        participants: [req.user.id],
        messages: []
      });
    }

    const newMessage = {
      senderId: req.user.id,
      senderName: req.user.name || req.user.restaurantName || "User",
      senderRole: req.user.role,
      message,
      messageType,
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    
    // Add user to participants if not already present
    if (!chat.participants.includes(req.user.id)) {
      chat.participants.push(req.user.id);
    }

    await chat.save();

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage: newMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get user's active chats
router.get("/my-chats", auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    }).sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// Mark messages as read
router.patch("/read/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const chat = await Chat.findOne({ orderId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Mark messages as read for this user
    chat.messages.forEach(msg => {
      if (msg.senderId.toString() !== req.user.id) {
        msg.readBy = msg.readBy || [];
        if (!msg.readBy.includes(req.user.id)) {
          msg.readBy.push(req.user.id);
        }
      }
    });

    await chat.save();

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

export default router; 