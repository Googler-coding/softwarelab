import { Server } from "socket.io";

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join user to their personal room
    socket.on("joinUser", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join restaurant to their room
    socket.on("joinRestaurant", (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`Restaurant ${restaurantId} joined their room`);
    });

    // Join rider to their room
    socket.on("joinRider", (riderId) => {
      socket.join(`rider_${riderId}`);
      console.log(`Rider ${riderId} joined their room`);
    });

    // Join admin room
    socket.on("joinAdmin", () => {
      socket.join("admin");
      console.log("Admin joined admin room");
    });

    // Handle order status updates
    socket.on("orderStatusUpdate", (data) => {
      const { orderId, status, kitchenStatus, restaurantId, userId, riderId } = data;
      
      console.log('Order status update received:', data);
      
      // Emit to all relevant parties
      io.emit("orderUpdate", {
        orderId,
        status,
        kitchenStatus,
        restaurantId,
        userId,
        riderId,
        timestamp: new Date(),
      });

      // Emit specific orderStatusUpdate event for immediate UI updates
      io.emit("orderStatusUpdate", {
        orderId,
        status,
        kitchenStatus,
        restaurantId,
        userId,
        riderId,
        timestamp: new Date(),
      });

      // Emit to specific rooms
      if (userId) {
        io.to(`user_${userId}`).emit("orderStatusUpdate", {
          orderId,
          status,
          kitchenStatus,
          restaurantId,
          userId,
          riderId,
          timestamp: new Date(),
        });
      }

      if (restaurantId) {
        io.to(`restaurant_${restaurantId}`).emit("orderStatusUpdate", {
          orderId,
          status,
          kitchenStatus,
          restaurantId,
          userId,
          riderId,
          timestamp: new Date(),
        });
      }

      if (riderId) {
        io.to(`rider_${riderId}`).emit("orderStatusUpdate", {
          orderId,
          status,
          kitchenStatus,
          restaurantId,
          userId,
          riderId,
          timestamp: new Date(),
        });
      }

      // Emit to admin room
      io.to("admin").emit("orderStatusUpdate", {
        orderId,
        status,
        kitchenStatus,
        restaurantId,
        userId,
        riderId,
        timestamp: new Date(),
      });
    });

    // Handle kitchen status updates
    socket.on("kitchenStatusUpdate", (data) => {
      const { restaurantId, kitchenStatus, message } = data;
      
      io.to(`restaurant_${restaurantId}`).emit("kitchenStatusUpdate", {
        restaurantId,
        kitchenStatus,
        message,
        timestamp: new Date(),
      });

      io.to("admin").emit("kitchenStatusUpdate", {
        restaurantId,
        kitchenStatus,
        message,
        timestamp: new Date(),
      });
    });

    // Handle rider location updates
    socket.on("riderLocationUpdate", (data) => {
      const { riderId, location, orderId } = data;
      
      io.to(`rider_${riderId}`).emit("riderLocationUpdate", {
        riderId,
        location,
        orderId,
        timestamp: new Date(),
      });

      // Emit to admin room
      io.to("admin").emit("riderLocationUpdate", {
        riderId,
        location,
        orderId,
        timestamp: new Date(),
      });
    });

    // Handle table reservation updates
    socket.on("reservationUpdate", (data) => {
      const { restaurantId, reservationId, status } = data;
      
      io.to(`restaurant_${restaurantId}`).emit("reservationUpdate", {
        restaurantId,
        reservationId,
        status,
        timestamp: new Date(),
      });

      io.to("admin").emit("reservationUpdate", {
        restaurantId,
        reservationId,
        status,
        timestamp: new Date(),
      });
    });

    // Handle chat messages
    socket.on("chatMessage", (data) => {
      const { orderId, senderId, senderRole, message, receiverId } = data;
      
      // Emit to specific order room
      io.to(`order_${orderId}`).emit("chatMessage", {
        orderId,
        senderId,
        senderRole,
        message,
        timestamp: new Date(),
      });

      // Emit to sender and receiver
      if (senderId) {
        io.to(`user_${senderId}`).emit("chatMessage", {
          orderId,
          senderId,
          senderRole,
          message,
          timestamp: new Date(),
        });
      }

      if (receiverId) {
        io.to(`user_${receiverId}`).emit("chatMessage", {
          orderId,
          senderId,
          senderRole,
          message,
          timestamp: new Date(),
        });
      }
    });

    // Join order room for chat
    socket.on("joinOrderChat", (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined order chat room: ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export { initializeSocket, getIO, io }; 