import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import '../css/TableReservation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TableReservation = ({ restaurantId, onReservationComplete }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: ''
  });
  
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchTables();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Fetch current user data from database
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const user = await response.json();
          setUserData(user);
          setFormData(prev => ({
            ...prev,
            customerName: user?.name || '',
            customerEmail: user?.email || '',
            customerPhone: user?.phone || ''
          }));
          console.log('User data loaded:', user);
        } else {
          console.error('Failed to fetch user data');
          // Fallback to localStorage if API fails
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          setUserData(localUser);
          setFormData(prev => ({
            ...prev,
            customerName: localUser?.name || '',
            customerEmail: localUser?.email || '',
            customerPhone: localUser?.phone || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to localStorage
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData(localUser);
        setFormData(prev => ({
          ...prev,
          customerName: localUser?.name || '',
          customerEmail: localUser?.email || '',
          customerPhone: localUser?.phone || ''
        }));
      }
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const checkAvailability = async () => {
    if (!formData.date || !formData.time || !formData.guests) {
      setError('Please select date, time, and number of guests first');
      return;
    }

    // Real-time validation before checking availability
    if (!validateDateTime(formData.date, formData.time)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Checking availability for:', {
        restaurantId,
        date: formData.date,
        time: formData.time,
        guests: formData.guests
      });

      // Use the correct endpoint for availability check
      const response = await fetch(`${API_URL}/api/reservations/available/${restaurantId}?date=${formData.date}&time=${formData.time}&numberOfGuests=${formData.guests}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check availability');
      }

      const availabilityData = await response.json();
      console.log('Availability data:', availabilityData);
      
      // Update tables with availability status from the server response
      const updatedTables = tables.map(table => {
        const isAvailable = availabilityData.availableTables.some(availableTable => 
          availableTable.tableNumber === table.tableNumber
        );
        const isBooked = availabilityData.bookedTables.some(bookedTable => 
          bookedTable.tableNumber === table.tableNumber
        );
        
        return {
          ...table,
          isAvailable: isAvailable && table.capacity >= parseInt(formData.guests),
          isBooked: isBooked || table.capacity < parseInt(formData.guests)
        };
      });
      
      setTables(updatedTables);
      setAvailabilityChecked(true);
      setSelectedTable(null); // Reset selection
      
      // Show success message if tables are available
      if (availabilityData.availableTables.length > 0) {
        setSuccess(`Found ${availabilityData.availableTables.length} available table(s) for your party!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('No tables available for the selected time and party size. Please try a different time or date.');
      }
      
    } catch (error) {
      console.error('Availability check error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table) => {
    if (table.isBooked) {
      setError('This table is already booked for the selected time');
      return;
    }
    
    if (table.capacity < parseInt(formData.guests)) {
      setError(`This table can only accommodate ${table.capacity} guests, but you selected ${formData.guests} guests`);
      return;
    }
    
    setSelectedTable(table);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.date || !formData.time || !formData.guests || 
        !formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      setError('Please fill in all required fields');
      return;
    }

    if (!selectedTable) {
      setError('Please select a table');
      return;
    }

    // Final validation before submission
    if (!validateDateTime(formData.date, formData.time)) {
      setError('Please select a valid future date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Submitting reservation with data:', {
        restaurantId,
        tableNumber: selectedTable.tableNumber,
        reservationDate: formData.date,
        reservationTime: formData.time,
        numberOfGuests: formData.guests
      });

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          tableNumber: selectedTable.tableNumber,
          tableName: selectedTable.tableName,
          reservationDate: formData.date,
          reservationTime: formData.time,
          numberOfGuests: parseInt(formData.guests),
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          specialRequests: formData.specialRequests,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reservation');
      }

      const reservation = await response.json();
      console.log('Reservation created successfully:', reservation);
      setSuccess(true);
      setShowConfirmation(true);
      
      // Update table availability
      const updatedTables = tables.map(table => 
        table._id === selectedTable._id ? { ...table, isBooked: true, isAvailable: false } : table
      );
      setTables(updatedTables);
      
    } catch (error) {
      console.error('Reservation error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation for date and time
    if (name === 'date' || name === 'time') {
      if (formData.date && formData.time) {
        validateDateTime(formData.date, formData.time);
      }
    }

    // Reset availability check when date/time/guests change
    if (name === 'date' || name === 'time' || name === 'guests') {
      setAvailabilityChecked(false);
      setSelectedTable(null);
      setError(null); // Clear previous errors
    }

    // Real-time validation for guests
    if (name === 'guests' && value) {
      const guestCount = parseInt(value);
      if (guestCount < 1 || guestCount > 20) {
        setError('Number of guests must be between 1 and 20');
        return;
      }
      setError(null);
    }
  };

  const validateDateTime = (date, time) => {
    const now = new Date();
    const selectedDateTime = new Date(`${date}T${time}`);
    
    // Check if it's in the past
    if (selectedDateTime <= now) {
      setError('Cannot select past dates and times. Please choose a future date and time.');
      return false;
    }
    
    // Check if it's too close to current time (within 30 minutes)
    const timeDiff = selectedDateTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    if (minutesDiff <= 30) {
      setError('Reservations must be made at least 30 minutes in advance.');
      return false;
    }

    // Check if it's more than 30 days in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (selectedDateTime > maxDate) {
      setError('Reservations can only be made up to 30 days in advance.');
      return false;
    }
    
    // Clear error if validation passes
    if (error && (error.includes('past dates') || error.includes('30 minutes') || error.includes('30 days'))) {
      setError(null);
    }
    return true;
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Generate time slots from 10 AM to 11 PM (10:00 to 23:00)
    for (let hour = 10; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this time is in the past for today
        const isPastTime = formData.date === today && 
          (hour < currentHour || (hour === currentHour && minute <= currentMinute));
        
        // Check if this time is too close to current time (within 30 minutes)
        const timeDiff = (hour - currentHour) * 60 + (minute - currentMinute);
        const isTooClose = formData.date === today && timeDiff <= 30;
        
        const isDisabled = isPastTime || isTooClose;
        
        // Format display time (12-hour format)
        let displayHour = hour;
        let ampm = 'AM';
        if (hour > 12) {
          displayHour = hour - 12;
          ampm = 'PM';
        } else if (hour === 12) {
          ampm = 'PM';
        } else if (hour === 0) {
          displayHour = 12;
        }
        
        slots.push({
          value: timeString,
          label: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
          disabled: isDisabled,
          reason: isPastTime ? 'Past time' : isTooClose ? 'Too close to current time' : null
        });
      }
    }
    return slots;
  };

  const handleClose = () => {
    setShowConfirmation(false);
    if (onReservationComplete) onReservationComplete();
  };

  return (
    <div className="table-reservation-container">
      <Card className="reservation-card">
        <Card.Header className="reservation-header">
          <h3>🍽️ Table Reservation</h3>
          <p>Select your preferred date, time, and table</p>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>📅 Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>🕐 Time *</Form.Label>
                  <Form.Select
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select time</option>
                    {generateTimeSlots().map((slot) => (
                      <option key={slot.value} value={slot.value} disabled={slot.disabled}>
                        {slot.label} {slot.reason && `(${slot.reason})`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>👥 Number of Guests *</Form.Label>
                  <Form.Select
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select guests</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Button 
                  variant="outline-primary" 
                  onClick={checkAvailability}
                  disabled={!formData.date || !formData.time || !formData.guests || loading}
                  className="w-100"
                >
                  {loading ? <Spinner animation="border" size="sm" /> : '🔍 Check Availability'}
                </Button>
              </Col>
            </Row>

            {/* Customer Information */}
            <h5 className="mt-4">👤 Customer Information</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>📝 Special Requests (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Any special requests or dietary requirements..."
              />
            </Form.Group>

            {/* Table Selection */}
            {availabilityChecked && (
              <div className="table-selection-section">
                <h5 className="mt-4">🪑 Select Your Table</h5>
                {tables.filter(table => table.capacity >= parseInt(formData.guests) && table.isAvailable).length === 0 ? (
                  <Alert variant="warning">
                    No tables available for {formData.guests} guests at {formData.time} on {formData.date}
                  </Alert>
                ) : (
                  <div className="tables-grid">
                    {tables
                      .filter(table => table.capacity >= parseInt(formData.guests))
                      .map((table) => (
                        <div
                          key={table._id}
                          className={`table-item ${table.isBooked ? 'booked' : 'available'} ${selectedTable?._id === table._id ? 'selected' : ''}`}
                          onClick={() => handleTableSelect(table)}
                        >
                          <div className="table-code">{table.tableCode || `T${table.tableNumber}`}</div>
                          <div className="table-info">
                            <div className="table-name">{table.tableName || `Table ${table.tableNumber}`}</div>
                            <div className="table-capacity">👥 {table.capacity}</div>
                            <div className="table-location">📍 {table.location || 'Standard'}</div>
                          </div>
                          <div className="table-status">
                            {table.isBooked ? (
                              <Badge bg="danger">❌ Booked</Badge>
                            ) : (
                              <Badge bg="success">✅ Available</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="reservation-actions mt-4">
              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={!selectedTable || loading || !availabilityChecked}
                className="me-2"
              >
                {loading ? <Spinner animation="border" size="sm" /> : '✅ Confirm Reservation'}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={onReservationComplete}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="confirmation-message mt-4">
          <Alert variant="success">
            <Alert.Heading>🎉 Reservation Confirmed!</Alert.Heading>
            <p>Your table reservation has been successfully created.</p>
            <div className="reservation-details">
              <p><strong>Table:</strong> {selectedTable?.tableCode} ({selectedTable?.tableName})</p>
              <p><strong>Date:</strong> {formData.date}</p>
              <p><strong>Time:</strong> {formData.time}</p>
              <p><strong>Guests:</strong> {formData.guests}</p>
              <p><strong>Customer:</strong> {formData.customerName}</p>
              <p><strong>Contact:</strong> {formData.customerEmail} | {formData.customerPhone}</p>
            </div>
            <Button variant="primary" onClick={handleClose} className="mt-3">
              OK
            </Button>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default TableReservation; 