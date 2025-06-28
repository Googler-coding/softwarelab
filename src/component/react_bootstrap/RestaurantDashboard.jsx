import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/RestaurantDashboard.css";

const RestaurantDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("id");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
      return;
    }
    fetchMenuItems();
    fetchOrders();
  }, [token, userId, navigate]);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch items");
      setMenuItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API_URL}/api/menu/${editingId}`
        : `${API_URL}/api/menu`;
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { name, price } : { name, price, userId };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      fetchMenuItems();
      setName("");
      setPrice("");
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setName(item.name);
    setPrice(item.price);
    setEditingId(item._id);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/menu/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchMenuItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="restaurant-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard-container">
      <div className="dashboard-header">
        <h1>🍽️ Restaurant Dashboard</h1>
        <p className="dashboard-subtitle">Manage your menu and track customer orders</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {/* Left: Menu Items */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><span className="icon">📋</span> Menu Items</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="menu-form">
            <input
              type="text"
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control mb-2"
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-control mb-2"
              required
            />
            <button type="submit" className="btn w-100">
              {editingId ? "Update Item" : "Add Item"}
            </button>
          </form>

          <div className="menu-list">
            {menuItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🍽️</div>
                <div className="empty-state-text">No items found. Add your first menu item!</div>
              </div>
            ) : (
              menuItems.map((item) => (
                <div key={item._id} className="menu-item">
                  <div className="menu-item-info">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-price">${item.price}</div>
                  </div>
                  <div className="menu-item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(item)}>
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(item._id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Orders */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><span className="icon">🧾</span> Customer Orders</h3>
          </div>
          
          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <div className="empty-state-text">No orders yet. Orders will appear here when customers place them.</div>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="order-item">
                  <div className="order-header">
                    <div className="order-id">Order #{order._id.slice(-6)}</div>
                    <span className={`order-status status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <div className="order-info">
                      <div className="order-info-label">Customer</div>
                      <div className="order-info-value">{order.customerName || "Unnamed"}</div>
                    </div>
                    <div className="order-info">
                      <div className="order-info-label">Date</div>
                      <div className="order-info-value">{new Date(order.createdAt).toLocaleDateString()}</div>
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
                    <div className="order-item-details" style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                      <strong>Total: ${order.total.toFixed(2)}</strong>
                    </div>
                  </div>
                  
                  {order.status === "pending" && (
                    <div className="order-actions">
                      <button
                        className="btn-action btn-start-preparing"
                        onClick={() => updateOrderStatus(order._id, "preparing")}>
                        Start Preparing
                      </button>
                      <button
                        className="btn-action btn-mark-complete"
                        onClick={() => updateOrderStatus(order._id, "ready")}>
                        Mark Ready
                      </button>
                    </div>
                  )}
                  
                  {order.status === "preparing" && (
                    <div className="order-actions">
                      <button
                        className="btn-action btn-mark-complete"
                        onClick={() => updateOrderStatus(order._id, "ready")}>
                        Mark Ready
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
