import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Alert, Spinner, Row, Col, Badge, Modal } from "react-bootstrap";
import "../css/FoodDonation.css";

const FoodDonation = () => {
  const [charities, setCharities] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [donationItems, setDonationItems] = useState([{ name: "", price: 0, quantity: 1, description: "" }]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    donationDate: "",
    pickupDate: "",
    pickupTime: "",
    pickupAddress: "",
    specialInstructions: ""
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
        fetchCharities(),
        fetchUserDonations()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/charities/public/available`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch charities");
      setCharities(data);
    } catch (err) {
      console.error("Error fetching charities:", err);
    }
  };

  const fetchUserDonations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch donations");
      setUserDonations(data.donations || []);
    } catch (err) {
      console.error("Error fetching user donations:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...donationItems];
    updatedItems[index][field] = value;
    setDonationItems(updatedItems);
  };

  const addItem = () => {
    setDonationItems([...donationItems, { name: "", price: 0, quantity: 1, description: "" }]);
  };

  const removeItem = (index) => {
    if (donationItems.length > 1) {
      const updatedItems = donationItems.filter((_, i) => i !== index);
      setDonationItems(updatedItems);
    }
  };

  const handleCharitySelect = (charity) => {
    setSelectedCharity(charity);
  };

  const calculateTotalValue = () => {
    return donationItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCharity) {
      setError("Please select a charity");
      return;
    }

    if (donationItems.some(item => !item.name || item.price <= 0)) {
      setError("Please fill in all item details correctly");
      return;
    }

    try {
      const donationData = {
        ...formData,
        charityId: selectedCharity._id,
        items: donationItems,
        coordinates: selectedCharity.coordinates
      };

      const res = await fetch(`${API_URL}/api/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(donationData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create donation");

      alert("Donation created successfully!");
      setShowDonationForm(false);
      resetForm();
      fetchUserDonations();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      donationDate: "",
      pickupDate: "",
      pickupTime: "",
      pickupAddress: "",
      specialInstructions: ""
    });
    setDonationItems([{ name: "", price: 0, quantity: 1, description: "" }]);
    setSelectedCharity(null);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'warning',
      'approved': 'info',
      'delivery': 'primary',
      'picked_up': 'success',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return statusColors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'pending': '⏳',
      'approved': '✅',
      'delivery': '🚚',
      'picked_up': '📦',
      'completed': '🎉',
      'cancelled': '❌'
    };
    return statusIcons[status] || '❓';
  };

  if (loading) {
    return (
      <div className="donation-container">
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading donation system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="donation-container">
      {/* Header */}
      <div className="donation-header">
        <h1>🍽️ Food Donation</h1>
        <p className="donation-subtitle">Help reduce food waste and support those in need</p>
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => setShowDonationForm(true)}
          className="create-donation-btn"
        >
          🎁 Create New Donation
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* User's Donations */}
      <div className="donations-section">
        <h2>📋 My Donations</h2>
        {userDonations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-text">No donations yet. Create your first donation!</div>
          </div>
        ) : (
          <div className="donations-grid">
            {userDonations.map((donation) => (
              <Card key={donation._id} className="donation-card">
                <Card.Header className="donation-card-header">
                  <div className="donation-id">{donation.donationId}</div>
                  <Badge bg={getStatusColor(donation.status)} className="status-badge">
                    {getStatusIcon(donation.status)} {donation.status.replace('_', ' ')}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <h5 className="donation-title">{donation.title}</h5>
                  <p className="donation-description">{donation.description}</p>
                  
                  <div className="donation-details">
                    <div className="detail-row">
                      <span className="detail-label">Charity:</span>
                      <span className="detail-value">{donation.charityName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Value:</span>
                      <span className="detail-value">৳{donation.totalValue}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pickup Date:</span>
                      <span className="detail-value">
                        {new Date(donation.pickupDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pickup Time:</span>
                      <span className="detail-value">{donation.pickupTime}</span>
                    </div>
                  </div>

                  {donation.items && donation.items.length > 0 && (
                    <div className="donation-items">
                      <h6>Items:</h6>
                      <ul className="items-list">
                        {donation.items.map((item, index) => (
                          <li key={index}>
                            {item.name} x{item.quantity} - ৳{item.price * item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {donation.trackingUpdates && donation.trackingUpdates.length > 0 && (
                    <div className="tracking-updates">
                      <h6>Latest Update:</h6>
                      <p className="latest-update">
                        {donation.trackingUpdates[donation.trackingUpdates.length - 1].message}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Donation Form Modal */}
      <Modal 
        show={showDonationForm} 
        onHide={() => setShowDonationForm(false)}
        size="lg"
        className="donation-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>🎁 Create New Food Donation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <h5>📝 Donation Details</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Fresh vegetables and bread"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Donation Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="donationDate"
                    value={formData.donationDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the food items and their condition..."
                required
              />
            </Form.Group>

            {/* Charity Selection */}
            <h5>🏥 Select Charity</h5>
            <div className="charities-grid">
              {charities.map((charity) => (
                <Card 
                  key={charity._id} 
                  className={`charity-card ${selectedCharity?._id === charity._id ? 'selected' : ''}`}
                  onClick={() => handleCharitySelect(charity)}
                >
                  <Card.Body>
                    <h6>{charity.name}</h6>
                    <p className="charity-type">{charity.organizationType}</p>
                    <p className="charity-address">{charity.address}</p>
                    <p className="charity-capacity">
                      Capacity: {charity.capacity?.dailyMeals || 'N/A'} meals/day
                    </p>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Food Items */}
            <h5>🍎 Food Items</h5>
            {donationItems.map((item, index) => (
              <Card key={index} className="item-card">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Item Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="e.g., Fresh vegetables"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price (৳) *</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group className="mb-3">
                        <Form.Label>Quantity *</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="e.g., Fresh, unopened"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={1}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={donationItems.length === 1}
                        className="remove-item-btn"
                      >
                        ×
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
            
            <Button variant="outline-secondary" onClick={addItem} className="add-item-btn">
              ➕ Add Another Item
            </Button>

            <div className="total-value">
              <strong>Total Value: ৳{calculateTotalValue()}</strong>
            </div>

            {/* Pickup Information */}
            <h5>📅 Pickup Information</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pickup Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pickup Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="pickupTime"
                    value={formData.pickupTime}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Pickup Address *</Form.Label>
              <Form.Control
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleInputChange}
                placeholder="Enter your pickup address"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Special Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                placeholder="Any special instructions for pickup..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDonationForm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Donation
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FoodDonation; 