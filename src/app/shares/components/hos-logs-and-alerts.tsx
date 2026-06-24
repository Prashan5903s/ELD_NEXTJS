"use client";

import React, { useState } from "react";
import { Container, Row, Col, Accordion, Button } from "react-bootstrap";
import "../[id]/style.css";

const HOSLogsComponent = ({ accordionData, images }) => {
  const [activeKey, setActiveKey] = useState("0");

  const handleAccordionSelect = (key) => {
    if (key === null) {
      setActiveKey("0");
      return;
    }
    setActiveKey(key);
  };

  return (
    <Container style={{ paddingBottom: "50px" }} className="px-0">
      <Row className="align-items-center">
        <Col md={6}>
          <Accordion
            activeKey={activeKey}
            onSelect={(key) => handleAccordionSelect(key)}
          >
            {accordionData.map((item, index) => (
              <Accordion.Item eventKey={index.toString()} key={index}>
                <Accordion.Header className="accordian-heading">
                  {item.title}
                </Accordion.Header>
                <Accordion.Body>
                  {item.content}
                  <img
                    style={{ maxWidth: "100%" }}
                    className="accordian-img-mobile"
                    src={images[index]}
                    alt={item.title}
                  />
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Col>

        <Col md={6}>
          <img
            style={{ maxWidth: "100%" }}
            alt="active-section-img"
            className="accordian-images-desktop"
            src={images[activeKey]}
          />
        </Col>
      </Row>
      <div className="mt-4">
        <Button
          style={{
            color: "black",
            fontSize: "14.3px",
            borderRadius: "0",
            height: "40px",
            padding: "0 50px",
            marginTop: "50px",
            background: "#00b4ff",
          }}
          variant="primary"
        >
          Try for Free
        </Button>
      </div>
    </Container>
  );
};

export default HOSLogsComponent;
