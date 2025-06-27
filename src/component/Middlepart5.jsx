import React from 'react';
import myimage6 from '../assets/image/middlepart5.jpg';
import '../component/css/Middlepart4.css';

const Middlepart5 = () => {
    return (
        
           <div>
  <div className="container">
    <div className="row align-items-center">
      
      {/* Left side: Image */}
      <div className="col-md-6 image-section">
        <img src={myimage6} alt="Food Delivery" className="img-fluid" />
      </div>

      {/* Right side: Text */}
      <div className="col-md-6 text-section">
        <h1>QuickBitePass is delivery for less</h1>
        <p>
        Members get a $0 delivery fee on DashPass orders, 5% back on pickup orders, and so much more. Plus, it's free for 30 days.
        </p>
        <button className="find-button">Get QuickBite</button>
      </div>

    </div>
  </div>


        </div>
    );
};

export default Middlepart5;