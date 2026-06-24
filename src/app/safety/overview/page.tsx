"use client";
import React, { useEffect, useState, useCallback } from "react";
import debounce from 'lodash.debounce';
import BarChart from "./components/bar-chart";
import CarouselComponent from "./components/carousel";
import SafetyHeader from "./components/header";
import { useSession } from "next-auth/react";
import SafetyScoreTrend from "./components/line-chart";
import PerformanceLeaderBoard from "./components/performance-leaderboard";

import {
  carouselData,
  performanceLeaderBoardData,
  safetyScoresData,
} from "./static-data";

import "./style.css";
import axios from "axios";
import { set } from "date-fns";
import { da } from "@faker-js/faker";
import Skeleton from "react-loading-skeleton";

const Safety = () => {

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const [data, setData] = useState(null);
  const [val, setVal] = useState(null);
  const [valLoad, setValLoad] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isClient, setIsClient] = useState(false); // Ensure client-side rendering
  const [loading, setLoading] = useState(false);

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const { data: session } = (useSession() as { data?: SessionData }) || {};

  const token = session && session.user && session?.user?.token;

  const formatDateRange = (startDate, endDate) => {
    const options = { month: 'short', day: '2-digit' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  // Detect if it's client-side to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchReport = useCallback(
    debounce(async () => {

      setLoading(false);
      setValLoad(false);

      try {
        const response = await axios.get(`${url}/safety/report/data/${startDate}/${endDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setData(response.data);
          setLoading(true);
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      }
    }, 500),
    [token, startDate, endDate, url]
  );

  useEffect(() => {
    if (token) {
      fetchReport();
    }
  }, [token, startDate, endDate, url]);

  useEffect(() => {

    if (data) {

      var driverCount = data['driver_count'];

      var drive_miles = data['data'][1];

      var event_per_miles = data['event_per_miles'];

      var kepmValue = event_per_miles / 1000;
      var kepmFormatted = event_per_miles == 0 ? 0 + 'k' : kepmValue.toFixed(3) + 'k';

      var kValue = drive_miles / 1000; // Divide by 1000
      var kFormatted = drive_miles == 0 ? 0 + 'k' : kValue.toFixed(3) + 'k';

      var score = data['data'][0];
      var messageLabel = (score >= 0 && score <= 49)
        ? 'POOR (0-49)'
        : (score >= 50 && score <= 76)
          ? 'FAIR (50-76)'
          : (score >= 77 && score <= 89)
            ? 'GOOD (77-89)'
            : (score >= 90 && score <= 100)
              ? 'EXCELLENT (90-100)'
              : '';

      const safety_score_data = {
        safetyScores: {
          scores: data['data'][0],
          label: `${messageLabel}`,
          scroreVariation: -2,
        },
        subItems: [
          {
            id: 1,
            label: "Total Driving (mi)",
            value: `${kFormatted}`,
            valueInPercentage: 64,
          },
          {
            id: 2,
            label: "Active Drivers",
            value: `${driverCount} --`,
            valueInPercentage: null,
          },
          {
            id: 3,
            label: "Events / 1K mi",
            value: kepmFormatted,
            valueInPercentage: -10,
          },
          {
            id: 4,
            label: "Speeding",
            value: `${data['data'][2]}`,
            valueInPercentage: 1,
          },
          {
            id: 5,
            label: "Collisions",
            value: "0",
            valueInPercentage: null,
          },
        ],
      };


      setVal(safety_score_data);
      setValLoad(true);

    }

  }, [data]);

  useEffect(() => {
    setValLoad(false);
    if (val) {
      setValLoad(true);
    }
  }, [val])

  // Avoid rendering dynamic content until it's on the client-side
  if (!isClient) {
    return null;
  }

  return (
    <div className="safety-page">
      {
        valLoad
          ?
          (

            <SafetyHeader data={val} setStartDate={setStartDate} date1={startDate} date2={endDate} setEndDate={setEndDate} />

          )
          :
          (
            <Skeleton height={120} />
          )
      }
      <div className="safety-graph-wrapper">
        <div className="safety-charts">
          <h3 style={{ padding: "20px", paddingBottom: "10px" }}>
            Safety Score Trend
          </h3>
          <p
            style={{
              padding: "0 20px 10px 20px",
              display: "flex",
              gap: "5px",
            }}
          >
            Your score trended down over the last 12 weeks.
            <a href="#">View report</a>
          </p>
          <SafetyScoreTrend />
        </div>
        <div className="safety-charts safety-charts-bar">
          <p className="d-flex align-items-center justify-content-between">
            <h3 style={{ padding: "20px", paddingBottom: "10px" }}>
              Safety Score Factors
            </h3>
            {/* <span className="mt-1 mx-6">Sep 09 – Oct 06</span> */}
          </p>
          <p
            style={{
              padding: "0 20px 10px 20px",
              display: "flex",
              gap: "5px",
            }}
          >
            Top 5 behaviors impacting your score.
            <a href="#">View all behaviors</a>
          </p>
          <BarChart startDate={startDate} endDate={endDate} />
        </div>
      </div>
      <div className="scores-container-wrapper">
        <div
          className="d-flex align-items-center justify-content-between"
          style={{ marginTop: "30px" }}
        >
          <h3 className="heading">Performance Leaderboard</h3>
          <div className="d-flex mx-6 gap-4">
            <a href="#">View all</a>
          </div>
        </div>
        <PerformanceLeaderBoard startDate={startDate} endDate={endDate} />
      </div>
      {/* <div className="carousel-wrapper">
        <div
          className="d-flex align-items-center justify-content-between pt-0"
          style={{ padding: "20px" }}
        >
          <h3 className="heading">Recent Events</h3>
          <div className="d-flex align-items-center mx-6 gap-4">
            <a href="#"> View all speeding events</a>. <a href="#">View all</a>
          </div>
        </div>
        <CarouselComponent data={carouselData} />
      </div> */}
    </div>
  );
};

export default Safety;
