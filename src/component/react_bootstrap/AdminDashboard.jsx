// src/component/react_bootstrap/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminDashboard.css";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchOrders();
  }, [token, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>🔐 Admin Dashboard</h1>
        <p className="admin-subtitle">Monitor all restaurant orders and system activity</p>
      </div>

      <div className="admin-content">
        {error && <div className="error-message">{error}</div>}

        {/* Statistics Section */}
        <div className="admin-section">
          <div className="section-header">
            <h3><span className="icon">📊</span> System Statistics</h3>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-number">{orders.length}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-number">{getStatusCount('pending')}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👨‍🍳</div>
              <div className="stat-number">{getStatusCount('preparing')}</div>
              <div className="stat-label">Preparing Orders</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-number">{getStatusCount('completed')}</div>
              <div className="stat-label">Completed Orders</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-number">${getTotalRevenue().toFixed(2)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-number">
                {new Set(orders.map(order => order.restaurantId?._id || order.restaurantId)).size}
              </div>
              <div className="stat-label">Active Restaurants</div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="admin-section">
          <div className="section-header">
            <h3><span className="icon">🧾</span> All Orders</h3>
          </div>
          
          <div className="orders-grid">
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <div className="empty-state-text">No orders found. Orders will appear here when customers place them.</div>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">Order #{order._id.slice(-6)}</div>
                    <span className={`order-status status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <div className="order-info">
                      <div className="order-info-label">Restaurant</div>
                      <div className="order-info-value">
                        {order.restaurantId?.restaurantName || 'Unknown Restaurant'}
                      </div>
                    </div>
                    <div className="order-info">
                      <div className="order-info-label">Customer</div>
                      <div className="order-info-value">{order.customerName || "Unnamed"}</div>
                    </div>
                    <div className="order-info">
                      <div className="order-info-label">Date</div>
                      <div className="order-info-value">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="order-info">
                      <div className="order-info-label">Time</div>
                      <div className="order-info-value">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-items">
                    <div className="order-items-title">Items:</div>
                    <ul className="order-item-list">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          <span className="order-item-name">{item.name}</span>
                          <span className="order-item-details">
                            x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="order-total">
                      <strong>Total: ${order.total.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
