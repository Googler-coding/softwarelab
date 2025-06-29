import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Alert, Spinner, Row, Col, Badge, Modal, ProgressBar } from "react-bootstrap";
import "../css/Subscription.css";

const Subscription = () => {
  const [availablePlans, setAvailablePlans] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanType, setSelectedPlanType] = useState('monthly');
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    paymentMethod: "card",
    autoRenew: true
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAvailablePlans(),
        fetchUserSubscriptions()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/plans/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch plans");
      setAvailablePlans(data);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch subscriptions");
      setUserSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error("Error fetching user subscriptions:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      name: plan.name,
      description: plan.description
    }));
  };

  const getSelectedPlanPrice = () => {
    if (!selectedPlan) return 0;
    const planType = selectedPlan.planTypes.find(pt => pt.type === selectedPlanType);
    return planType ? planType.price : selectedPlan.price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setError("Please select a plan");
      return;
    }

    try {
      const planType = selectedPlan.planTypes.find(pt => pt.type === selectedPlanType);
      const subscriptionData = {
        ...formData,
        planType: selectedPlanType,
        planName: selectedPlan.name,
        price: planType ? planType.price : selectedPlan.price,
        features: selectedPlan.features
      };

      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create subscription");

      alert("Subscription created successfully!");
      setShowSubscriptionForm(false);
      resetForm();
      fetchUserSubscriptions();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      paymentMethod: "card",
      autoRenew: true
    });
    setSelectedPlan(null);
    setSelectedPlanType('monthly');
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${subscriptionId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "User requested cancellation" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel subscription");

      alert("Subscription cancelled successfully!");
      fetchUserSubscriptions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRenewSubscription = async (subscriptionId) => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${subscriptionId}/renew`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to renew subscription");

      alert("Subscription renewed successfully!");
      fetchUserSubscriptions();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'active': 'success',
      'pending': 'warning',
      'cancelled': 'danger',
      'expired': 'secondary',
      'suspended': 'warning'
    };
    return statusColors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'active': '✅',
      'pending': '⏳',
      'cancelled': '❌',
      'expired': '⏰',
      'suspended': '⚠️'
    };
    return statusIcons[status] || '❓';
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateProgressPercentage = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  if (loading) {
    return (
      <div className="subscription-container">
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading subscription system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-container">
      {/* Header */}
      <div className="subscription-header">
        <h1>💳 Subscription Plans</h1>
        <p className="subscription-subtitle">Choose the perfect plan for your needs</p>
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => setShowSubscriptionForm(true)}
          className="create-subscription-btn"
        >
          🚀 Subscribe Now
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Available Plans */}
      <div className="plans-section">
        <h2>📋 Available Plans</h2>
        <div className="plans-grid">
          {availablePlans.map((plan) => (
            <Card key={plan.name} className="plan-card">
              <Card.Header className="plan-card-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price-amount">৳{plan.price}</span>
                  <span className="price-period">/month</span>
                </div>
              </Card.Header>
              <Card.Body>
                <p className="plan-description">{plan.description}</p>
                
                <div className="plan-features">
                  <h6>Features:</h6>
                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index}>✅ {feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="plan-types">
                  <h6>Available Plans:</h6>
                  <div className="plan-types-grid">
                    {plan.planTypes.map((pt) => (
                      <div key={pt.type} className="plan-type-item">
                        <span className="plan-type-name">{pt.type}</span>
                        <span className="plan-type-price">৳{pt.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline-primary" 
                  className="select-plan-btn"
                  onClick={() => handlePlanSelect(plan)}
                >
                  Select Plan
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>

      {/* User's Subscriptions */}
      <div className="subscriptions-section">
        <h2>📋 My Subscriptions</h2>
        {userSubscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-text">No active subscriptions. Subscribe to a plan to get started!</div>
          </div>
        ) : (
          <div className="subscriptions-grid">
            {userSubscriptions.map((subscription) => (
              <Card key={subscription._id} className="subscription-card">
                <Card.Header className="subscription-card-header">
                  <div className="subscription-id">{subscription.subscriptionId}</div>
                  <Badge bg={getStatusColor(subscription.status)} className="status-badge">
                    {getStatusIcon(subscription.status)} {subscription.status}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <h5 className="subscription-name">{subscription.name}</h5>
                  <p className="subscription-description">{subscription.description}</p>
                  
                  <div className="subscription-details">
                    <div className="detail-row">
                      <span className="detail-label">Plan:</span>
                      <span className="detail-value">{subscription.planName} ({subscription.planType})</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">৳{subscription.price}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Start Date:</span>
                      <span className="detail-value">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Auto Renew:</span>
                      <span className="detail-value">
                        {subscription.autoRenew ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="subscription-progress">
                    <div className="progress-info">
                      <span>Subscription Progress</span>
                      <span>{calculateDaysRemaining(subscription.endDate)} days remaining</span>
                    </div>
                    <ProgressBar 
                      now={calculateProgressPercentage(subscription.startDate, subscription.endDate)} 
                      variant={getStatusColor(subscription.status)}
                      className="progress-bar"
                    />
                  </div>

                  {/* Features */}
                  {subscription.features && subscription.features.length > 0 && (
                    <div className="subscription-features">
                      <h6>Your Features:</h6>
                      <ul className="features-list">
                        {subscription.features.map((feature, index) => (
                          <li key={index}>✅ {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="subscription-actions">
                    {subscription.status === 'active' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleCancelSubscription(subscription._id)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                    {subscription.status === 'cancelled' && (
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        onClick={() => handleRenewSubscription(subscription._id)}
                      >
                        Renew Subscription
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Form Modal */}
      <Modal 
        show={showSubscriptionForm} 
        onHide={() => setShowSubscriptionForm(false)}
        size="lg"
        className="subscription-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>🚀 Create New Subscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {/* Plan Selection */}
            <h5>📋 Select Plan</h5>
            <div className="plans-selection-grid">
              {availablePlans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`plan-selection-card ${selectedPlan?.name === plan.name ? 'selected' : ''}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <Card.Body>
                    <h6>{plan.name}</h6>
                    <p className="plan-price">৳{plan.price}/month</p>
                    <p className="plan-description">{plan.description}</p>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {selectedPlan && (
              <>
                {/* Plan Type Selection */}
                <h5>📅 Select Plan Duration</h5>
                <div className="plan-types-selection">
                  {selectedPlan.planTypes.map((pt) => (
                    <Form.Check
                      key={pt.type}
                      type="radio"
                      id={`plan-type-${pt.type}`}
                      name="planType"
                      label={`${pt.type.charAt(0).toUpperCase() + pt.type.slice(1)} - ৳${pt.price}`}
                      checked={selectedPlanType === pt.type}
                      onChange={() => setSelectedPlanType(pt.type)}
                      className="plan-type-radio"
                    />
                  ))}
                </div>

                {/* Subscription Details */}
                <h5>📝 Subscription Details</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter subscription name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Method *</Form.Label>
                      <Form.Select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="card">Credit/Debit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_banking">Mobile Banking</option>
                        <option value="cash">Cash</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter subscription description..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="autoRenew"
                    checked={formData.autoRenew}
                    onChange={handleInputChange}
                    label="Auto-renew subscription"
                  />
                </Form.Group>

                <div className="subscription-summary">
                  <h6>Subscription Summary</h6>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Plan:</span>
                      <span>{selectedPlan.name} ({selectedPlanType})</span>
                    </div>
                    <div className="summary-row">
                      <span>Price:</span>
                      <span>৳{getSelectedPlanPrice()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Auto-renew:</span>
                      <span>{formData.autoRenew ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubscriptionForm(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!selectedPlan}
          >
            Create Subscription
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Subscription; 