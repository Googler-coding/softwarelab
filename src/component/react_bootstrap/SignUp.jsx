import React, { useState } from "react";
import "../css/AuthForm.css";


const SignUp = () => {
  const [role, setRole] = useState("");

  const renderForm = () => {
    switch (role) {
      case "user":
        return (
          <form className="form">
            <h2>User Sign Up</h2>
            <input type="text" placeholder="Name" required />
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Register</button>
          </form>
        );
      case "rider":
        return (
          <form className="form">
            <h2>Rider Sign Up</h2>
            <input type="text" placeholder="Name" required />
            <input type="email" placeholder="Email" required />
            <input type="text" placeholder="Phone Number" required />
            <input type="text" placeholder="Rider ID" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Register</button>
          </form>
        );
      case "restaurant":
        return (
          <form className="form">
            <h2>Restaurant Registration</h2>
            <input type="text" placeholder="Restaurant Name" required />
            <input type="text" placeholder="Owner Name" required />
            <input type="text" placeholder="Longitude" required />
            <input type="text" placeholder="Latitude" required />
            <input type="number" placeholder="Distance (km)" required />
            <textarea placeholder="Menu Items (comma separated)" required />
            <input type="text" placeholder="Restaurant ID" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Register</button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="signup-container">
      <h1>Select Your Role</h1>
      <div className="role-buttons">
        <button onClick={() => setRole("user")}>User</button>
        <button onClick={() => setRole("rider")}>Rider</button>
        <button onClick={() => setRole("restaurant")}>Restaurant Owner</button>
      </div>
      {renderForm()}
    </div>
  );
};

export default SignUp;
