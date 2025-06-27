import React, { useState } from "react";
import "../css/AuthForm.css";


const SignIn = () => {
  const [role, setRole] = useState("");

  const renderSignInForm = () => {
    switch (role) {
      case "user":
        return (
          <form className="form">
            <h2>User Sign In</h2>
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Sign In</button>
          </form>
        );
      case "rider":
        return (
          <form className="form">
            <h2>Rider Sign In</h2>
            <input type="text" placeholder="Rider ID" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Sign In</button>
          </form>
        );
      case "restaurant":
        return (
          <form className="form">
            <h2>Restaurant Owner Sign In</h2>
            <input type="text" placeholder="Restaurant ID" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Sign In</button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="signup-container">
      <h1>Select Role to Sign In</h1>
      <div className="role-buttons">
        <button onClick={() => setRole("user")}>User</button>
        <button onClick={() => setRole("rider")}>Rider</button>
        <button onClick={() => setRole("restaurant")}>Restaurant Owner</button>
      </div>
      {renderSignInForm()}
    </div>
  );
};

export default SignIn;
