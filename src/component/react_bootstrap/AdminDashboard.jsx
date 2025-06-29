// src/component/react_bootstrap/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchOverviewData();
  }, [token, navigate]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchReservations(),
        fetchDonations(),
        fetchSubscriptions(),
        fetchNotifications(),
        fetchActivityLogs(),
        fetchCharities(),
        fetchSystemStats()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch reservations");
      setReservations(data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch donations");
      setDonations(data.donations || []);
    } catch (err) {
      console.error("Error fetching donations:", err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch subscriptions");
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/activity-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch activity logs");
      setActivityLogs(data.logs || []);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    }
  };

  const fetchCharities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/charities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch charities");
      setCharities(data.charities || []);
    } catch (err) {
      console.error("Error fetching charities:", err);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const [donationStats, subscriptionStats, notificationStats] = await Promise.all([
        fetch(`${API_URL}/api/donations/statistics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/subscriptions/statistics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/notifications/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const donationData = await donationStats.json();
      const subscriptionData = await subscriptionStats.json();
      const notificationData = await notificationStats.json();

      setStats({
        donations: donationData,
        subscriptions: subscriptionData,
        notifications: notificationData
      });
    } catch (err) {
      console.error("Error fetching system stats:", err);
    }
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  };

  const getReservationStatusCount = (status) => {
    return reservations.filter(reservation => reservation.status === status).length;
  };

  const getDonationStatusCount = (status) => {
    return donations.filter(donation => donation.status === status).length;
  };

  const getSubscriptionStatusCount = (status) => {
    return subscriptions.filter(subscription => subscription.status === status).length;
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  const getCharityStatusCount = (status) => {
    return charities.filter(charity => charity.status === status).length;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
        <p className="admin-subtitle">Master control panel for all system features</p>
      </div>

      <div className="admin-content">
        {error && <div className="error-message">{error}</div>}

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            🧾 Orders
          </button>
          <button 
            className={`tab-button ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => handleTabChange('donations')}
          >
            🍽️ Donations
          </button>
          <button 
            className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => handleTabChange('subscriptions')}
          >
            💳 Subscriptions
          </button>
          <button 
            className={`tab-button ${activeTab === 'charities' ? 'active' : ''}`}
            onClick={() => handleTabChange('charities')}
          >
            🏥 Charities
          </button>
          <button 
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleTabChange('notifications')}
          >
            🔔 Notifications
          </button>
          <button 
            className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => handleTabChange('activity')}
          >
            📝 Activity Logs
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">📊</span> System Overview</h3>
            </div>
            
            <div className="stats-grid">
              {/* Orders Stats */}
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
                <div className="stat-icon">💰</div>
                <div className="stat-number">৳{getTotalRevenue().toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>

              {/* Donations Stats */}
              <div className="stat-card">
                <div className="stat-icon">🍽️</div>
                <div className="stat-number">{donations.length}</div>
                <div className="stat-label">Total Donations</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-number">{getDonationStatusCount('pending')}</div>
                <div className="stat-label">Pending Donations</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-number">{getDonationStatusCount('completed')}</div>
                <div className="stat-label">Completed Donations</div>
              </div>

              {/* Subscriptions Stats */}
              <div className="stat-card">
                <div className="stat-icon">💳</div>
                <div className="stat-number">{subscriptions.length}</div>
                <div className="stat-label">Total Subscriptions</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🟢</div>
                <div className="stat-number">{getSubscriptionStatusCount('active')}</div>
                <div className="stat-label">Active Subscriptions</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-number">৳{stats.subscriptions?.totalRevenue || 0}</div>
                <div className="stat-label">Subscription Revenue</div>
              </div>

              {/* Charities Stats */}
              <div className="stat-card">
                <div className="stat-icon">🏥</div>
                <div className="stat-number">{charities.length}</div>
                <div className="stat-label">Total Charities</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-number">{getCharityStatusCount('active')}</div>
                <div className="stat-label">Active Charities</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-number">{getCharityStatusCount('pending')}</div>
                <div className="stat-label">Pending Charities</div>
              </div>

              {/* Notifications Stats */}
              <div className="stat-card">
                <div className="stat-icon">🔔</div>
                <div className="stat-number">{notifications.length}</div>
                <div className="stat-label">Total Notifications</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📬</div>
                <div className="stat-number">{getUnreadNotificationsCount()}</div>
                <div className="stat-label">Unread Notifications</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-number">{activityLogs.length}</div>
                <div className="stat-label">Activity Logs</div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">🧾</span> All Orders</h3>
            </div>
            
            <div className="orders-grid">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">No orders found.</div>
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
                        <div className="order-info-label">Total</div>
                        <div className="order-info-value">৳{order.total}</div>
                      </div>
                      <div className="order-info">
                        <div className="order-info-label">Date</div>
                        <div className="order-info-value">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">🍽️</span> Food Donations</h3>
            </div>
            
            <div className="donations-grid">
              {donations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🍽️</div>
                  <div className="empty-state-text">No donations found.</div>
                </div>
              ) : (
                donations.map((donation) => (
                  <div key={donation._id} className="donation-card">
                    <div className="donation-header">
                      <div className="donation-id">{donation.donationId}</div>
                      <span className={`donation-status status-${donation.status}`}>
                        {donation.status}
                      </span>
                    </div>
                    
                    <div className="donation-details">
                      <div className="donation-info">
                        <div className="donation-info-label">Title</div>
                        <div className="donation-info-value">{donation.title}</div>
                      </div>
                      <div className="donation-info">
                        <div className="donation-info-label">Donor</div>
                        <div className="donation-info-value">{donation.donorName}</div>
                      </div>
                      <div className="donation-info">
                        <div className="donation-info-label">Charity</div>
                        <div className="donation-info-value">{donation.charityName}</div>
                      </div>
                      <div className="donation-info">
                        <div className="donation-info-label">Value</div>
                        <div className="donation-info-value">৳{donation.totalValue}</div>
                      </div>
                      <div className="donation-info">
                        <div className="donation-info-label">Date</div>
                        <div className="donation-info-value">
                          {new Date(donation.donationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">💳</span> Subscriptions</h3>
            </div>
            
            <div className="subscriptions-grid">
              {subscriptions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💳</div>
                  <div className="empty-state-text">No subscriptions found.</div>
                </div>
              ) : (
                subscriptions.map((subscription) => (
                  <div key={subscription._id} className="subscription-card">
                    <div className="subscription-header">
                      <div className="subscription-id">{subscription.subscriptionId}</div>
                      <span className={`subscription-status status-${subscription.status}`}>
                        {subscription.status}
                      </span>
                    </div>
                    
                    <div className="subscription-details">
                      <div className="subscription-info">
                        <div className="subscription-info-label">Name</div>
                        <div className="subscription-info-value">{subscription.name}</div>
                      </div>
                      <div className="subscription-info">
                        <div className="subscription-info-label">Subscriber</div>
                        <div className="subscription-info-value">{subscription.subscriberName}</div>
                      </div>
                      <div className="subscription-info">
                        <div className="subscription-info-label">Plan</div>
                        <div className="subscription-info-value">{subscription.planName} ({subscription.planType})</div>
                      </div>
                      <div className="subscription-info">
                        <div className="subscription-info-label">Price</div>
                        <div className="subscription-info-value">৳{subscription.price}</div>
                      </div>
                      <div className="subscription-info">
                        <div className="subscription-info-label">End Date</div>
                        <div className="subscription-info-value">
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Charities Tab */}
        {activeTab === 'charities' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">🏥</span> Charities</h3>
            </div>
            
            <div className="charities-grid">
              {charities.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏥</div>
                  <div className="empty-state-text">No charities found.</div>
                </div>
              ) : (
                charities.map((charity) => (
                  <div key={charity._id} className="charity-card">
                    <div className="charity-header">
                      <div className="charity-name">{charity.name}</div>
                      <span className={`charity-status status-${charity.status}`}>
                        {charity.status}
                      </span>
                    </div>
                    
                    <div className="charity-details">
                      <div className="charity-info">
                        <div className="charity-info-label">Type</div>
                        <div className="charity-info-value">{charity.organizationType}</div>
                      </div>
                      <div className="charity-info">
                        <div className="charity-info-label">Contact</div>
                        <div className="charity-info-value">{charity.contactPerson.name}</div>
                      </div>
                      <div className="charity-info">
                        <div className="charity-info-label">Email</div>
                        <div className="charity-info-value">{charity.email}</div>
                      </div>
                      <div className="charity-info">
                        <div className="charity-info-label">Verified</div>
                        <div className="charity-info-value">{charity.verified ? '✅' : '❌'}</div>
                      </div>
                      <div className="charity-info">
                        <div className="charity-info-label">Capacity</div>
                        <div className="charity-info-value">{charity.capacity.dailyMeals} meals/day</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">🔔</span> Notifications</h3>
            </div>
            
            <div className="notifications-grid">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔔</div>
                  <div className="empty-state-text">No notifications found.</div>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification._id} className={`notification-card ${!notification.read ? 'unread' : ''}`}>
                    <div className="notification-header">
                      <div className="notification-title">{notification.title}</div>
                      <span className={`notification-type type-${notification.type}`}>
                        {notification.type}
                      </span>
                    </div>
                    
                    <div className="notification-details">
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-meta">
                        <span className="notification-date">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <span className="notification-priority">
                          {notification.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <div className="admin-section">
            <div className="section-header">
              <h3><span className="icon">📝</span> Activity Logs</h3>
            </div>
            
            <div className="activity-grid">
              {activityLogs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-text">No activity logs found.</div>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="activity-card">
                    <div className="activity-header">
                      <div className="activity-action">{log.action}</div>
                      <span className={`activity-status status-${log.status}`}>
                        {log.status}
                      </span>
                    </div>
                    
                    <div className="activity-details">
                      <div className="activity-info">
                        <div className="activity-info-label">User</div>
                        <div className="activity-info-value">{log.userName}</div>
                      </div>
                      <div className="activity-info">
                        <div className="activity-info-label">Type</div>
                        <div className="activity-info-value">{log.userType}</div>
                      </div>
                      <div className="activity-info">
                        <div className="activity-info-label">Description</div>
                        <div className="activity-info-value">{log.details.description}</div>
                      </div>
                      <div className="activity-info">
                        <div className="activity-info-label">Date</div>
                        <div className="activity-info-value">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
