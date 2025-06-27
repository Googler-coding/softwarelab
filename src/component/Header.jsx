import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Headers.css";
import logo from "../assets/image/logo.png";

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [signInRole, setSignInRole] = useState("");
  const [signUpRole, setSignUpRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      const signInPopup = document.getElementById("signin-popup");
      const signUpPopup = document.getElementById("signup-popup");
      if (signInPopup && !signInPopup.contains(e.target) && showSignIn) {
        setShowSignIn(false);
        setSignInRole("");
      }
      if (signUpPopup && !signUpPopup.contains(e.target) && showSignUp) {
        setShowSignUp(false);
        setSignUpRole("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSignIn, showSignUp]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = e.target;
      const email = form.elements[0].value;
      const password = form.elements[1].value;
      if (!validateEmail(email)) throw new Error("Invalid email format");

      const data = { email, password };

      console.log(
        "Sign-in URL:",
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signin/${signInRole}`
      );
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signin/${signInRole}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      ).catch((err) => {
        console.error("Fetch error:", err);
        throw new Error("Network request failed");
      });

      console.log("Response status:", res.status, "OK:", res.ok);
      const text = await res.text();
      console.log("Raw response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse error:", err, "Raw text:", text);
        throw new Error("Invalid response from server");
      }

      if (!res.ok)
        throw new Error(
          result.error || `Sign In failed (Status: ${res.status})`
        );

      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.role);
      localStorage.setItem("id", result.id);

      alert(result.message);

      // Redirect based on role
      if (result.role === "user") {
        navigate("/");
      } else if (result.role === "rider") {
        navigate("/rider-dashboard");
      } else if (result.role === "restaurant") {
        navigate("/restaurant-dashboard");
      } else if (result.role === "admin") {
        navigate("/admin-dashboard");
      }

      setShowSignIn(false);
      setSignInRole("");
    } catch (error) {
      console.error("Sign-in error:", error);
      alert(error.message);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
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

      console.log(
        "Sign-up URL:",
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup/${signUpRole}`
      );
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup/${signUpRole}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      ).catch((err) => {
        console.error("Fetch error:", err);
        throw new Error("Network request failed");
      });

      console.log("Response status:", res.status, "OK:", res.ok);
      const text = await res.text();
      console.log("Raw response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse error:", err, "Raw text:", text);
        throw new Error("Invalid response from server");
      }

      if (!res.ok)
        throw new Error(
          result.error || `Registration failed (Status: ${res.status})`
        );

      alert(result.message);
      setShowSignUp(false);
      setSignUpRole("");
    } catch (error) {
      console.error("Sign-up error:", error);
      alert(error.message);
    }
  };

  const renderSignInForm = () => {
    switch (signInRole) {
      case "user":
        return (
          <form className="form" onSubmit={handleSignInSubmit}>
            <h2>User Sign In</h2>
            <input type="email" placeholder="Email" required />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit">Sign In</button>
          </form>
        );
      case "rider":
        return (
          <form className="form" onSubmit={handleSignInSubmit}>
            <h2>Rider Sign In</h2>
            <input type="email" placeholder="Email" required />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit">Sign In</button>
          </form>
        );
      case "restaurant":
        return (
          <form className="form" onSubmit={handleSignInSubmit}>
            <h2>Restaurant Sign In</h2>
            <input type="email" placeholder="Email" required />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit">Sign In</button>
          </form>
        );
      case "admin":
        return (
          <form className="form" onSubmit={handleSignInSubmit}>
            <h2>Admin Sign In</h2>
            <input type="email" placeholder="Email" required />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="5"
            />
            <button type="submit">Sign In</button>
          </form>
        );
      default:
        return (
          <>
            <h3>Sign In as</h3>
            <button
              className="popup-link"
              onClick={() => setSignInRole("user")}>
              👤 User
            </button>
            <button
              className="popup-link"
              onClick={() => setSignInRole("rider")}>
              🛵 Rider
            </button>
            <button
              className="popup-link"
              onClick={() => setSignInRole("restaurant")}>
              🍽️ Restaurant
            </button>
            <button
              className="popup-link"
              onClick={() => setSignInRole("admin")}>
              🔐 Admin
            </button>
            <p className="switch-auth">
              Don’t have an account?{" "}
              <span
                onClick={() => {
                  setShowSignIn(false);
                  setShowSignUp(true);
                }}>
                Sign Up
              </span>
            </p>
          </>
        );
    }
  };

  const renderSignUpForm = () => {
    switch (signUpRole) {
      case "user":
        return (
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h2>User Sign Up</h2>
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
            <button type="submit">Register</button>
          </form>
        );
      case "rider":
        return (
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h2>Rider Sign Up</h2>
            <input type="text" placeholder="Name" required minLength="2" />
            <input type="email" placeholder="Email" required />
            <input type="text" placeholder="NID" required minLength="8" />
            <input
              type="password"
              placeholder="Password"
              required
              minLength="6"
            />
            <button type="submit">Register</button>
          </form>
        );
      case "restaurant":
        return (
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h2>Restaurant Sign Up</h2>
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
            <button type="submit">Register</button>
          </form>
        );
      default:
        return (
          <>
            <h3>Sign Up as</h3>
            <button
              className="popup-link"
              onClick={() => setSignUpRole("user")}>
              👤 User
            </button>
            <button
              className="popup-link"
              onClick={() => setSignUpRole("rider")}>
              🛵 Rider
            </button>
            <button
              className="popup-link"
              onClick={() => setSignUpRole("restaurant")}>
              🍽️ Restaurant
            </button>
            <p className="switch-auth">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setShowSignIn(true);
                  setShowSignUp(false);
                }}>
                Sign In
              </span>
            </p>
          </>
        );
    }
  };

  return (
    <>
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
        </div>
        <div className="navbar-right">
          <button onClick={() => setShowSignIn(true)} className="auth-button">
            Sign In
          </button>
        </div>
      </nav>
      {showSignIn && (
        <div className="popup-overlay">
          <div className="popup" id="signin-popup">
            <button
              className="popup-close"
              onClick={() => {
                setShowSignIn(false);
                setSignInRole("");
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
