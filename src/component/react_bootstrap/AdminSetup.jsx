import React, { useState } from "react";

const AdminSetup = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const createAdmin = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@gmail.com",
            password: "admin11",
          }),
        }
      );

      const text = await res.text();
      console.log("Raw response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse error:", err);
        throw new Error("Invalid response from server");
      }

      if (!res.ok) throw new Error(result.error || "Failed to create admin");

      setMessage(result.message);
      setError("");
    } catch (err) {
      console.error("Create admin error:", err);
      setError(err.message);
      setMessage("");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
      <button
        onClick={createAdmin}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
        Create Admin Account
      </button>
      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default AdminSetup;
