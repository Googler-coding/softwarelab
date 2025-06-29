import React, { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar, Button, Alert, Spinner } from 'react-bootstrap';
import { io } from 'socket.io-client';
import '../css/OrderTracking.css';

const OrderTracking = ({ orderId, userRole, userId }) => {
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join user room for real-time updates
    if (userId) {
      newSocket.emit('joinUser', userId);
    }

    // Listen for order updates
    newSocket.on('orderUpdate', (data) => {
      if (data.orderId === orderId) {
        fetchOrderTracking();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [orderId, userId]);

  useEffect(() => {
    fetchOrderTracking();
  }, [orderId]);

  const fetchOrderTracking = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order tracking');
      }

      const data = await response.json();
      setTracking(data);
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      'picked-up': 'info',
      'on-the-way': 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return statusColors[status] || 'secondary';
  };

  const getKitchenStatusColor = (status) => {
    const kitchenColors = {
      pending: 'warning',
      preparing: 'primary',
      ready: 'success',
    };
    return kitchenColors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '🍽️',
      'picked-up': '🚚',
      'on-the-way': '🛵',
      delivered: '🎉',
      cancelled: '❌',
    };
    return icons[status] || '📋';
  };

  const getKitchenStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      preparing: '👨‍🍳',
      ready: '🍽️',
    };
    return icons[status] || '📋';
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleString();
  };

  const calculateProgress = () => {
    if (!order) return 0;
    
    const statusProgress = {
      pending: 10,
      confirmed: 20,
      preparing: 40,
      ready: 60,
      'picked-up': 80,
      'on-the-way': 90,
      delivered: 100,
      cancelled: 0,
    };
    
    return statusProgress[order.status] || 0;
  };

  if (loading) {
    return (
      <div className="order-tracking-container">
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-container">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-container">
        <Alert variant="info">
          <Alert.Heading>No Order Found</Alert.Heading>
          <p>Order tracking information is not available.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="order-tracking-container">
      <Card className="tracking-card">
        <Card.Header className="tracking-header">
          <h3>Order Tracking</h3>
          <Badge bg={getStatusColor(order.status)} className="status-badge">
            {getStatusIcon(order.status)} {order.status.replace('-', ' ').toUpperCase()}
          </Badge>
        </Card.Header>
        
        <Card.Body>
          {/* Order Progress */}
          <div className="progress-section">
            <h5>Order Progress</h5>
            <ProgressBar 
              now={calculateProgress()} 
              variant={getStatusColor(order.status)}
              className="progress-bar"
            />
            <div className="progress-labels">
              <span>Order Placed</span>
              <span>Confirmed</span>
              <span>Preparing</span>
              <span>Ready</span>
              <span>Delivered</span>
            </div>
          </div>

          {/* Kitchen Status */}
          <div className="kitchen-status-section">
            <h5>Kitchen Status</h5>
            <div className="kitchen-status">
              <Badge bg={getKitchenStatusColor(order.kitchenStatus)} className="kitchen-badge">
                {getKitchenStatusIcon(order.kitchenStatus)} {order.kitchenStatus.toUpperCase()}
              </Badge>
              {order.estimatedPreparationTime && (
                <span className="prep-time">
                  Estimated preparation time: {order.estimatedPreparationTime} minutes
                </span>
              )}
            </div>
          </div>

          {/* Preparation Times */}
          {(order.preparationStartTime || order.preparationEndTime) && (
            <div className="preparation-times">
              <h5>Preparation Details</h5>
              <div className="time-details">
                {order.preparationStartTime && (
                  <div className="time-item">
                    <strong>Started:</strong> {formatTime(order.preparationStartTime)}
                  </div>
                )}
                {order.preparationEndTime && (
                  <div className="time-item">
                    <strong>Completed:</strong> {formatTime(order.preparationEndTime)}
                  </div>
                )}
                {order.actualPreparationTime && (
                  <div className="time-item">
                    <strong>Actual Time:</strong> {order.actualPreparationTime} minutes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          {order.rider && (
            <div className="delivery-info">
              <h5>Delivery Information</h5>
              <div className="rider-details">
                <div className="rider-info">
                  <strong>Rider:</strong> {order.rider.name}
                </div>
                <div className="rider-info">
                  <strong>Phone:</strong> {order.rider.phone}
                </div>
                {order.rider.currentLocation && (
                  <div className="rider-location">
                    <strong>Current Location:</strong> 
                    {order.rider.currentLocation.lat && order.rider.currentLocation.lng ? (
                      <span> {order.rider.currentLocation.lat.toFixed(4)}, {order.rider.currentLocation.lng.toFixed(4)}</span>
                    ) : (
                      <span> Location not available</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Times */}
          <div className="estimated-times">
            <h5>Estimated Times</h5>
            <div className="time-details">
              {order.estimatedDeliveryTime && (
                <div className="time-item">
                  <strong>Estimated Delivery:</strong> {formatTime(order.estimatedDeliveryTime)}
                </div>
              )}
              {order.actualDeliveryTime && (
                <div className="time-item">
                  <strong>Actual Delivery:</strong> {formatTime(order.actualDeliveryTime)}
                </div>
              )}
            </div>
          </div>

          {/* Tracking Updates */}
          {order.trackingUpdates && order.trackingUpdates.length > 0 && (
            <div className="tracking-updates">
              <h5>Recent Updates</h5>
              <div className="updates-list">
                {order.trackingUpdates.slice(-5).reverse().map((update, index) => (
                  <div key={index} className="update-item">
                    <div className="update-header">
                      <Badge bg={getStatusColor(update.status)} className="update-badge">
                        {update.status.toUpperCase()}
                      </Badge>
                      <span className="update-time">{formatTime(update.timestamp)}</span>
                    </div>
                    <div className="update-message">{update.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default OrderTracking; 