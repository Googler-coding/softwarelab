import React from "react";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import myimage from './rider.jpg';
import myimage2 from './restaurant.jpg';


function Middlepart2() {
  return (
    <div className="d-flex justify-content-around">
      <Card style={{ width: '20rem' }}>
        <Card.Img variant="top" src={myimage2} />
        <Card.Body>
          <Card.Title>Add Your Restaurant to QuickBite</Card.Title>
          <Card.Text>
                  A short sample text to support the card title.
                  It fills and completes the main content area.
          </Card.Text>
          <Button variant="danger">Become a Partner</Button>
        </Card.Body>
      </Card>

      <Card style={{ width: '20rem' }}>
        <Card.Img variant="top" src={myimage} />
        <Card.Body>
        <Card.Title>Join QuickBite and Be a Hero</Card.Title>
          <Card.Text>
          Are you quick on your feet and skilled in navigation?
          Become a QuickBite Hero, deliver happiness to doorsteps, and earn up to 30,000 TK monthly.
          </Card.Text>
          <Button variant="danger">Become a Hero</Button>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Middlepart2;