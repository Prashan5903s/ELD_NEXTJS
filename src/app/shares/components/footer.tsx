"use client";

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "../[id]/style.css";

const Footer = () => {
  return (
    <footer
      className="shares-footer"
      style={{
        backgroundColor: "#000",
        color: "#999",
        padding: "10px 0 10px 0",
      }}
    >
      <Container style={{ color: "#999" }}>
        <Row
          style={{ flexWrap: "wrap" }}
          className="align-items-center d-flex justify-content-center"
        >
          {/* Logo Section */}
          <Col xs="auto">
            <img
              src="http://localhost:3000/_next/static/media/demo.ff0e633d.svg"
              alt="logo"
            />
          </Col>

          <Col xs="auto" className="d-flex gap-3">
            <span>© 2013-2024 UAT ELD Technologies, Inc.</span>
          </Col>

          {/* Links Section */}
          <Col xs="auto" className="d-flex gap-3 footer-links">
            <a
              href="#"
              style={{ color: "#fff", textDecoration: "none" }}
            >
              Privacy
            </a>
            <a href="#" style={{ color: "#fff", textDecoration: "none" }}>
              Terms of Service
            </a>
            <a
              href="#"
              style={{ color: "#fff", textDecoration: "none" }}
            >
              Back to UAT ELD
            </a>
            <a
              href="#"
              style={{ color: "#fff", textDecoration: "none" }}
            >
              Contact Support
            </a>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
