"use client";

import "./style.css";
import axios from "axios";
import debounce from "lodash.debounce";
import Footer from "../components/footer";
import { usePDF, Margin } from "react-to-pdf";
import LoadingIcons from "react-loading-icons";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Button, Col, Row } from "react-bootstrap";
import { SessionProvider, useSession } from "next-auth/react";
import { accordionData, images } from "../components/constants";
import React, { useState, useEffect, useCallback } from "react";
import HOSLogsComponent from "../components/hos-logs-and-alerts";
import DriversDailyLog from "../../../driverComponent/daily-log-tables/daily-logs-intro-table";

const Page = (id) => {
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionData, setDOTData] = useState<any>();
  const [startDownload, setStartDownload] = useState(false);

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const tokens = id.params.id;

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const { data: session } = (useSession() as { data?: SessionData }) || {};

  const checkTokenExist = useCallback(
    debounce(async (tokens) => {
      if (!tokens) return; // Prevent unnecessary calls
      setLoading(true); // Set loading before the fetch
      try {
        const response = await axios.get(`${url}/check/token/email/${tokens}`);
        setData(response?.data?.data); // Assuming `response.data` contains the result
      } catch (err) {
        console.error("Error fetching documents:", err.message);
      } finally {
        setLoading(false); // Ensure loading is false after the fetch
      }
    }, 500), // Debounce time in milliseconds
    [url] // Only include `url` as dependency
  );

  const fetchDOTData = useCallback(
    debounce(async (tokens) => {
      if (!tokens) return; // Prevent unnecessary calls
      setLoading(true); // Set loading before the fetch
      try {
        const response = await axios.get(`${url}/dot/inspection/data/${tokens}`);
        setDOTData(response?.data); // Assuming `response.data` contains the result
      } catch (err) {
        console.error("Error fetching documents:", err.message);
      } finally {
        setLoading(false); // Ensure loading is false after the fetch
      }
    }, 500), // Debounce time in milliseconds
    [url] // Only include `url` as dependency
  );

  useEffect(() => {
    if (tokens) {
      checkTokenExist(tokens);
    }
  }, [tokens]); // Add `checkTokenExist` as a dependency

  useEffect(() => {
    if (tokens) {
      fetchDOTData(tokens);
    }
  }, [tokens]);

  useEffect(() => {
    if (tokens && inspectionData) {
      setStartDownload(true);
    }
  }, [tokens, inspectionData]);

  const { toPDF, targetRef } = usePDF({
    method: "save",
    filename: "dot_inspection_report.pdf",
    page: { margin: Margin.MEDIUM },
  });

  const handleDownload = async () => {
    setIsLoading(true); // Start the loading circle
    await toPDF(); // Wait until the PDF download starts
    setIsLoading(false); // Stop the loading circle once the download is triggered
  };

  return (
    <div style={{ overflowY: "scroll", height: "100vh" }}>
      <div style={{ overflow: "hidden" }}>
        <div className="shares-container">
          <div className="download-pdf-section">
            <div style={{ minWidth: "550px" }}>
              <a href={"/"}>
                <img
                  src="http://localhost:3000/_next/static/media/demo.ff0e633d.svg"
                  alt="logo"
                />
              </a>
              {data?.user ? (
                <h1>
                  {data?.user?.first_name} {data?.user?.last_name} sent you 8
                  logs
                </h1>
              ) : (
                <div style={{ marginTop: "10px" }}>
                  <Skeleton height={30} />
                </div>
              )}
              <p style={{ marginTop: "25px", fontSize: "22px" }}>
                Try the UAT ELD and Logbook App that drivers prefer.
              </p>
              <div className="shares-btn-group">
                {startDownload ? (
                  <Button
                    style={{ border: "1px solid black", position: "relative" }}
                    variant="outline-dark"
                    onClick={handleDownload}
                    disabled={isLoading} // Disable the button while loading
                  >
                    {isLoading ? (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <LoadingIcons.TailSpin height={18} />
                        <span style={{ marginLeft: "10px" }}>Downloading...</span>
                      </div>
                    ) : (
                      "Download as PDF"
                    )}
                  </Button>
                ) : (
                  <Skeleton width={160} height={42} />
                )}

                <Button
                  style={{
                    color: "black",
                    fontSize: "14.3px",
                    background: "#00b4ff",
                  }}
                  variant="primary"
                >
                  Try for Free
                </Button>
              </div>
            </div>
            <div>
              <img
                className="shares-highway-img"
                src="https://images.unsplash.com/photo-1575999420549-1c455856fc97?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="bg-image"
              />
            </div>
          </div>
        </div>
        <div className="bg-light d-flex justify-content-center">
          <Row
            style={{
              maxWidth: "1440px",
              paddingLeft: "8%",
              position: "relative",
            }}
            className="py-10 shares-feature-section w-100"
          >
            <Col className="shares-feature-section-bottom">
              <h5>5-min installations</h5>
              <p>{`Simple "plug and play" ELD design`}</p>
              <div className="down-border"></div>
            </Col>
            <Col
              style={{ paddingLeft: "40px" }}
              className="shares-feature-section-bottom border-blue"
            >
              <h5>50% faster</h5>
              <p>Complete tasks like DVIRs quick*</p>
              <div className="down-border"></div>
            </Col>
            <Col className="shares-feature-section-inner border-blue">
              <h5>24/7/365 support</h5>
              <p>Keep your business moving forward</p>
            </Col>
          </Row>
        </div>
        <div className="shares-container">
          <div className="mt-16">
            <h2 style={{ fontSize: "34px" }}>Reliable ELD Compliance</h2>
            <p className="mb-12" style={{ color: "#666666", fontSize: "20px" }}>
              Give your drivers the #1-rated ELD** that helps prevent HOS
              violations
            </p>
          </div>
          <HOSLogsComponent accordionData={accordionData} images={images} />;
        </div>
      </div>
      <Footer />
      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <div ref={targetRef} style={{ maxWidth: "800px" }}>
          <DriversDailyLog logData={logData} DOTData={inspectionData} />
        </div>
      </div>
    </div>
  );
};

export default Page;

const logData = {
  logDate: "November 26, 2024",
  printDate: "December 10, 2024",
  driver: "ASSDA",
  id: "ranjit543210",
  fleetId: "D6687235, CA",
  coDrivers: "",
  driverLicense: "D6687235, CA",
  exemptDriver: "0",
  distance: "1) 456 mi",
  vehicleLicense: "A051862",
  odometers: "1) 748,940 - 749,592",
  engineHours: "1) 26135.3 - 26151.4",
  currentLocation: "",
  shippingDocs: "Amazon",
  dataDiagIndicators: "Yes (1)",
  eldMalfnIndicators: "No",
  eldId: "MOTIVE",
  eldProvider: "Motive Technologies Inc.",
  createdAt: "2024-12-12",
  mobileNo: "+1 123 456 789",
  location: "RIETA, CA, 92563",
};

