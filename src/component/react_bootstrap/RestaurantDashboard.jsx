// src/component/react_bootstrap/RestaurantDashboard.jsx
import React, { useState } from "react";

function RestaurantDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) return;
    setMenuItems([...menuItems, newItem]);
    setNewItem({ name: "", price: "" });
  };

  const handleRemoveItem = (index) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Restaurant Dashboard</h1>

      <h2 className="text-lg font-semibold mb-2">Menu Items</h2>
      <ul className="border rounded p-3 mb-4">
        {menuItems.length === 0 ? (
          <li className="text-gray-500">No items added yet.</li>
        ) : (
          menuItems.map((item, index) => (
            <li key={index} className="flex justify-between py-2 border-b">
              <span>
                {item.name} - ${item.price}
              </span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-800">
                Remove
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Item name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="border px-2 py-1 flex-1"
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          className="border px-2 py-1 w-24"
        />
        <button
          onClick={handleAddItem}
          className="bg-blue-600 text-white px-4 py-1 rounded">
          Add
        </button>
      </div>
    </div>
  );
}

export default RestaurantDashboard;
