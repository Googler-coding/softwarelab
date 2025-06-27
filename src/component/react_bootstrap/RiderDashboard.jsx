import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const RiderDashboard = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const riderId = localStorage.getItem("id");

  useEffect(() => {
    if (!token || role !== "rider") {
      setError("Unauthorized access. Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    }
  }, [token, role, navigate]);

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Welcome to Rider Dashboard</h1>
      <p style={styles.info}>
        Logged in as Rider ID: <strong>{riderId}</strong>
      </p>

      <div style={styles.mapBox}>
        <h2>Delivery Map (Sample)</h2>
        <MapContainer
          center={[23.8103, 90.4125]} // Dhaka default
          zoom={13}
          style={{ height: "400px", width: "100%", borderRadius: "10px" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={[23.8103, 90.4125]}>
            <Popup>This is your delivery area.</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div style={styles.box}>
        <p>This is a placeholder dashboard to test login and map display.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  header: {
    fontSize: "28px",
    marginBottom: "10px",
    color: "#333",
  },
  info: {
    fontSize: "18px",
    marginBottom: "20px",
  },
  box: {
    padding: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    display: "inline-block",
    marginTop: "20px",
  },
  mapBox: {
    margin: "20px auto",
    maxWidth: "600px",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: "40px",
  },
};

export default RiderDashboard;
