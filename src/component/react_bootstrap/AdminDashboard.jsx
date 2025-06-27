// src/component/react_bootstrap/AdminDashboard.jsx
import React from "react";

function AdminDashboard() {
  const restaurants = [
    {
      name: "Pizza Palace",
      location: { lat: 23.78, lon: 90.4 },
      menu: [
        { name: "Pepperoni Pizza", price: 12 },
        { name: "Veggie Pizza", price: 10 },
      ],
    },
    {
      name: "Burger House",
      location: { lat: 23.75, lon: 90.42 },
      menu: [
        { name: "Cheese Burger", price: 8 },
        { name: "Chicken Burger", price: 9 },
      ],
    },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      {restaurants.map((restaurant, idx) => (
        <div key={idx} className="border p-4 mb-4 rounded shadow-sm bg-white">
          <h3 className="text-xl font-semibold">{restaurant.name}</h3>
          <p>
            <strong>Latitude:</strong> {restaurant.location.lat}
          </p>
          <p>
            <strong>Longitude:</strong> {restaurant.location.lon}
          </p>
          <h4 className="mt-3 font-medium">Menu:</h4>
          <ul className="list-disc ml-5">
            {restaurant.menu.map((item, i) => (
              <li key={i}>
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
