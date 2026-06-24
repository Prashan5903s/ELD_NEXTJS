"use client";

import {
  DirectionsRenderer,
  DirectionsService,
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import "../style.css";
import debounce from "lodash.debounce";
import { useMemo, useState, useEffect, useCallback } from "react";
import TooltipWrapper from "@/Components/tooltip";
import Skeleton from "react-loading-skeleton";
import Dropdown from "@/Components/dropdown";
import { safetyStatusOptions } from "../../constants";
import { SpeedingDetailsMap } from "../speeding-details-map";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import axios from "axios";

const SpeedingDetails = () => {
  const [data, setData] = useState(null);
  const [spdLmt, setSpdLmt] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [dist, setDist] = useState(0);

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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

  const params = useParams();

  const id = params?.id;

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "4px",
    borderLeft: 0,
  };

  const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = useMemo(
    () => ["places", "geometry", "drawing"],
    []
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries, // Make sure 'places' is included or adjust as needed
    id: "google-map-script",
    version: "weekly",
  });

  const getCityAndState = (address) => {
    const parts = address.split(",").map((part) => part.trim()); // Split address into parts

    if (parts.length >= 2) {
      const city = parts[1]; // Get the city
      const state = parts[2] ? parts[2].split(" ")[0] : ""; // Get the state abbreviation
      return `${city} ${state}`; // Return in "City State" format
    }
    return ""; // Return empty if parts are not sufficient
  };

  useEffect(() => {
    if (data && data[3]) {
      const locationString = data[3]?.location;

      // Parse the location string to access latitude and longitude
      try {
        const locationData = JSON.parse(locationString);
        const latitude = locationData.GeoLocation?.Latitude;
        const longitude = locationData.GeoLocation?.Longitude;

        if (isLoaded && latitude && longitude) {
          const geocoder = new window.google.maps.Geocoder();

          // Perform reverse geocoding
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === "OK" && results[0]) {
                setAddress(results[0].formatted_address);
              }
            }
          );
        }
      } catch (error) {
        console.error("Failed to parse location data:", error);
      }
    }
  }, [data]);

  const fetchSpeedDetail = useCallback(
    debounce(async () => {
      setLoading(true);
      if (!token) return;
      try {
        // Replace this URL with the actual endpoint for fetching documents
        const response = await axios.get(`${url}/speed/detail/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data || []);
        setLoading(false); // Set loading to false once data is fetched
      } catch (err) {
        setLoading(false); // Set loading to false once data is fetched
        console.error("Error fetching documents: " + err.message);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    }, 500), // Debounce time in milliseconds
    [url, token, id] // Dependencies if any
  );

  useEffect(() => {
    if (token && id) {
      fetchSpeedDetail();
    }
  }, [token, id]);

  useEffect(() => {
    if (data && data[2].length > 0) {
      const totalSpeed = data[2].reduce((sum, item) => sum + item.speed, 0); // Sum all speeds
      const averageSpeed = totalSpeed / data[2].length; // Calculate average
      setAvgSpeed(averageSpeed); // Update the state with the average speed
    }
  }, [data]);

  useEffect(() => {
    if (data && data[2] && data[2].length > 0) {
      const speeds = data[2].map((item) => item.speed);

      // Find the highest and lowest speeds
      const highest = Math.max(...speeds);
      const lowest = Math.min(...speeds);

      setSpdLmt([highest, lowest]);
    }
  }, [data]);

  const formatDuration = (durationInMinutes) => {
    const hours = Math.floor(durationInMinutes / 60); // Get hours
    const minutes = durationInMinutes % 60; // Get remaining minutes
    const seconds = 0; // Since we're working with minutes, seconds would be 0

    if (hours > 0) {
      return `${hours}h ${minutes}m`; // If there are hours, format with hours
    }
    return `${minutes}m`; // If no hours, just return minutes
  };

  useEffect(() => {
    if (data && data[2] && data[2].length > 1) {
      // Ensure data[2] has at least two items
      let totalDifference = 0;

      // Iterate through the array starting from the second element
      for (let i = 1; i < data[2].length; i++) {
        const currentItem = data[2][i];
        const previousItem = data[2][i - 1];

        // Calculate and accumulate the odometer difference between each consecutive item
        totalDifference += currentItem.odometer - previousItem.odometer;
      }

      setDist(totalDifference);
    }
  }, [data]);

  return (
    <div className="speeding-details-container">
      <div className="map-section-left position-relative">
        {isLoaded && (
          <div className="markers-colors-info">
            <div style={{ color: "gray" }} className="label">
              HIGH
            </div>
            <div className="color-bars"></div>
            <div style={{ color: "gray" }} className="label">
              LOW
            </div>
          </div>
        )}

        <SpeedingDetailsMap data={data} />
      </div>
      <div className="event-details-right-section">
        <h5>Overview</h5>

        <div className="mb-4 mt-4">
          <Dropdown data={safetyStatusOptions} />
        </div>

        <div className="event-section">
          {/* <div className="event-row">
            <label className="event-label">Severity</label>
            <div className="severity-select">
              <select className="severity-dropdown">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <div className="text-white">
                <TooltipWrapper
                  tooltipText={
                    "The driver did not maintain a safe following distance while driving above 45 mph."
                  }
                >
                  <span
                    style={{ cursor: "pointer" }}
                    className="why-link text-black"
                  >
                    Why?
                  </span>
                </TooltipWrapper>
              </div>
            </div>
          </div> */}

          <div className="event-row">
            <label className="event-label">Driver</label>
            <p className={`${data?.[0] ? "" : "driver-name"}`}>
              {data?.[0] ? (
                `${data[0].first_name} ${data[0].last_name}`
              ) : (
                <Skeleton />
              )}
            </p>
          </div>

          <div className="event-row">
            <label className="event-label">Vehicle</label>
            <p className="vehicle-name">
              {/* <a href="#" className="vehicle-link"> */}
              {data ? data[1] && data[1].name : <Skeleton />}
              {/* </a> */}
            </p>
            {/* <p className="vehicle-model">2022 KENWORTH T680</p> */}
          </div>

          <div className="event-row">
            <label className="event-label">Location</label>
            <p className="location">
              {address ? getCityAndState(address) : <Skeleton />}
            </p>
          </div>
          {/* <div className="event-row">
            <label className="event-label">ASSIGNED COACH</label>
            <p style={{ color: "red" }} className="location">
              No assigned coach
              <TooltipWrapper tooltipText="AMARJIT needs to be added to a group before they can be assigned a coach.">
                <svg
                  _ngcontent-pfu-c499=""
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginLeft: "18px" }}
                >
                  <path
                    _ngcontent-pfu-c499=""
                    d="M9.5 17a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm0-1a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zm-.6-9.63c0-.238.062-.423.186-.555.123-.132.3-.198.532-.198.23 0 .41.068.534.203.126.135.188.318.188.55 0 .234-.061.415-.185.544-.124.128-.303.192-.537.192-.479 0-.718-.245-.718-.737zm-.4 2.017c.979-.453 2-.06 2 .925 0 .482-.143.836-.546 1.582l-.007.013c-.338.626-.447.718-.447 1.18 0 .463.646.627 1 .463v.463c-.979.453-2 .06-2-.925 0-.485.141-.834.553-1.595l.007-.013c.33-.612.44-.705.44-1.168 0-.462-.646-.626-1-.462v-.463z"
                    fill="#757575"
                    fill-rule="evenodd"
                  ></path>
                </svg>
              </TooltipWrapper>
            </p>
          </div> */}
        </div>
        <div
          style={{ color: "gray", fontSize: "10px", width: "235px" }}
          className="speeding-details-section pt-5"
        >
          <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">DURATION</span>
            <span className="d-block">
              {data ? (
                data[3] && formatDuration(data[3].duration)
              ) : (
                <Skeleton />
              )}
            </span>
          </div>
          <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">AVG. SPEED</span>
            <span className="d-block">
              {avgSpeed ? avgSpeed.toFixed(1) : <Skeleton />} mph
            </span>
          </div>
          {/* <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">MAX OVER POSTED</span>
            <span className="d-block">11.9 mph</span>
          </div> */}
          <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">TRUCK SPEED LIMIT</span>
            <span className="d-block">55 mph</span>
          </div>
          <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">VEHICLE SPEED RANGE</span>
            <span className="d-block">
              {spdLmt ? `${spdLmt[0]} - ${spdLmt[1]}` : <Skeleton />} mph
            </span>
          </div>
          {/* <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">AVG. EXCEEDED</span>
            <span className="d-block">+9.1 mph</span>
          </div> */}
          <div className="p-2 pb-0 speeding-details-value d-flex justify-content-between align-items-center">
            <span className="d-block">DISTANCE</span>
            <span className="d-block">
              {dist ? dist.toFixed(1) : <Skeleton />} mi
            </span>
          </div>
        </div>

        {/* <div className="notes-section">
          <h2>Notes</h2>
          <textarea
            className="notes-textarea"
            placeholder="Write something..."
            rows={5}
            style={{ outline: "none" }}
          ></textarea>
          <p className="save-note">Enter ↵ to Save</p>
          <div className="visible-checkbox">
            <input type="checkbox" id="visibleToDriver" />
            <label htmlFor="visibleToDriver">Make visible to driver</label>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SpeedingDetails;
