import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatComponent from "./ChatComponent.jsx";
import "../css/UserOrderTracking.css";

const UserOrderTracking = () => {
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("id");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!token || role !== "user") {
      setError("Unauthorized access. Redirecting...");
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    // Set current user for chat
    setCurrentUser({
      id: userId,
      name: localStorage.getItem("userName") || "User",
      role: "user"
    });

    fetchUserOrders();
    
    // Set up periodic refresh
    const interval = setInterval(fetchUserOrders, 10000);
    return () => clearInterval(interval);
  }, [token, role, navigate]);

  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setUserOrders(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#ffd93d";
      case "preparing": return "#4facfe";
      case "ready": return "#667eea";
      case "assigned": return "#ff6b6b";
      case "picked_up": return "#43e97b";
      case "on_way": return "#38f9d7";
      case "delivered": return "#43e97b";
      case "cancelled": return "#ff6b6b";
      default: return "#6c757d";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return "⏳";
      case "preparing": return "👨‍🍳";
      case "ready": return "✅";
      case "assigned": return "🛵";
      case "picked_up": return "📦";
      case "on_way": return "🚚";
      case "delivered": return "🎉";
      case "cancelled": return "❌";
      default: return "❓";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="user-tracking-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-tracking-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <h1>📦 My Orders</h1>
        <p className="tracking-subtitle">Track your food delivery orders</p>
      </div>

      {/* Orders List */}
      <div className="orders-container">
        {userOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No orders yet. Place your first order!</div>
            <button 
              className="place-order-btn"
              onClick={() => navigate("/in-restaurant-order")}
            >
              Order Food Now
            </button>
          </div>
        ) : (
          userOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-id">Order #{order._id.slice(-6)}</div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusIcon(order.status)} {order.status.replace('_', ' ')}
                </div>
              </div>

              <div className="order-details">
                <div className="order-info">
                  <div className="order-info-label">Restaurant</div>
                  <div className="order-info-value">{order.restaurantId?.restaurantName || "Unknown"}</div>
                </div>
                <div className="order-info">
                  <div className="order-info-label">Total</div>
                  <div className="order-info-value">${order.total.toFixed(2)}</div>
                </div>
                <div className="order-info">
                  <div className="order-info-label">Date</div>
                  <div className="order-info-value">{formatDate(order.createdAt)}</div>
                </div>
                {order.riderId && (
                  <div className="order-info">
                    <div className="order-info-label">Rider</div>
                    <div className="order-info-value">{order.riderId.name || "Assigned"}</div>
                  </div>
                )}
              </div>

              <div className="order-items">
                <div className="order-items-title">Items:</div>
                <ul className="order-item-list">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-actions">
                {order.riderId && (
                  <button
                    className="chat-btn"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowChat(true);
                    }}
                  >
                    💬 Chat with Rider
                  </button>
                )}
                <button
                  className="track-btn"
                  onClick={() => {
                    // Could open a detailed tracking modal here
                    alert(`Order ${order._id.slice(-6)} is ${order.status.replace('_', ' ')}`);
                  }}
                >
                  📍 Track Order
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Component */}
      {showChat && selectedOrder && (
        <ChatComponent
          orderId={selectedOrder._id}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default UserOrderTracking; 