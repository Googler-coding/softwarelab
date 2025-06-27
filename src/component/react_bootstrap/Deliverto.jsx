// FoodDeliveryDistricts.jsx
import React from "react";
import { Card, Container, Row, Col } from "react-bootstrap";
import "../css/Deliverto.css"; // CSS file remains the same
import dhaka from '../districtImage/dhaka.jpeg';
import chattogram from '../districtImage/chattogram.webp';
import khulna from '../districtImage/khulna.webp';
import narayanganj from '../districtImage/narayanganj.jpg';
import sylhet from '../districtImage/sylhet.jpg';
import rajshahi from '../districtImage/rajshahi.png';
import mymensingh from '../districtImage/mymenshigh.jpg';
import bogra from '../districtImage/bogra.jpg';
import cumilla from '../districtImage/cumilla.jpg';
import tangail from '../districtImage/tangail.webp';
import gazipur from '../districtImage/gazipur.jpeg';
import cox from '../districtImage/cox.jpg';

const districts = [
  {
    name: "Dhaka",
    image: dhaka,
    link: "/dhaka"
  },
  {
    name: "Chattogram",
    image: chattogram,
    link: "/chattogram"
  },
  {
    name: "Khulna",
    image: khulna,
    link: "/khulna"
  },
  {
    name: "Narayanganj",
    image: narayanganj,
    link: "/narayanganj"
  },
  {
    name: "Sylhet",
    image: sylhet,
    link: "/sylhet"
  },
  {
    name: "Rajshahi",
    image: rajshahi,
    link: "/rajshahi"
  },
  {
    name: "Mymensingh",
    image: mymensingh,
    link: "/mymensingh"
  },
  {
    name: "Bogra",
    image: bogra,
    link: "/bogra"
  },
  {
    name: "Cumilla",
    image: cumilla,
    link: "/cumilla"
  },
  {
    name: "Tangail",
    image: tangail,
    link: "/tangail"
  },
  {
    name: "Gazipur",
    image: gazipur,
    link: "/gazipur"
  },
  {
    name: "Cox's Bazar",
    image: cox,
    link: "/coxsbazar"
  }
];

function Deliverto() {
  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">We deliver to:</h2>
      <Row>
        {districts.map((district, idx) => (
         <Col key={idx} xs={12} sm={6} md={4} lg={2} xl={2} className="mb-4">
            <a href={district.link} className="district-link">
              <Card className="district-card">
                <Card.Img variant="top" src={district.image} alt={district.name} />
                <Card.ImgOverlay className="overlay">
                  <Card.Title>{district.name}</Card.Title>
                 
                </Card.ImgOverlay>
              </Card>
            </a>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Deliverto;
