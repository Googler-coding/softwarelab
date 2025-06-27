document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("restaurant-search");
  const suggestionsList = document.getElementById("suggestions");

  // Initialize the map, set its view centered on Bangladesh
  const map = L.map("map").setView([23.685, 90.3563], 7); // Bangladesh coordinates

  // Add tile layer to the map
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Function to fetch restaurants from the backend
  async function fetchRestaurants(query) {
    const response = await fetch(`/api/restaurants`);
    const data = await response.json();
    const filteredData = data.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(query.toLowerCase())
    );
    return filteredData;
  }

  // Function to display restaurant suggestions
  function displaySuggestions(restaurants) {
    suggestionsList.innerHTML = "";
    restaurants.forEach((restaurant) => {
      const suggestionItem = document.createElement("li");
      suggestionItem.textContent = restaurant.name;
      suggestionItem.addEventListener("click", function () {
        // Zoom into the selected restaurant's location on the map
        map.setView([restaurant.lat, restaurant.lon], 14); // Zoom in closer
        L.marker([restaurant.lat, restaurant.lon])
          .addTo(map)
          .bindPopup(restaurant.name)
          .openPopup();

        // Hide the suggestions after selecting one
        suggestionsList.innerHTML = "";
      });
      suggestionsList.appendChild(suggestionItem);
    });
  }

  // Event listener to handle search input
  searchInput.addEventListener("input", async function (event) {
    const query = event.target.value;

    if (query.length >= 2) {
      const restaurants = await fetchRestaurants(query);
      displaySuggestions(restaurants);
    } else {
      suggestionsList.innerHTML = "";
    }
  });

  // Event listener to show suggestions when the user focuses on the search input
  searchInput.addEventListener("focus", function () {
    const query = searchInput.value;
    if (query.length >= 2) {
      fetchRestaurants(query).then(displaySuggestions);
    }
  });

  // Hide suggestions when the user clicks outside of the search input or suggestion list
  document.addEventListener("click", function (event) {
    if (
      !searchInput.contains(event.target) &&
      !suggestionsList.contains(event.target)
    ) {
      suggestionsList.innerHTML = ""; // Clear suggestions when clicked outside
    }
  });
});
