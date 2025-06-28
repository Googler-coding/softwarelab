import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/InRestaurantOrder.css";

const redIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-red.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch restaurants from database
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_URL}/api/restaurants`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch restaurants");
        setRestaurants(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRestaurants();

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
        },
        () => {
          const fallback = [23.8103, 90.4125];
          setUserLocation(fallback);
        }
      );
    }
  }, [token]);

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
        .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
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
      const exists = prev.find((i) => i.id === item.id);
      return exists
        ? prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...item, qty: 1 }];
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
      const order = {
        restaurantId: selected._id,
        customerName: "Customer", // Replace with actual user data if available
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.qty,
        })),
        total,
        status: "pending",
        userId: selected.userId,
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

      alert(`Order placed! Total: $${total.toFixed(2)}`);
      setCart([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

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

      <div className="map-section" style={{ height: "400px", width: "100%" }}>
        {userLocation && (
          <MapContainer
            center={userLocation}
            zoom={15}
            style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLocation} icon={redIcon}>
              <Popup>You are here</Popup>
              <Tooltip permanent direction="top">
                Me
              </Tooltip>
            </Marker>

            {restaurants.map((r) => (
              <Marker key={r._id} position={[r.lat, r.lon]}>
                <Popup>
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
                </Popup>
                <Tooltip direction="top" offset={[0, -10]} permanent>
                  {r.name}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        )}
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
            {selected.menu.map((item) => (
              <div key={item._id} className="menu-item">
                <span data-price={`$${item.price.toFixed(2)}`}>
                  {item.name}
                </span>
                <button onClick={() => handleAddToCart(item)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>

          <div className="cart">
            <h4>Cart</h4>
            {cart.length === 0 ? (
              <p className="no-items">No items selected.</p>
            ) : (
              <ul>
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <span data-price={`$${(item.qty * item.price).toFixed(2)}`}>
                      {item.name}
                    </span>
                    <div className="qty-controls">
                      <button onClick={() => decrementQty(item.id)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => incrementQty(item.id)}>+</button>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <h4 style={{ textAlign: "center" }}>Total: ${total.toFixed(2)}</h4>
            <button className="place-order-btn" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InRestaurantOrder;
