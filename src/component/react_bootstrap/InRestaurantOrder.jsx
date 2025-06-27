import React, { useState, useEffect } from "react";
import "../css/InRestaurantOrder.css";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const restaurantsData = [
  {
    id: 1,
    name: "Pizza Planet",
    lat: 23.8103,
    lon: 90.4125,
    menu: [
      { id: 101, name: "Margherita", price: 8 },
      { id: 102, name: "Pepperoni", price: 10 },
    ],
  },
  {
    id: 2,
    name: "Burger Queen",
    lat: 23.8121,
    lon: 90.4092,
    menu: [
      { id: 201, name: "Cheeseburger", price: 9 },
      { id: 202, name: "Fries", price: 4 },
    ],
  },
  {
    id: 3,
    name: "Sushi World",
    lat: 23.811,
    lon: 90.414,
    menu: [
      { id: 301, name: "Salmon Roll", price: 12 },
      { id: 302, name: "Tuna Sashimi", price: 15 },
    ],
  },
  {
    id: 4,
    name: "Vegan Delight",
    lat: 23.809,
    lon: 90.411,
    menu: [
      { id: 401, name: "Quinoa Salad", price: 7 },
      { id: 402, name: "Veggie Burger", price: 9 },
      { id: 402, name: "Chicken Burger", price: 9 },
      { id: 402, name: "Mutton Burger", price: 9 },
    ],
  },
  {
    id: 5,
    name: "Curry House",
    lat: 23.8135,
    lon: 90.413,
    menu: [
      { id: 501, name: "Chicken Curry", price: 11 },
      { id: 502, name: "Naan Bread", price: 3 },
    ],
  },
];

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
  const [nearestRestaurants, setNearestRestaurants] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);

          const nearest = [...restaurantsData]
            .map((r) => ({
              ...r,
              distance: haversineDistance(coords[0], coords[1], r.lat, r.lon),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
          setNearestRestaurants(nearest);
        },
        () => {
          const fallback = [23.8103, 90.4125];
          setUserLocation(fallback);
          setNearestRestaurants(restaurantsData.slice(0, 3));
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) setSuggestions([]);
    else {
      const filtered = restaurantsData
        .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    }
  }, [query]);

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

  // Increase quantity of an item in cart
  const incrementQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  // Decrease quantity of an item in cart, min 1
  const decrementQty = (id) => {
    setCart(
      (prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item
        )
      // Optionally remove if qty hits 0:
      // .filter(item => item.qty > 0)
    );
  };

  const handleRemoveFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div className="inrestaurant-container">
      <h2>In-Restaurant Order</h2>

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
              <li key={r.id} onClick={() => handleSelect(r)}>
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

            {!selected &&
              nearestRestaurants.map((r) => (
                <Marker key={r.id} position={[r.lat, r.lon]}>
                  <Popup>
                    <strong>{r.name}</strong>
                    <br />
                    {r.distance.toFixed(2)} km away
                  </Popup>
                  <Tooltip direction="top" offset={[0, -10]} permanent>
                    {r.name}
                  </Tooltip>
                </Marker>
              ))}

            {selected && (
              <Marker position={[selected.lat, selected.lon]}>
                <Popup>{selected.name}</Popup>
                <Tooltip permanent direction="top">
                  {selected.name}
                </Tooltip>
              </Marker>
            )}
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
              <div key={item.id} className="menu-item">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
                <button onClick={() => handleAddToCart(item)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>

          <div className="cart">
            <h4>Cart</h4>
            {cart.length === 0 ? (
              <p>No items selected.</p>
            ) : (
              <ul>
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <span>{item.name}</span>
                    <div className="qty-controls">
                      <button onClick={() => decrementQty(item.id)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => incrementQty(item.id)}>+</button>
                    </div>
                    <span>${(item.qty * item.price).toFixed(2)}</span>
                    <button onClick={() => handleRemoveFromCart(item.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <h4 style={{ textAlign: "center" }}>Total: ${total.toFixed(2)}</h4>
            <button
              className="place-order-btn"
              onClick={() => {
                if (total === 0) return alert("Select at least one item.");
                alert(`Order placed! Total: $${total.toFixed(2)}`);
                setCart([]);
              }}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InRestaurantOrder;
