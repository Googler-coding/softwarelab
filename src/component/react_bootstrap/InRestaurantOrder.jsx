import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { Card, Form, Button, Alert, Spinner, Badge, Modal, Tabs, Tab } from "react-bootstrap";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/InRestaurantOrder.css";
import OrderTracking from "./OrderTracking";
import TableReservation from "./TableReservation";

// Use default icon to avoid loading issues
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Restaurant icon
const restaurantIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map component that handles map updates
function MapUpdater({ userLocation, restaurants, onRestaurantSelect }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && userLocation.length === 2) {
      map.setView(userLocation, 13);
      console.log("Map centered to user location:", userLocation);
    }
  }, [userLocation, map]);

  useEffect(() => {
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    restaurants.forEach((restaurant) => {
      if (restaurant.lat && restaurant.lon) {
        const marker = L.marker([restaurant.lat, restaurant.lon], { icon: restaurantIcon })
          .addTo(map)
          .bindPopup(
            `<div style="text-align: center;">
              <h6 style="margin: 0 0 8px 0; color: #2c3e50;">${restaurant.name || restaurant.restaurantName}</h6>
              <p style="margin: 0 0 8px 0; color: #7f8c8d;">Click to view menu</p>
              <button onclick="window.selectRestaurant('${restaurant._id}')" 
                      style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                View Menu
              </button>
            </div>`
          );
        
        marker.on('click', () => {
          onRestaurantSelect(restaurant);
        });
      }
    });
  }, [restaurants, map, onRestaurantSelect]);

  return null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function InRestaurantOrder() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderType, setOrderType] = useState("delivery");
  const [showTableReservation, setShowTableReservation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Add global function for marker click
  useEffect(() => {
    window.selectRestaurant = (restaurantId) => {
      const restaurant = restaurants.find(r => r._id === restaurantId);
      if (restaurant) {
        handleSelect(restaurant);
      }
    };

    return () => {
      delete window.selectRestaurant;
    };
  }, [restaurants]);

  useEffect(() => {
    getCurrentLocation();
    fetchRestaurants();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          console.log("User location updated:", newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Dhaka coordinates
          const defaultLocation = [23.8103, 90.4125];
          setUserLocation(defaultLocation);
          console.log("Using default location:", defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      // Default to Dhaka coordinates
      const defaultLocation = [23.8103, 90.4125];
      setUserLocation(defaultLocation);
      console.log("Geolocation not supported, using default location:", defaultLocation);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/public/restaurants`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch restaurants");
      setRestaurants(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSelect = useCallback(async (restaurant) => {
    setSelected(restaurant);
    setCart([]); // Clear cart when selecting new restaurant
    
    // Fetch menu items for the selected restaurant
    if (restaurant._id) {
      try {
        const res = await fetch(`${API_URL}/api/restaurants/${restaurant._id}/menu`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const menuData = await res.json();
        if (res.ok) {
          setSelected(prev => ({ ...prev, menu: menuData }));
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err);
      }
    }
  }, [token, API_URL]);

  const handleAddToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem._id === item._id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter((item) => item._id !== itemId));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
    } else {
      setCart(
        cart.map((item) =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Please add items to cart first");
      return;
    }

    if (!token) {
      alert("Please sign in to place an order");
      return;
    }

    try {
      const orderData = {
        restaurantId: selected._id,
        restaurantName: selected.name,
        customerName: localStorage.getItem('userName') || 'User',
        customerEmail: localStorage.getItem('userEmail') || 'user@example.com',
        customerPhone: localStorage.getItem('userPhone') || '1234567890',
        customerAddress: userLocation ? `${userLocation[0]}, ${userLocation[1]}` : "User address to be updated",
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
        })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        orderType,
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        paymentMethod: "cash",
        specialInstructions: "",
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to place order");

      alert("Order placed successfully! You can track it in 'My Orders'.");
      setCart([]);
      setSelected(null);
    } catch (err) {
      alert(`Error placing order: ${err.message}`);
    }
  };

  const handleTableReservation = () => {
    setShowTableReservation(true);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query.toLowerCase()))
    );

    setSuggestions(filtered.slice(0, 5));
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (restaurant) => {
    setSearchQuery(restaurant.name);
    setShowSuggestions(false);
    handleSelect(restaurant);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    }
  };

  if (loading) {
    return (
      <div className="inrestaurant-container">
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inrestaurant-container">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="inrestaurant-container">
      <div className="header-section">
        <h2>🍽️ Find & Order from Restaurants</h2>
        <p>Discover restaurants near you and place orders instantly</p>
      </div>

      {/* Enhanced Search Section */}
      <div className="search-section">
        <div className="floating-search-wrapper">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search restaurants or cuisines..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
                onFocus={() => setShowSuggestions(true)}
              />
              <button type="submit" className="search-icon-btn">
                🔍
              </button>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions-floating">
                {suggestions.map((restaurant) => (
                  <li
                    key={restaurant._id}
                    onClick={() => handleSuggestionClick(restaurant)}
                  >
                    <div className="suggestion-item">
                      <span className="restaurant-name">{restaurant.name}</span>
                      {restaurant.cuisine && (
                        <span className="cuisine-type">{restaurant.cuisine}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      </div>

      <div className="content-section">
        <div className="map-section">
          <div style={{ 
            height: '500px', 
            width: '100%', 
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {userLocation ? (
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                key={userLocation.join(',')} // Force re-render when location changes
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapUpdater 
                  userLocation={userLocation}
                  restaurants={restaurants}
                  onRestaurantSelect={handleSelect}
                />
              </MapContainer>
            ) : (
              "Loading map..."
            )}
          </div>
        </div>

        {selected && (
          <div className="order-section">
            <div className="restaurant-info">
              <h3>{selected.name}</h3>
              <p>📍 {selected.address || "Address not available"}</p>
              {userLocation && (
                <p>
                  📏 {haversineDistance(
                    userLocation[0],
                    userLocation[1],
                    selected.lat,
                    selected.lon
                  ).toFixed(1)} km away
                </p>
              )}
            </div>

            {/* Order Type Selection */}
            <div className="order-type-section">
              <h4>Select Order Type</h4>
              <div className="order-type-buttons">
                <Button
                  variant={orderType === "delivery" ? "primary" : "outline-primary"}
                  onClick={() => setOrderType("delivery")}
                  className="order-type-btn"
                >
                  🚚 Delivery
                </Button>
                <Button
                  variant={orderType === "takeaway" ? "primary" : "outline-primary"}
                  onClick={() => setOrderType("takeaway")}
                  className="order-type-btn"
                >
                  📦 Takeaway
                </Button>
                <Button
                  variant={orderType === "dine-in" ? "primary" : "outline-primary"}
                  onClick={() => setOrderType("dine-in")}
                  className="order-type-btn"
                >
                  🍽️ Dine-in
                </Button>
              </div>
            </div>

            {/* Table Reservation for Dine-in */}
            {orderType === "dine-in" && (
              <div className="table-reservation-section">
                <Alert variant="info">
                  <Alert.Heading>🍽️ Table Reservation</Alert.Heading>
                  <p>
                    For dine-in orders, you can reserve a table in advance to ensure availability.
                  </p>
                  <Button 
                    variant="outline-primary" 
                    onClick={handleTableReservation}
                    className="reserve-table-btn"
                  >
                    Reserve Table
                  </Button>
                </Alert>
              </div>
            )}

            {/* Menu Items */}
            <div className="menu-section">
              <h4>Menu</h4>
              <div className="menu-list">
                {selected.menu && selected.menu.length > 0 ? (
                  selected.menu.map((item) => (
                    <div key={item._id} className="menu-item">
                      <div className="menu-item-content">
                        <div className="menu-item-info">
                          <h5 className="menu-item-name">{item.name}</h5>
                          <p className="menu-item-price">৳{item.price}</p>
                        </div>
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(item)}
                        >
                          <span className="btn-icon">+</span>
                          <span className="btn-text">Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-menu-message">
                    <p>🍽️ No menu items available</p>
                    <p>Please check back later or contact the restaurant.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Section */}
            {cart.length > 0 && (
              <div className="cart-section">
                <h4>🛒 Your Cart</h4>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-content">
                        <div className="cart-item-info">
                          <h6 className="cart-item-name">{item.name}</h6>
                          <p className="cart-item-price">৳{item.price}</p>
                        </div>
                        <div className="cart-item-controls">
                          <div className="qty-controls">
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                              className="qty-btn"
                            >
                              -
                            </button>
                            <span className="qty-display">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              className="qty-btn"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item._id)}
                            className="remove-btn"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <h5>
                    Total: ৳{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                  </h5>
                  <Button
                    onClick={handlePlaceOrder}
                    className="place-order-btn"
                    variant="success"
                    size="lg"
                  >
                    🚀 Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Reservation Modal */}
      <Modal
        show={showTableReservation}
        onHide={() => setShowTableReservation(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>🍽️ Table Reservation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TableReservation
            restaurantId={selected?._id}
            onReservationComplete={() => setShowTableReservation(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default InRestaurantOrder;
