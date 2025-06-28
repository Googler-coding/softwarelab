import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/InRestaurantOrder.css";

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

const InRestaurantOrder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [nearestRestaurants, setNearestRestaurants] = useState([]);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check if user is logged in
    if (token) {
      console.log("Token found:", token.substring(0, 20) + "...");
      setIsLoggedIn(true);
      fetchRestaurants();
    } else {
      console.log("No token found, user not logged in");
      setError("Please log in to view restaurants");
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          console.log("User location obtained:", coords);
          setUserLocation(coords);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Fallback to Dhaka coordinates
          const fallback = [23.8103, 90.4125];
          console.log("Using fallback location:", fallback);
          setUserLocation(fallback);
        }
      );
    } else {
      console.log("Geolocation not supported, using fallback");
      const fallback = [23.8103, 90.4125];
      setUserLocation(fallback);
    }
  }, [token]);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch restaurants");
      
      console.log("Fetched restaurants:", data);
      console.log("Number of restaurants:", data.length);
      
      // Filter out restaurants with empty names
      const validRestaurants = data.filter(r => r.name && r.name.trim() !== "");
      console.log("Valid restaurants with names:", validRestaurants.length);
      
      setRestaurants(validRestaurants);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (userLocation && restaurants.length > 0) {
      const nearest = [...restaurants]
        .map((r) => ({
          ...r,
          distance: haversineDistance(
            userLocation[0],
            userLocation[1],
            r.lat,
            r.lon
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      setNearestRestaurants(nearest);
    }
  }, [userLocation, restaurants]);

  useEffect(() => {
    if (!query.trim()) setSuggestions([]);
    else {
      const filtered = restaurants
        .filter((r) => ((r.name || "").toLowerCase().includes(query.toLowerCase())))
        .slice(0, 5);
      setSuggestions(filtered);
    }
  }, [query, restaurants]);

  const handleSelect = (restaurant) => {
    setSelected(restaurant);
    setQuery(restaurant.name);
    setSuggestions([]);
    setCart([]);
  };

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item._id);
      return exists
        ? prev.map((i) => (i.id === item._id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...item, id: item._id, qty: 1 }];
    });
  };

  const incrementQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decrementQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item
      )
    );
  };

  const handleRemoveFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  const handlePlaceOrder = async () => {
    if (total === 0) return alert("Select at least one item.");
    try {
      // Get user details from localStorage or use default
      const userName = localStorage.getItem("userName") || "Customer";
      const userEmail = localStorage.getItem("userEmail") || "customer@example.com";
      const userPhone = localStorage.getItem("userPhone") || "Phone not provided";
      
      const order = {
        restaurantId: selected._id,
        customerName: userName,
        customerEmail: userEmail,
        customerPhone: userPhone,
        customerAddress: "Delivery Address", // This could be enhanced with real address input
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.qty,
        })),
        total,
        status: "pending",
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to place order");

      alert(`Order placed successfully! Order ID: #${data.order.orderId.slice(-6)}\nTotal: $${total.toFixed(2)}\nEstimated delivery: 30 minutes`);
      setCart([]);
      setSelected(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  if (!isLoggedIn) {
    return (
      <div className="inrestaurant-container">
        <h2>In-Restaurant Order</h2>
        <div className="error-message">
          Please log in to view and order from restaurants.
        </div>
      </div>
    );
  }

  return (
    <div className="inrestaurant-container">
      <h2>In-Restaurant Order</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="floating-search-wrapper">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={() => {
            setSelected(null);
            setCart([]);
          }}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            suggestions.length > 0 &&
            handleSelect(suggestions[0])
          }
          className="floating-search-input"
        />
        <button
          className="search-icon-btn"
          onClick={() =>
            suggestions.length > 0 && handleSelect(suggestions[0])
          }>
          🔍
        </button>
        {suggestions.length > 0 && (
          <ul className="suggestions-floating">
            {suggestions.map((r) => (
              <li key={r._id} onClick={() => handleSelect(r)}>
                {r.name}
              </li>
            ))}
          </ul>
        )}
      </div>

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
          {(() => {
            try {
              if (typeof L === 'undefined') {
                return (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div>Leaflet not loaded - Check console for errors</div>
                    <div style={{ marginTop: '20px', fontSize: '14px' }}>
                      <strong>Restaurant Locations (Text View):</strong><br/>
                      {restaurants.map(r => (
                        <div key={r._id} style={{ margin: '5px 0' }}>
                          {r.name}: {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              return (
                <MapContainer
                  center={userLocation || [23.8103, 90.4125]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {userLocation && (
                    <Marker position={userLocation} icon={defaultIcon}>
                      <Popup>You are here</Popup>
                      <Tooltip permanent direction="top">
                        Me
                      </Tooltip>
                    </Marker>
                  )}

                  {restaurants.map((r) => {
                    return (
                      <Marker 
                        key={r._id} 
                        position={[r.lat, r.lon]} 
                        icon={restaurantIcon}
                        eventHandlers={{
                          click: () => {
                            console.log("Restaurant marker clicked:", r.name);
                            handleSelect(r);
                          }
                        }}
                      >
                        <Popup>
                          <div>
                            <strong>{r.name}</strong>
                            <br />
                            {userLocation
                              ? haversineDistance(
                                  userLocation[0],
                                  userLocation[1],
                                  r.lat,
                                  r.lon
                                ).toFixed(2)
                              : "N/A"}{" "}
                            km away
                            <br />
                            <button 
                              onClick={() => handleSelect(r)}
                              style={{
                                marginTop: '10px',
                                padding: '5px 10px',
                                backgroundColor: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              View Menu
                            </button>
                          </div>
                        </Popup>
                        <Tooltip direction="top" offset={[0, -10]} permanent>
                          {r.name}
                        </Tooltip>
                      </Marker>
                    );
                  })}
                </MapContainer>
              );
            } catch (error) {
              console.error("Error rendering map:", error);
              return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div>Map Error: {error.message}</div>
                  <div style={{ marginTop: '20px', fontSize: '14px' }}>
                    <strong>Restaurant Locations (Text View):</strong><br/>
                    {restaurants.map(r => (
                      <div key={r._id} style={{ margin: '5px 0' }}>
                        {r.name}: {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {selected && (
        <div className="order-section">
          <h3>{selected.name}</h3>
          <p>
            Distance:{" "}
            {userLocation
              ? haversineDistance(
                  userLocation[0],
                  userLocation[1],
                  selected.lat,
                  selected.lon
                ).toFixed(2)
              : "N/A"}{" "}
            km
          </p>

          <h4>Menu</h4>
          <div className="menu-list">
            {selected.menu && selected.menu.length > 0 ? (
              selected.menu.map((item) => (
                <div key={item._id} className="menu-item">
                  <span data-price={`$${item.price.toFixed(2)}`}>
                    {item.name}
                  </span>
                  <button onClick={() => handleAddToCart(item)}>
                    Add to Cart
                  </button>
                </div>
              ))
            ) : (
              <div className="no-items">No menu items available</div>
            )}
          </div>

          <div className="cart">
            <h4>Cart</h4>
            {cart.length === 0 ? (
              <div className="no-items">No items selected.</div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-content">
                      <span data-price={`$${(item.qty * item.price).toFixed(2)}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-controls">
                        <button onClick={() => decrementQty(item.id)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => incrementQty(item.id)}>+</button>
                      </div>
                      <button onClick={() => handleRemoveFromCart(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="cart-total">
                  <h4>Total: ${total.toFixed(2)}</h4>
                </div>
                <button 
                  className="place-order-btn" 
                  onClick={handlePlaceOrder}
                  disabled={total === 0}>
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InRestaurantOrder;
