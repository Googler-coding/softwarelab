import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Headers.css";
import "./css/AuthForm.css";
import logo from "../assets/image/logo.png";

const Header = ({ isLoggedIn, onLogout, onLoginStateChange }) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [signInRole, setSignInRole] = useState("");
  const [signUpRole, setSignUpRole] = useState("");
  const [serverStatus, setServerStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Get current user role
  const currentRole = localStorage.getItem("role");

  useEffect(() => {
    const handleClickOutside = (e) => {
      const signInPopup = document.getElementById("signin-popup");
      const signUpPopup = document.getElementById("signup-popup");
      if (signInPopup && !signInPopup.contains(e.target) && showSignIn) {
        setShowSignIn(false);
        setSignInRole("");
        setError(null);
      }
      if (signUpPopup && !signUpPopup.contains(e.target) && showSignUp) {
        setShowSignUp(false);
        setSignUpRole("");
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSignIn, showSignUp]);

  useEffect(() => {
    const checkServer = async () => {
      try {
        console.log("Checking server status:", {
          url: `${API_URL}/api/health`,
        });
        const res = await fetch(`${API_URL}/api/health`);
        const text = await res.text();
        console.log("Server health response:", { status: res.status, text });
        setServerStatus(res.ok ? "online" : "offline");
      } catch (err) {
        console.error("Server health check failed:", {
          message: err.message,
          url: `${API_URL}/api/health`,
        });
        setServerStatus("offline");
      }
    };
    checkServer();
  }, [API_URL]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle navigation based on user role and current location
  const handleNavigation = (path) => {
    if (!isLoggedIn) {
      navigate(path);
      return;
    }

    // If user is on a dashboard, show confirmation before navigating
    const isOnDashboard = location.pathname.includes('-dashboard');
    if (isOnDashboard) {
      const confirmed = window.confirm(
        "You are currently on your dashboard. Are you sure you want to navigate away? You can always return to your dashboard by signing in again."
      );
      if (!confirmed) {
        return;
      }
    }

    // Navigate to the requested path
    navigate(path);
  };

  // Handle logout with confirmation if on dashboard
  const handleLogoutClick = () => {
    const isOnDashboard = location.pathname.includes('-dashboard');
    if (isOnDashboard) {
      const confirmed = window.confirm(
        "Are you sure you want to sign out? You will be redirected to the home page."
      );
      if (!confirmed) {
        return;
      }
    }
    onLogout();
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (serverStatus === "offline") {
      setError("Cannot connect to server. Please check if the backend is running.");
      setLoading(false);
      return;
    }
    
    try {
      const form = e.target;
      const email = form.elements[0].value;
      const password = form.elements[1].value;
      if (!validateEmail(email)) throw new Error("Invalid email format");

      const data = { email, password };
      const url = `${API_URL}/api/auth/signin/${signInRole}`;
      console.log("Sending sign-in request:", { url, data });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).catch((err) => {
        console.error("Fetch error:", {
          message: err.message,
          url,
          cause: err.cause,
        });
        throw new Error(
          `Failed to connect to server at ${url}: ${err.message}`
        );
      });

      console.log("Sign-in response:", {
        status: res.status,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
      });

      const text = await res.text();
      console.log("Raw response text:", text);

      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("JSON parse error:", { error: err.message, text });
        throw new Error(
          `Invalid response from server: ${text || "Empty response"}`
        );
      }

      if (!res.ok) {
        throw new Error(
          result.error || `Sign-in failed (Status: ${res.status})`
        );
      }

      console.log("Storing in localStorage:", {
        token: result.token,
        role: result.role,
        id: result.id,
      });
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.role);
      localStorage.setItem("id", result.id);
      
      // Store user details for order tracking
      if (result.user) {
        localStorage.setItem("userName", result.user.name);
        localStorage.setItem("userEmail", result.user.email);
        localStorage.setItem("userPhone", result.user.phone);
      }

      setShowSignIn(false);
      setSignInRole("");
      setError(null);

      console.log("Navigating after sign-in:", { role: result.role });
      if (result.role === "user") {
        console.log("Navigating to / for user");
        navigate("/");
      } else if (result.role === "rider") {
        console.log("Navigating to /rider-dashboard for rider");
        navigate("/rider-dashboard");
      } else if (result.role === "restaurant") {
        console.log("Navigating to /restaurant-dashboard for restaurant");
        navigate("/restaurant-dashboard", { replace: true });
      } else if (result.role === "admin") {
        console.log("Navigating to /admin-dashboard for admin");
        navigate("/admin-dashboard");
      } else {
        console.error("Unknown role:", result.role);
        throw new Error("Unknown role");
      }

      // Notify parent component about login state change
      if (onLoginStateChange) {
        onLoginStateChange(true);
      }
    } catch (error) {
      console.error("Sign-in error:", {
        message: error.message,
        stack: error.stack,
      });
      setError(`Sign-in error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (serverStatus === "offline") {
      setError("Cannot connect to server. Please check if the backend is running.");
      setLoading(false);
      return;
    }
    
    try {
      let data;
      const form = e.target;

      if (signUpRole === "user") {
        const email = form.elements[1].value;
        if (!validateEmail(email)) throw new Error("Invalid email format");
        data = {
          name: form.elements[0].value,
          email,
          phone: form.elements[2].value,
          password: form.elements[3].value,
        };
      } else if (signUpRole === "rider") {
        data = {
          name: form.elements[0].value,
          email: form.elements[1].value,
          nid: form.elements[2].value,
          password: form.elements[3].value,
        };
      } else if (signUpRole === "restaurant") {
        data = {
          restaurantName: form.elements[0].value,
          ownerName: form.elements[1].value,
          email: form.elements[2].value,
          password: form.elements[3].value,
        };
      }

      const url = `${API_URL}/api/auth/signup/${signUpRole}`;
      console.log("Sending sign-up request:", { url, data });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).catch((err) => {
        console.error("Fetch error:", {
          message: err.message,
          url,
          cause: err.cause,
        });
        throw new Error(
          `Failed to connect to server at ${url}: ${err.message}`
        );
      });

      console.log("Sign-up response:", {
        status: res.status,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
      });

      const text = await res.text();
      console.log("Raw response text:", text);

      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("JSON parse error:", { error: err.message, text });
        throw new Error(
          `Invalid response from server: ${text || "Empty response"}`
        );
      }

      if (!res.ok) {
        throw new Error(
          result.error || `Registration failed (Status: ${res.status})`
        );
      }

      setShowSignUp(false);
      setSignUpRole("");
      setError(null);
      
      // Show success message and switch to sign in
      setShowSignIn(true);
      setSignInRole(signUpRole);

      onLoginStateChange(true);
    } catch (error) {
      console.error("Sign-up error:", {
        message: error.message,
        stack: error.stack,
      });
      setError(`Sign-up error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSignInForm = () => {
    if (!signInRole) {
      return (
        <>
          <h3>Sign In as</h3>
          <div className="role-grid">
            <div className="role-option" onClick={() => setSignInRole("user")}>
              <span className="role-icon">👤</span>
              <div className="role-label">User</div>
            </div>
            <div className="role-option" onClick={() => setSignInRole("rider")}>
              <span className="role-icon">🛵</span>
              <div className="role-label">Rider</div>
            </div>
            <div className="role-option" onClick={() => setSignInRole("restaurant")}>
              <span className="role-icon">🍽️</span>
              <div className="role-label">Restaurant</div>
            </div>
            <div className="role-option" onClick={() => setSignInRole("admin")}>
              <span className="role-icon">🔐</span>
              <div className="role-label">Admin</div>
            </div>
          </div>
          <p className="switch-auth">
            Don't have an account?{" "}
            <span
              onClick={() => {
                setShowSignIn(false);
                setShowSignUp(true);
                setError(null);
              }}>
              Sign Up
            </span>
          </p>
        </>
      );
    }

    const formTemplate = (roleLabel) => (
      <form className="form" onSubmit={handleSignInSubmit}>
        <h2>{roleLabel} Sign In</h2>
        {error && <div className="error-message">{error}</div>}
        <input type="email" placeholder="Email" required />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={signInRole === "admin" ? 5 : 6}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
        <p className="switch-auth">
          Don't have an account?{" "}
          <span
            onClick={() => {
              setShowSignIn(false);
              setShowSignUp(true);
              setSignUpRole(signInRole);
              setError(null);
            }}>
            Sign Up
          </span>
        </p>
      </form>
    );
    
    switch (signInRole) {
      case "user":
        return formTemplate("User");
      case "rider":
        return formTemplate("Rider");
      case "restaurant":
        return formTemplate("Restaurant");
      case "admin":
        return formTemplate("Admin");
      default:
        return null;
    }
  };

  const renderSignUpForm = () => {
    if (!signUpRole) {
      return (
        <>
          <h3>Sign Up as</h3>
          <div className="role-grid">
            <div className="role-option" onClick={() => setSignUpRole("user")}>
              <span className="role-icon">👤</span>
              <div className="role-label">User</div>
            </div>
            <div className="role-option" onClick={() => setSignUpRole("rider")}>
              <span className="role-icon">🛵</span>
              <div className="role-label">Rider</div>
            </div>
            <div className="role-option" onClick={() => setSignUpRole("restaurant")}>
              <span className="role-icon">🍽️</span>
              <div className="role-label">Restaurant</div>
            </div>
          </div>
          <p className="switch-auth">
            Already have an account?{" "}
            <span
              onClick={() => {
                setShowSignIn(true);
                setShowSignUp(false);
                setError(null);
              }}>
              Sign In
            </span>
          </p>
        </>
      );
    }

    switch (signUpRole) {
      case "user":
        return (
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h2>User Sign Up</h2>
            {error && <div className="error-message">{error}</div>}
            <input type="text" placeholder="Name" required minLength="2" />
            <input type="email" placeholder="Email" required />
            <input
              type="tel"
              placeholder="Phone Number"
              required
              pattern="[0-9]{10,}"
            />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <p className="switch-auth">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setShowSignIn(true);
                  setShowSignUp(false);
                  setSignInRole("user");
                  setError(null);
                }}>
                Sign In
              </span>
            </p>
          </form>
        );
      case "rider":
        return (
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h2>Rider Sign Up</h2>
            {error && <div className="error-message">{error}</div>}
            <input type="text" placeholder="Name" required minLength="2" />
            <input type="email" placeholder="Email" required />
            <input type="text" placeholder="NID" required minLength="8" />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <p className="switch-auth">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setShowSignIn(true);
                  setShowSignUp(false);
                  setSignInRole("rider");
                  setError(null);
                }}>
                Sign In
              </span>
            </p>
          </form>
        );
      case "restaurant":
        return (
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h2>Restaurant Sign Up</h2>
            {error && <div className="error-message">{error}</div>}
            <input
              type="text"
              placeholder="Restaurant Name"
              required
              minLength="2"
            />
            <input
              type="text"
              placeholder="Owner Name"
              required
              minLength="2"
            />
            <input type="email" placeholder="Email" required />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <p className="switch-auth">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setShowSignIn(true);
                  setShowSignUp(false);
                  setSignInRole("restaurant");
                  setError(null);
                }}>
                Sign In
              </span>
            </p>
          </form>
        );
      default:
        return null;
    }
  };

  // Render dashboard-specific navbar when logged in
  const renderDashboardNavbar = () => (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="logo" className="logo" />
      </div>
      <div className="navbar-center">
        <span className="dashboard-title">
          {currentRole === "admin" && "Admin Dashboard"}
          {currentRole === "restaurant" && "Restaurant Dashboard"}
          {currentRole === "rider" && "Rider Dashboard"}
          {currentRole === "user" && "User Dashboard"}
        </span>
      </div>
      <div className="navbar-right">
        <button onClick={() => handleNavigation("/")} className="auth-button">
          Go to Home
        </button>
        <button onClick={handleLogoutClick} className="auth-button">
          Sign Out
        </button>
        {serverStatus === "offline" && (
          <span className="server-status text-red-600">Server Offline</span>
        )}
      </div>
    </nav>
  );

  // Render regular navbar when not logged in
  const renderRegularNavbar = () => (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="logo" className="logo" />
      </div>
      <div className="navbar-center">
        <Link to="/">Meal Order System</Link>
        <Link to="/subscription">Subscription Model</Link>
        <Link to="/customize">Meal Customize</Link>
        <Link to="/in-restaurant-order">In-Restaurant Order</Link>
        <Link to="/donate">Food Donation</Link>
        {isLoggedIn && currentRole === "user" && (
          <Link to="/user-order-tracking">My Orders</Link>
        )}
      </div>
      <div className="navbar-right">
        {isLoggedIn ? (
          <button onClick={handleLogoutClick} className="auth-button">
            Sign Out
          </button>
        ) : (
          <button onClick={() => setShowSignIn(true)} className="auth-button">
            Sign In
          </button>
        )}
        {serverStatus === "offline" && (
          <span className="server-status text-red-600">Server Offline</span>
        )}
      </div>
    </nav>
  );

  return (
    <>
      {isLoggedIn && location.pathname.includes('-dashboard') 
        ? renderDashboardNavbar() 
        : renderRegularNavbar()
      }
      
      {showSignIn && (
        <div className="popup-overlay">
          <div className="popup" id="signin-popup">
            <button
              className="popup-close"
              onClick={() => {
                setShowSignIn(false);
                setSignInRole("");
                setError(null);
              }}>
              ×
            </button>
            {renderSignInForm()}
          </div>
        </div>
      )}
      
      {showSignUp && (
        <div className="popup-overlay">
          <div className="popup" id="signup-popup">
            <button
              className="popup-close"
              onClick={() => {
                setShowSignUp(false);
                setSignUpRole("");
                setError(null);
              }}>
              ×
            </button>
            {renderSignUpForm()}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
