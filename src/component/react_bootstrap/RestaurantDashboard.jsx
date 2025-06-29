import React, { useState, useEffect } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Modal } from "react-bootstrap";
import "../css/RestaurantDashboard.css";

const RestaurantDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Menu Management States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Table Management States
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState(2);
  const [tableLocation, setTableLocation] = useState("Indoor");
  const [tableAvailableDate, setTableAvailableDate] = useState("");
  const [tableAvailableTime, setTableAvailableTime] = useState("");
  const [editingTableId, setEditingTableId] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh reservations every 30 seconds
    const interval = setInterval(() => {
      fetchReservations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMenuItems(),
        fetchTables(),
        fetchOrders(),
        fetchReservations()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Menu Management Functions
  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch menu");
      setMenuItems(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${API_URL}/api/restaurants/menu/${editingId}`
        : `${API_URL}/api/restaurants/menu`;
      
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, price: parseFloat(price) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save menu item");

      setName("");
      setPrice("");
      setEditingId(null);
      fetchMenuItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditMenu = (item) => {
    setName(item.name);
    setPrice(item.price.toString());
    setEditingId(item._id);
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/restaurants/menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete menu item");
      fetchMenuItems();
    } catch (err) {
      setError(err.message);
    }
  };

  // Table Management Functions
  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch tables");
      setTables(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      const tableData = {
        tableName,
        capacity: parseInt(tableCapacity),
        location: tableLocation,
        isAvailable: true,
        availableDate: tableAvailableDate,
        availableTime: tableAvailableTime,
      };

      const url = editingTableId 
        ? `${API_URL}/api/restaurants/tables/${editingTableId}`
        : `${API_URL}/api/restaurants/tables`;
      
      const method = editingTableId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tableData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save table");

      setTableName("");
      setTableCapacity(2);
      setTableLocation("Indoor");
      setTableAvailableDate("");
      setTableAvailableTime("");
      setEditingTableId(null);
      setShowTableModal(false);
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTable = (table) => {
    setTableName(table.tableName);
    setTableCapacity(table.capacity);
    setTableLocation(table.location);
    setTableAvailableDate(table.availableDate || "");
    setTableAvailableTime(table.availableTime || "");
    setEditingTableId(table._id);
    setShowTableModal(true);
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/restaurants/tables/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete table");
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  // Orders Functions
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      const res = await fetch(`${API_URL}/api/orders/restaurant/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update order status");
      }
      
      const result = await res.json();
      console.log("Order status updated successfully:", result);
      
      // Refresh orders list
      await fetchOrders();
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(`Failed to update order status: ${err.message}`);
    }
  };

  // Reservations Functions
  const fetchReservations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/restaurant`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch reservations");
      setReservations(data);
      console.log('Fetched reservations:', data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message);
    }
  };

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/${reservationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update reservation status");
      fetchReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'info',
      'preparing': 'primary',
      'ready': 'success',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '🍽️',
      'delivered': '🎉',
      'cancelled': '❌'
    };
    return icons[status] || '❓';
  };

  if (loading) {
    return (
      <div className="restaurant-dashboard-container">
        <div className="loading-container">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h3>Loading dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard-container">
      <div className="dashboard-header">
        <h1>🍽️ Restaurant Dashboard</h1>
        <p className="dashboard-subtitle">Manage your menu, tables, orders, and reservations</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="dashboard-grid">
        {/* Card 1: Menu Management */}
        <Card className="dashboard-card menu-card">
          <Card.Header>
            <h3><span className="icon">📋</span> Menu Management</h3>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleMenuSubmit} className="menu-form">
              <Form.Group className="mb-3">
                <Form.Label>Item Name</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price (৳)</Form.Label>
                <Form.Control
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100">
                {editingId ? "Update Item" : "Add Item"}
              </Button>
              {editingId && (
                <Button 
                  variant="outline-secondary" 
                  className="w-100 mt-2"
                  onClick={() => {
                    setName("");
                    setPrice("");
                    setEditingId(null);
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </Form>

            <div className="menu-list">
              <h5>Current Menu Items</h5>
              {menuItems.length === 0 ? (
                <p className="text-muted">No menu items yet. Add your first item!</p>
              ) : (
                menuItems.map((item) => (
                  <div key={item._id} className="menu-item">
                    <div className="menu-item-info">
                      <h6>{item.name}</h6>
                      <p className="price">৳{item.price}</p>
                    </div>
                    <div className="menu-item-actions">
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => handleEditMenu(item)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-danger"
                        onClick={() => handleDeleteMenu(item._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Card 2: Table Management */}
        <Card className="dashboard-card table-card">
          <Card.Header>
            <h3><span className="icon">🍽️</span> Table Management</h3>
          </Card.Header>
          <Card.Body>
            <Button 
              variant="primary" 
              className="w-100 mb-3"
              onClick={() => setShowTableModal(true)}
            >
              + Add New Table
            </Button>

            <div className="table-list">
              <h5>Current Tables</h5>
              {tables.length === 0 ? (
                <p className="text-muted">No tables configured. Add your first table!</p>
              ) : (
                tables.map((table) => (
                  <div key={table._id} className="table-item">
                    <div className="table-info">
                      <h6>{table.tableName}</h6>
                      <p>Capacity: {table.capacity} seats</p>
                      <p>Location: {table.location}</p>
                      <Badge bg={table.isAvailable ? "success" : "danger"}>
                        {table.isAvailable ? "Available" : "Occupied"}
                      </Badge>
                    </div>
                    <div className="table-actions">
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => handleEditTable(table)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-danger"
                        onClick={() => handleDeleteTable(table._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Card 3: Recent Orders */}
        <Card className="dashboard-card orders-card">
          <Card.Header>
            <h3><span className="icon">📦</span> Recent Orders</h3>
          </Card.Header>
          <Card.Body>
            <div className="orders-list">
              {orders.length === 0 ? (
                <p className="text-muted">No orders yet. Orders will appear here when customers place them.</p>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="order-item">
                    <div className="order-header">
                      <h6>Order #{order.orderId || order._id.slice(-6)}</h6>
                      <Badge bg={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)} {order.status}
                      </Badge>
                    </div>
                    <div className="order-details">
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Total:</strong> ৳{order.total}</p>
                      <p><strong>Type:</strong> {order.orderType}</p>
                      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="order-actions">
                      {order.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => updateOrderStatus(order._id, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}
                      {order.status === "confirmed" && (
                        <Button 
                          size="sm" 
                          variant="warning"
                          onClick={() => updateOrderStatus(order._id, "preparing")}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button 
                          size="sm" 
                          variant="info"
                          onClick={() => updateOrderStatus(order._id, "ready")}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => updateOrderStatus(order._id, "delivered")}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Card 4: Reservations */}
        <Card className="dashboard-card reservations-card">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3><span className="icon">📅</span> Table Reservations</h3>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={fetchReservations}
              >
                🔄 Refresh
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="reservations-list">
              {reservations.length === 0 ? (
                <p className="text-muted">No reservations yet. Reservations will appear here when customers book tables.</p>
              ) : (
                reservations.slice(0, 5).map((reservation) => (
                  <div key={reservation._id} className="reservation-item">
                    <div className="reservation-header">
                      <h6>Table {reservation.tableName || reservation.tableNumber}</h6>
                      <Badge bg={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                    <div className="reservation-details">
                      <p><strong>Customer:</strong> {reservation.customerName}</p>
                      <p><strong>Contact:</strong> {reservation.customerEmail} | {reservation.customerPhone}</p>
                      <p><strong>Date:</strong> {new Date(reservation.reservationDate).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {reservation.reservationTime}</p>
                      <p><strong>Guests:</strong> {reservation.numberOfGuests}</p>
                      {reservation.specialRequests && (
                        <p><strong>Special Requests:</strong> {reservation.specialRequests}</p>
                      )}
                    </div>
                    <div className="reservation-actions">
                      {reservation.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => updateReservationStatus(reservation._id, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}
                      {reservation.status === "confirmed" && (
                        <Button 
                          size="sm" 
                          variant="info"
                          onClick={() => updateReservationStatus(reservation._id, "completed")}
                        >
                          Complete
                        </Button>
                      )}
                      {reservation.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="danger"
                          onClick={() => updateReservationStatus(reservation._id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {reservations.length > 5 && (
                <p className="text-muted text-center mt-2">
                  Showing 5 of {reservations.length} reservations
                </p>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Table Modal */}
      <Modal show={showTableModal} onHide={() => setShowTableModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTableId ? "Edit Table" : "Add New Table"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTableSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Table Name</Form.Label>
              <Form.Control
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., Table A1, Window Seat 1"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacity</Form.Label>
              <Form.Select
                value={tableCapacity}
                onChange={(e) => setTableCapacity(e.target.value)}
                required
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num} seats</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select
                value={tableLocation}
                onChange={(e) => setTableLocation(e.target.value)}
                required
              >
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Window">Window</option>
                <option value="Garden">Garden</option>
                <option value="VIP">VIP</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Available Date</Form.Label>
              <Form.Control
                type="date"
                value={tableAvailableDate}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const now = new Date();
                  const today = now.toISOString().split('T')[0];
                  
                  // Prevent past dates
                  if (selectedDate < today) {
                    setError('Cannot select past dates for table availability');
                    return;
                  }
                  
                  setTableAvailableDate(selectedDate);
                  setError(null);
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Available Time</Form.Label>
              <Form.Control
                type="time"
                value={tableAvailableTime}
                onChange={(e) => {
                  const selectedTime = e.target.value;
                  const now = new Date();
                  const currentTime = now.toLocaleTimeString('en-CA', { hour12: false }).slice(0, 5);
                  
                  // If date is today, prevent past times
                  if (tableAvailableDate === now.toISOString().split('T')[0] && selectedTime <= currentTime) {
                    setError('Cannot select past times for today');
                    return;
                  }
                  
                  setTableAvailableTime(selectedTime);
                  setError(null);
                }}
                min={tableAvailableDate === new Date().toISOString().split('T')[0] ? 
                  new Date().toLocaleTimeString('en-CA', { hour12: false }).slice(0, 5) : undefined}
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">
                {editingTableId ? "Update Table" : "Add Table"}
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowTableModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RestaurantDashboard;
