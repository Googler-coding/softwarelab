import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ChatComponent from "./ChatComponent.jsx";
import "../css/RiderDashboard.css";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const riderIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-red.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-blue.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-green.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RiderDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [riderStats, setRiderStats] = useState(null);
  const [riderLocation, setRiderLocation] = useState([23.8103, 90.4125]); // Dhaka default
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const riderId = localStorage.getItem("id");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!token || role !== "rider") {
      setError("Unauthorized access. Redirecting...");
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    // Set current user for chat
    setCurrentUser({
      id: riderId,
      name: localStorage.getItem("userName") || "Rider",
      role: "rider"
    });

    // Get rider's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setRiderLocation(coords);
          updateRiderLocation(coords[0], coords[1]);
        },
        () => {
          console.log("Using default location");
        }
      );
    }

    fetchDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [token, role, navigate]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchAvailableOrders(),
        fetchCurrentOrder(),
        fetchRiderStats()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rider/available-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setAvailableOrders(data);
    } catch (err) {
      console.error("Error fetching available orders:", err);
    }
  };

  const fetchCurrentOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rider/current-order`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch current order");
      setCurrentOrder(data.currentOrder);
    } catch (err) {
      console.error("Error fetching current order:", err);
    }
  };

  const fetchRiderStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rider/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch stats");
      setRiderStats(data);
    } catch (err) {
      console.error("Error fetching rider stats:", err);
    }
  };

  const updateRiderLocation = async (lat, lon) => {
    try {
      await fetch(`${API_URL}/api/rider/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lat, lon }),
      });
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      const res = await fetch(`${API_URL}/api/rider/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          isOnline: newStatus,
          status: newStatus ? "available" : "offline"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      
      setIsOnline(newStatus);
      if (newStatus) {
        fetchAvailableOrders();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/api/rider/accept-order/${orderId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept order");
      
      setCurrentOrder(data);
      fetchAvailableOrders();
      fetchRiderStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/rider/order-status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update order status");
      
      setCurrentOrder(data);
      if (status === "delivered") {
        setCurrentOrder(null);
        fetchRiderStats();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusButtonText = (currentStatus) => {
    switch (currentStatus) {
      case "assigned": return "Picked Up";
      case "picked_up": return "On The Way";
      case "on_way": return "Delivered";
      default: return "Update Status";
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "assigned": return "picked_up";
      case "picked_up": return "on_way";
      case "on_way": return "delivered";
      default: return currentStatus;
    }
  };

  if (loading) {
    return (
      <div className="rider-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rider-dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="rider-dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🛵 Rider Dashboard</h1>
            <p className="dashboard-subtitle">Manage your deliveries and track your earnings</p>
          </div>
          <div className="header-right">
            <div className="status-toggle">
              <button
                className={`status-btn ${isOnline ? 'online' : 'offline'}`}
                onClick={toggleOnlineStatus}
              >
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </button>
              {refreshing && <span className="refreshing-indicator">🔄</span>}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Main Dashboard Layout */}
      <div className="dashboard-main">
        {/* Left Column - Stats and Orders */}
        <div className="dashboard-left">
          {/* Stats Section */}
          <div className="dashboard-section stats-section">
            <div className="section-header">
              <h3><span className="icon">📊</span> Your Performance</h3>
            </div>
            
            {riderStats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-value">{riderStats.totalDeliveries}</div>
                  <div className="stat-label">Total Deliveries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-value">${riderStats.totalEarnings}</div>
                  <div className="stat-label">Total Earnings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-value">{riderStats.todayDeliveries}</div>
                  <div className="stat-label">Today's Deliveries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💵</div>
                  <div className="stat-value">${riderStats.todayEarnings}</div>
                  <div className="stat-label">Today's Earnings</div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">Loading statistics...</div>
              </div>
            )}
          </div>

          {/* Available Orders */}
          <div className="dashboard-section orders-section">
            <div className="section-header">
              <h3><span className="icon">📦</span> Available Orders</h3>
              <span className="order-count">{availableOrders.length}</span>
            </div>
            
            <div className="orders-list">
              {availableOrders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">
                    {isOnline ? "No orders available right now. Check back soon!" : "Go online to see available orders"}
                  </div>
                </div>
              ) : (
                availableOrders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">Order #{order._id.slice(-6)}</div>
                      <div className="order-restaurant">{order.restaurantId?.restaurantName || "Unknown Restaurant"}</div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-info">
                        <div className="order-info-label">Customer</div>
                        <div className="order-info-value">{order.customerName}</div>
                      </div>
                      <div className="order-info">
                        <div className="order-info-label">Total</div>
                        <div className="order-info-value">${order.total.toFixed(2)}</div>
                      </div>
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
                    
                    <button
                      className="accept-order-btn"
                      onClick={() => acceptOrder(order._id)}
                      disabled={!isOnline || currentOrder}
                    >
                      Accept Order
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Map and Current Order */}
        <div className="dashboard-right">
          {/* Current Order */}
          {currentOrder && (
            <div className="dashboard-section current-order-section">
              <div className="section-header">
                <h3><span className="icon">🚚</span> Current Delivery</h3>
                <span className="order-status-badge status-{currentOrder.status}">
                  {currentOrder.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="current-order-content">
                <div className="order-details-grid">
                  <div className="order-info">
                    <div className="order-info-label">Order ID</div>
                    <div className="order-info-value">#{currentOrder._id.slice(-6)}</div>
                  </div>
                  <div className="order-info">
                    <div className="order-info-label">Restaurant</div>
                    <div className="order-info-value">{currentOrder.restaurantId?.restaurantName}</div>
                  </div>
                  <div className="order-info">
                    <div className="order-info-label">Customer</div>
                    <div className="order-info-value">{currentOrder.customerName}</div>
                  </div>
                  <div className="order-info">
                    <div className="order-info-label">Total</div>
                    <div className="order-info-value">${currentOrder.total.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="order-actions">
                  <button
                    className="status-update-btn"
                    onClick={() => updateOrderStatus(currentOrder._id, getNextStatus(currentOrder.status))}
                    disabled={currentOrder.status === "delivered"}
                  >
                    {getStatusButtonText(currentOrder.status)}
                  </button>
                  
                  <button
                    className="chat-btn"
                    onClick={() => setShowChat(true)}
                  >
                    💬 Chat with Customer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map Section */}
          <div className="dashboard-section map-section">
            <div className="section-header">
              <h3><span className="icon">🗺️</span> Live Map</h3>
              <div className="map-controls">
                <span className="map-legend">
                  <span className="legend-item">
                    <div className="legend-color rider"></div>
                    You
                  </span>
                  <span className="legend-item">
                    <div className="legend-color restaurant"></div>
                    Restaurant
                  </span>
                  <span className="legend-item">
                    <div className="legend-color customer"></div>
                    Customer
                  </span>
                </span>
              </div>
            </div>
            
            <div className="map-container">
              <MapContainer
                center={riderLocation}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {/* Rider Location */}
                <Marker position={riderLocation} icon={riderIcon}>
                  <Popup>You are here</Popup>
                  <Tooltip permanent direction="top">You</Tooltip>
                </Marker>
                
                {/* Current Order Restaurant */}
                {currentOrder?.restaurantId && (
                  <Marker 
                    position={[currentOrder.restaurantId.lat, currentOrder.restaurantId.lon]} 
                    icon={restaurantIcon}
                  >
                    <Popup>
                      <strong>{currentOrder.restaurantId.restaurantName}</strong>
                      <br />
                      Pickup location
                    </Popup>
                    <Tooltip direction="top">Restaurant</Tooltip>
                  </Marker>
                )}
                
                {/* Available Order Restaurants */}
                {availableOrders.map((order) => (
                  <Marker 
                    key={order._id}
                    position={[order.restaurantId.lat, order.restaurantId.lon]} 
                    icon={restaurantIcon}
                  >
                    <Popup>
                      <strong>{order.restaurantId.restaurantName}</strong>
                      <br />
                      Order #{order._id.slice(-6)}
                      <br />
                      ${order.total.toFixed(2)}
                    </Popup>
                    <Tooltip direction="top">{order.restaurantId.restaurantName}</Tooltip>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      {showChat && currentOrder && (
        <ChatComponent
          orderId={currentOrder._id}
          currentUser={currentUser}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default RiderDashboard; 