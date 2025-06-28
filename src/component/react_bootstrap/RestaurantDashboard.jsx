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
  }, []);

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

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">🍽️ Restaurant Dashboard</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {/* Left: Menu Items */}
        <div className="col-md-6 border-end pe-4">
          <h3 className="mb-3">📋 Menu Items</h3>
          <form onSubmit={handleSubmit} className="mb-4">
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
            <button type="submit" className="btn btn-success w-100">
              {editingId ? "Update Item" : "Add Item"}
            </button>
          </form>

          {menuItems.length === 0 ? (
            <p>No items found.</p>
          ) : (
            <ul className="list-group">
              {menuItems.map((item) => (
                <li
                  key={item._id}
                  className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    {item.name} - ${item.price}
                  </span>
                  <div>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(item)}>
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(item._id)}>
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Orders */}
        <div className="col-md-6 ps-4">
          <h3 className="mb-3">🧾 Customer Orders</h3>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <ul className="list-group">
              {orders.map((order) => (
                <li
                  key={order._id}
                  className="list-group-item d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{order.customerName || "Unnamed"}</strong>
                    <br />
                    Items:{" "}
                    {order.items
                      .map((i) => `${i.name} x${i.quantity}`)
                      .join(", ")}
                    <br />
                    Total: ${order.total}
                  </div>
                  <span
                    className={`badge rounded-pill ${
                      order.status === "completed"
                        ? "bg-success"
                        : "bg-warning text-dark"
                    }`}>
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
