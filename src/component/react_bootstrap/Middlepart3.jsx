import React from 'react'
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import myimage3 from './fastdelivery.png';
import myimage4 from './livelocationtrack.png';
import myimage5 from './favrestau.png';
import '../css/Middlepart3.css';

function Middlepart3() {
  return (
    <Container>
      <Row>
        <Col xs={6} md={4}>
          <Image src={myimage3} rounded style={{ width: '200px', height: '200px' }} />
          <h5>Lightning-Fast Delivery</h5>
          <p class="text_formation" >Quicker than your cravings! Enjoy super-speed service and receive fresh, delicious food in no time.</p>

        </Col>
        <Col xs={6} md={4}>
          <Image src={myimage4} rounded style={{ width: '200px', height: '200px' }}/>
          <h5>Live Order Tracking</h5>
          <p class="text_formation">Track your order in real-time as it makes its way from the restaurant to your doorstep.</p>

        </Col>
        <Col xs={6} md={4}>
          <Image src={myimage5} rounded style={{ width: '200px', height: '200px' }} />
          <h5>Your Favorite Restaurants</h5>
          <p class="text_formation">Explore top-rated restaurants near your chosen location and enjoy your favorite meals anytime.</p>
        </Col>
      </Row>
    </Container>
  );
}

export default Middlepart3;
