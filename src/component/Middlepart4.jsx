import React from 'react';
import myimage5 from '../assets/image/middlepart4.jpg';
import '../component/css/Middlepart4.css';


const Middlepart4 = () => {
    return (
        <div>
            <div className="container">
               <div className="row align-items-center">
    
                     <div className="col-md-6 text-section">
                           <h1>Everything you crave, delivered.</h1>
                           <h4>Your favorite local restaurants</h4>
                           <p>Get a slice of pizza or the whole pie delivered, or pick up house lo mein from the Chinese takeout spot you've been meaning to try.
                           </p>
                           <button className="find-button">Find restaurants</button>
                    </div>

    
                    <div className="col-md-6 image-section">
                      <img src={myimage5} alt="Food Delivery" className="img-fluid" />
                    </div>
              </div>
           </div>

        </div>
    );
};

export default Middlepart4;