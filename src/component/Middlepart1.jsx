import React, { useState, useEffect} from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import img1 from "../assets/image/mobile.png";
import "../component/css/Middlepart1s.css";

const Middlepart1 = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [, setSelected] = useState(null);

  // Fetch restaurants from Overpass API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const bbox = [23.68, 90.35, 23.9, 90.5];
        const queryStr = `
          [out:json][timeout:25];
          node["amenity"="restaurant"](${bbox.join(",")});
          out center;
        `;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          queryStr
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        const list = (data.elements || [])
          .filter((el) => el.tags?.name)
          .map((el) => ({
            id: el.id,
            name: el.tags.name,
            type: el.tags.cuisine || "Various",
            lat: el.lat,
            lon: el.lon,
          }));
        setRestaurants(list);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (query.length < 2) return setSuggestions([]);
    const filtered = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.type.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
  }, [query, restaurants]);

  const selectHandler = (r) => {
    setSelected(r);
    setQuery(r.name);
    setSuggestions([]);
  };

  return (
    <div className="mp1-container">
      <div className="mp1-content">
        <div className="text-block">
          <h1>Fast, Fresh</h1>
          <h1>& Right To Your Door</h1>
          <p>Order dishes from favorite restaurants near you.</p>

          <div className="input-container">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={() => setQuery("")}
              placeholder="Enter restaurant or cuisine..."
            />
            <button
              onClick={() =>
                navigator.geolocation.getCurrentPosition(() => {})
              }>
              Locate me
            </button>
            <button onClick={() => selectHandler(restaurants[0])}>
              Search
            </button>

            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map((r) => (
                  <li key={r.id} onClick={() => selectHandler(r)}>
                    {r.name} ({r.type})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="img-block">
          <img src={img1} alt="mobile app" />
        </div>
      </div>
    </div>
  );
};

export default Middlepart1;
