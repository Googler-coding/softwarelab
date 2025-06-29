import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatComponent from "./ChatComponent.jsx";
import "../css/UserOrderTracking.css";
import { Card, Badge, Alert, Spinner, Button, ProgressBar } from 'react-bootstrap';
import { io } from 'socket.io-client';

const UserDashboard = () => {
  const [userOrders, setUserOrders] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [error, setError] = useState(null);
  const [reservationError, setReservationError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || role !== "user") {
      navigate("/signin");
      return;
    }
    initializeSocket();
    fetchUserOrders();
    fetchUserReservations();
    const interval = setInterval(() => {
      fetchUserOrders();
      fetchUserReservations();
    }, 10000);
    return () => clearInterval(interval);
  }, [token, role, navigate]);

  const initializeSocket = () => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    newSocket.on('connect', () => {
      newSocket.emit('joinUser', localStorage.getItem('id'));
    });
    newSocket.on('orderUpdate', fetchUserOrders);
    newSocket.on('reservationUpdate', fetchUserReservations);
  };

  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/orders`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const fetchUserReservations = async () => {
    setLoadingReservations(true);
    try {
      const res = await fetch(`${API_URL}/api/reservations/my-reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch reservations");
      setUserReservations(data);
      setLoadingReservations(false);
    } catch (err) {
      setReservationError(err.message);
      setLoadingReservations(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to request cancellation of this reservation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/reservations/${reservationId}/cancel-request`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'cancel_requested',
          cancellationReason: 'Customer requested cancellation'
        })
      });

      if (response.ok) {
        alert('Cancellation request sent successfully! The restaurant will review your request.');
        fetchUserReservations(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to send cancellation request: ${error.message}`);
      }
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      alert('Failed to send cancellation request. Please try again.');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reason: 'Customer requested cancellation'
        })
      });

      if (response.ok) {
        alert('Order cancelled successfully!');
        fetchUserOrders(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to cancel order: ${error.message}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const getReservationStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'cancel_requested':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatTime = (timeString) => timeString;
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'warning',
      'confirmed': 'info',
      'preparing': 'primary',
      'ready': 'success',
      'picked-up': 'info',
      'on-the-way': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return statusColors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '🍽️',
      'picked-up': '🚚',
      'on-the-way': '🛵',
      'delivered': '🎉',
      'cancelled': '❌'
    };
    return statusIcons[status] || '❓';
  };

  const handleTrackOrder = (order) => {
    setSelectedOrderForTracking(order);
  };

  const handleBackToOrders = () => {
    setSelectedOrderForTracking(null);
  };

  if (loading && loadingReservations) {
    return (
      <div className="user-tracking-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || reservationError) {
    return (
      <div className="user-tracking-container">
        <div className="error-message">{error || reservationError}</div>
      </div>
    );
  }

  // If showing detailed tracking for a specific order
  if (selectedOrderForTracking) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-header">
          <h2>📦 Order Tracking</h2>
          <p>Track your order in real-time</p>
          <Button onClick={handleBackToOrders} variant="outline-secondary" size="sm">
            ← Back to Orders
          </Button>
        </div>

        <div className="order-summary">
          <Card className="summary-card">
            <Card.Body>
              <div className="order-header">
                <h3>Order #{selectedOrderForTracking.orderId || selectedOrderForTracking._id.slice(-6)}</h3>
                <Badge bg={getStatusColor(selectedOrderForTracking.status)} className="status-badge">
                  {getStatusIcon(selectedOrderForTracking.status)} {selectedOrderForTracking.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Restaurant:</span>
                  <span className="detail-value">{selectedOrderForTracking.restaurantId?.restaurantName || "Unknown Restaurant"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order Type:</span>
                  <span className="detail-value">{selectedOrderForTracking.orderType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value">৳{selectedOrderForTracking.total}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order Date:</span>
                  <span className="detail-value">{formatDate(selectedOrderForTracking.createdAt)}</span>
                </div>
                {selectedOrderForTracking.estimatedDeliveryTime && (
                  <div className="detail-row">
                    <span className="detail-label">Estimated Delivery:</span>
                    <span className="detail-value">{formatDateTime(selectedOrderForTracking.estimatedDeliveryTime)}</span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <h4>Order Progress</h4>
          <ProgressBar 
            now={getProgressPercentage(selectedOrderForTracking.status)} 
            variant={getStatusColor(selectedOrderForTracking.status)}
            className="progress-bar"
          />
          <div className="progress-percentage">
            {getProgressPercentage(selectedOrderForTracking.status)}% Complete
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h4>Order Items</h4>
          <div className="items-list">
            {selectedOrderForTracking.items.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-info">
                  <h5>{item.name}</h5>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ৳{item.price} each</p>
                </div>
                <div className="item-total">
                  ৳{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rider Information (if assigned) */}
        {selectedOrderForTracking.riderId && (
          <div className="rider-section">
            <h4>🚚 Delivery Information</h4>
            <Card className="rider-card">
              <Card.Body>
                <div className="rider-info">
                  <h5>Rider: {selectedOrderForTracking.riderId.name || 'Assigned'}</h5>
                  {selectedOrderForTracking.riderId.phone && (
                    <p>Phone: {selectedOrderForTracking.riderId.phone}</p>
                  )}
                  <p>Status: {selectedOrderForTracking.status}</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Special Instructions */}
        {selectedOrderForTracking.specialInstructions && (
          <div className="special-instructions">
            <h4>📝 Special Instructions</h4>
            <Card>
              <Card.Body>
                <p>{selectedOrderForTracking.specialInstructions}</p>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Real-time Updates Notice */}
        <div className="realtime-notice">
          <Alert variant="info">
            <Alert.Heading>🔄 Real-time Updates</Alert.Heading>
            <p>
              This page updates automatically. You'll see order status changes in real-time!
            </p>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="user-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <h1>📊 Dashboard</h1>
        <p className="tracking-subtitle">Track your food orders and table reservations</p>
      </div>

      {/* Reservations Section */}
      <div className="reservations-section">
        <h2>🪑 My Table Reservations</h2>
        {loadingReservations ? (
          <Spinner animation="border" />
        ) : userReservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🪑</div>
            <div className="empty-state-text">No reservations yet. Reserve a table to see it here!</div>
          </div>
        ) : (
          <div className="reservations-list">
            {userReservations.map((reservation) => (
              <Card key={reservation._id} className="reservation-card mb-3">
                <Card.Body>
                  <div className="reservation-header">
                    <h5>Table {reservation.tableName || reservation.tableNumber}</h5>
                    <Badge bg={getReservationStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </div>
                  <div className="reservation-details">
                    <div><strong>Restaurant:</strong> {reservation.restaurantId?.restaurantName || 'Unknown'}</div>
                    <div><strong>Date:</strong> {formatDate(reservation.reservationDate)}</div>
                    <div><strong>Time:</strong> {formatTime(reservation.reservationTime)}</div>
                    <div><strong>Guests:</strong> {reservation.numberOfGuests}</div>
                    {reservation.specialRequests && <div><strong>Special Requests:</strong> {reservation.specialRequests}</div>}
                  </div>
                  {['pending', 'confirmed'].includes(reservation.status) && (
                    <Button variant="danger" size="sm" className="mt-2" onClick={() => cancelReservation(reservation._id)}>
                      Request Cancellation
                    </Button>
                  )}
                  {reservation.status === 'cancel_requested' && (
                    <Alert variant="info" className="mt-2">
                      <small>⏳ Cancellation request sent. Waiting for restaurant approval.</small>
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="orders-section">
        <h2>📦 My Orders</h2>
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
                  <div className="order-id">Order #{order.orderId || order._id.slice(-6)}</div>
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
                    <div className="order-info-value">৳{order.total}</div>
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
                        {item.name} x{item.quantity} - ৳{(item.price * item.quantity)}
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
                    onClick={() => handleTrackOrder(order)}
                  >
                    📍 Track Order
                  </button>
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      className="cancel-btn"
                      onClick={() => cancelOrder(order.orderId)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ❌ Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedOrder && (
        <ChatComponent
          orderId={selectedOrder._id}
          onClose={() => {
            setShowChat(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

// Helper function to calculate progress percentage
const getProgressPercentage = (status) => {
  const statusSteps = {
    'pending': 14,
    'confirmed': 28,
    'preparing': 42,
    'ready': 57,
    'picked-up': 71,
    'on-the-way': 85,
    'delivered': 100,
    'cancelled': 0
  };
  return statusSteps[status] || 0;
};

export default UserDashboard; 