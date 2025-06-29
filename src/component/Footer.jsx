import React from 'react';
import '../component/css/Footer.css';

const Footer = () => {
    return (
        <footer className="quickbite-footer">
  <div className="container">
    <div className="footer-top">
      <div className="footer-column">
        <h5>Popular Categories</h5>
        <ul>
          <li>Grocery Delivery Bangladesh</li>
          <li>Medicine Delivery</li>
          <li>Flower Delivery</li>
          <li>Pet Food Delivery</li>
          <li>Ramadan Grocery Offers</li>
          <li>Eid Gift Delivery</li>
          <li>Wedding Catering</li>
          <li>Pohela Boishakh Specials</li>
          <li>Birthday Cake Delivery</li>
          <li>1 Hour Express Delivery</li>
          <li>Summer Mango Delivery</li>
          <li>Victory Day Specials</li>
        </ul>
      </div>

      <div className="footer-column">
        <h5>Get to Know Us</h5>
        <ul>
          <li>About Quickbite</li>
          <li>Careers</li>
          <li>Blog</li>
          <li>Investor Relations</li>
          <li>Merchant Info</li>
        </ul>
      </div>

      <div className="footer-column">
        <h5>Let Us Help You</h5>
        <ul>
          <li>Account Details</li>
          <li>Order History</li>
          <li>Customer Support</li>
          <li>FAQs</li>
        </ul>
      </div>

      <div className="footer-column">
        <h5>Doing Business</h5>
        <ul>
          <li>Become a Quickbite Partner</li>
          <li>Quickbite for Business</li>
          <li>Bulk Orders</li>
          <li>Corporate Solutions</li>
        </ul>
      </div>
    </div>

    <div className="footer-bottom">
      <p>© 2025 Quickbite | Terms of Service | Privacy Policy | Delivery Locations</p>
    </div>
  </div>
</footer>

    );
};

export default Footer;