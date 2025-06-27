import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./component/Header";
import Middlepart1 from "./component/middlepart1";
import Middlepart2 from "./component/react_bootstrap/Middlepart2";
import Middlepart3 from "./component/react_bootstrap/Middlepart3";
import Middlepart4 from "./component/Middlepart4";
import Middlepart5 from "./component/Middlepart5";
import Deliverto from "./component/react_bootstrap/Deliverto";
import Footer from "./component/Footer";
import SignIn from "./component/react_bootstrap/SignIn";
import SignUp from "./component/react_bootstrap/SignUp";
import InRestaurantOrder from "./component/react_bootstrap/InRestaurantOrder";
import RiderDashboard from "./component/react_bootstrap/RiderDashboard";
import RestaurantDashboard from "./component/react_bootstrap/RestaurantDashboard";
import AdminDashboard from "./component/react_bootstrap/AdminDashboard";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

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

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/in-restaurant-order" element={<InRestaurantOrder />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/rider-dashboard" element={<RiderDashboard />} />
          <Route
            path="/restaurant-dashboard"
            element={<RestaurantDashboard />}
          />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
