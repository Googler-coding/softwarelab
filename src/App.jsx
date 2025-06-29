import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from "./component/Header";
import Middlepart1 from "./component/middlepart1";
import Middlepart2 from "./component/react_bootstrap/Middlepart2";
import Middlepart3 from "./component/react_bootstrap/Middlepart3";
import Middlepart4 from "./component/Middlepart4";
import Middlepart5 from "./component/Middlepart5";
import Deliverto from "./component/react_bootstrap/Deliverto";
import Footer from "./component/Footer";
import InRestaurantOrder from "./component/react_bootstrap/InRestaurantOrder";
import RiderDashboard from "./component/react_bootstrap/RiderDashboard";
import RestaurantDashboard from "./component/react_bootstrap/RestaurantDashboard";
import AdminDashboard from "./component/react_bootstrap/AdminDashboard";
import UserDashboard from "./component/react_bootstrap/UserDashboard";
import FoodDonation from "./component/react_bootstrap/FoodDonation";
import Subscription from "./component/react_bootstrap/Subscription";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="error-message">
            <h2>Something went wrong</h2>
            <p>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="submit-button">
              Reset and Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const HomePage = () => (
  <>
    <div id="div_middle">
      <div id="div_middle_part1">
        <Middlepart1 />
      </div>
      <div id="div_middle_part2">
        <Middlepart2 />
      </div>
      <div id="div_middle_part3">
        <Middlepart3 />
      </div>
      <div id="div_middle_part4">
        <Middlepart4 />
      </div>
      <div id="div_middle_part5">
        <Middlepart5 />
      </div>
      <div id="div_middle_part6">
        <Deliverto />
      </div>
    </div>
    <div id="div_footer">
      <Footer />
    </div>
  </>
);

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    if (decoded.role !== allowedRole) {
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (err) {
    console.error("Token decode error:", err);
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setError(null);
    navigate("/");
  };

  const handleLoginStateChange = (loggedIn) => {
    setIsLoggedIn(loggedIn);
  };

  // Update login state when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            handleLogout();
          } else {
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.error("Token decode error:", err);
          setError(`Token validation failed: ${err.message}`);
          handleLogout();
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage changes (when user logs in/out in another component)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically
    const interval = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Application Error</h2>
          <p>{error}</p>
          <button onClick={handleLogout} className="submit-button">
            Reset and Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} onLoginStateChange={handleLoginStateChange} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/in-restaurant-order" element={<InRestaurantOrder />} />
        <Route path="/donate" element={<FoodDonation />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route
          path="/restaurant-dashboard"
          element={
            <ProtectedRoute allowedRole="restaurant">
              <RestaurantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider-dashboard"
          element={
            <ProtectedRoute allowedRole="rider">
              <RiderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
