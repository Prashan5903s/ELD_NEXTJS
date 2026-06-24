"use client";

import {
  DirectionsRenderer,
  DirectionsService,
  GoogleMap,
  LoadScript,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import "../style.css";
import debounce from "lodash.debounce";
import { useState, useCallback, useMemo, useEffect } from "react";
import TooltipWrapper from "@/Components/tooltip";
import Dropdown from "@/Components/dropdown";
import { safetyStatusOptions } from "../../constants";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
  "geometry",
  "drawing",
];

const EventDetails = () => {
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const [data, setData] = useState(null);

  const [loc, setLoc] = useState([]);

  const [locArray, setLocArray] = useState([]);

  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState(null);

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

  const center = { lat: 37.7749, lng: -122.4194 };
  const zoom = 2;

  const libraries: ("places" | "geometry" | "drawing" | "visualization")[] =
    useMemo(() => ["places", "geometry", "drawing"], []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries, // Make sure 'places' is included or adjust as needed
    id: "google-map-script",
    version: "weekly",
  });

  const directionsOptions = useMemo(() => {
    if (!isLoaded || loc.length === 0) return null; // Ensure the map is loaded before accessing google
    return {
      origin: loc[0], // Assuming loc[0] is the origin
      destination: loc[1], // Assuming loc[1] is the destination
      travelMode: window.google.maps.TravelMode.DRIVING,
    };
  }, [loc, isLoaded]);

  useEffect(() => {
    if (locArray.length > 0) {
      const origin = { lat: locArray[0], lng: locArray[1] };
      const destination = { lat: locArray[0], lng: locArray[1] };
      const center = { lat: locArray[0], lng: locArray[1] };
      setLoc([origin, destination, center]);
    }
  }, [locArray]);

  const handleDirectionsCallback = useCallback((response) => {
    if (response !== null && response.status === "OK") {
      setDirectionsResponse((prev) => (prev === response ? prev : response));
    } else {
      console.error("Directions request failed:", response);
    }
  }, []);

  const fetchEventDetail = useCallback(
    debounce(async () => {
      setLoading(true);
      if (!token) return;
      try {
        // Replace this URL with the actual endpoint for fetching documents
        const response = await axios.get(
          `${url}/driver/safety/event/specific/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
;

        setData(response.data.data || []);
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
      fetchEventDetail();
    }
  }, [token, id]);

  const getSpeedRange = (speed) => {
    if (speed == null) return "No speed data available"; // Handle null case
    const lowerBound = Math.floor(speed / 10) * 10; // Round down to the nearest ten
    const upperBound = lowerBound + 10; // Add 10 for the upper range
    return `${lowerBound} - ${upperBound}`; // Return formatted range
  };

  useEffect(() => {
    if (data && data[1]) {
      const locationString = data[1]?.location;

      // Parse the location string to access latitude and longitude
      try {
        const locationData = JSON.parse(locationString);
        const latitude = locationData.GeoLocation?.Latitude;
        const longitude = locationData.GeoLocation?.Longitude;

        if (isLoaded && latitude && longitude) {
          setLocArray([latitude, longitude]);

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

  const getCityAndState = (address) => {
    const parts = address.split(",").map((part) => part.trim()); // Split address into parts

    if (parts.length >= 2) {
      const city = parts[1]; // Get the city
      const state = parts[2] ? parts[2].split(" ")[0] : ""; // Get the state abbreviation
      return `${city} ${state}`; // Return in "City State" format
    }
    return ""; // Return empty if parts are not sufficient
  };

  return (
    <div>
      <div className="event-details-container">
        <div className="event-details-left-section">
          <div className="event-image position-relative">
            <div className="bg-black text-center">
              Video is available for this event.{" "}
              <a className=" text-white mx-1" href="#">
                Get videos
              </a>
            </div>
            <img
              src="/duty_logo/truck_dashboard.jpg"
              width={"100%"}
              alt="dashboard-image"
            />
            <div className="position-absolute speed-over-image">
              <div style={{ fontSize: "24px" }}>
                {data ? data[1] && data[1]?.speed : <Skeleton />}
              </div>
              <div>MPH</div>
              {/* <div
                style={{
                  margin: "5px 0px",
                  borderTop: "1px solid white",
                  width: "119%",
                }}
              ></div>
              <div>75 TRUCKS</div> */}
            </div>
          </div>
          <div className="mt-4 event-happening-details">
            <div className="event-happening-details-left">
              {/* <div>
                <p className="m-0">AVERAGE TIME-TO-HIT</p>
                <p>
                  <strong>0.6s</strong>
                </p>
              </div>
              <div>
                <p className="m-0">RISKIEST TIME-TO-HIT</p>
                <p>
                  <strong>0.6s</strong>
                </p>
              </div> */}
              <div>
                <p className="m-0">Duration</p>
                <p>
                  <strong>
                    {data ? (
                      data[1] && data[1].duration / 60 + "s"
                    ) : (
                      <Skeleton />
                    )}
                  </strong>
                </p>
              </div>
              <div>
                <p className="m-0">Speed Range</p>
                <p>
                  <strong>
                    {data ? (
                      data[1] && getSpeedRange(data[1]?.speed) + " MPH"
                    ) : (
                      <Skeleton />
                    )}
                  </strong>
                </p>
              </div>
              <div>
                <p className="m-0">Address</p>
                <p>
                  <strong>{address ? address : <Skeleton />}</strong>
                </p>
              </div>
              <div>
                <p className="m-0">Bearing</p>
                <p>
                  <strong>
                    {data ? data && data[1]?.direction_alpha : <Skeleton />}
                  </strong>
                </p>
              </div>
            </div>
            <div className="map-section">
              {isLoaded && directionsOptions && loc ? ( // Check if directionsOptions is also valid
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={loc[2]}
                  zoom={zoom}
                >
                  <DirectionsService
                    options={directionsOptions}
                    callback={handleDirectionsCallback}
                  />

                  {directionsResponse && (
                    <DirectionsRenderer directions={directionsResponse} />
                  )}
                </GoogleMap>
              ) : (
                <Skeleton height={200} />
              )}
              {loadError && <div>Error loading map</div>}
            </div>
          </div>
        </div>
        <div className="event-details-right-section">
          <div className="mb-4">
            <Dropdown data={safetyStatusOptions} />
          </div>
          <div className="sent-to-driver d-flex flex-row justify-content-between align-items-center">
            <div>
              <div>{/* <strong>Sent to driver</strong> */}</div>
              <div>
                <span>{data ? data && data[3] && data[3] : <Skeleton />}</span>
                <span>{/* {"  "}.{"  "} */}</span>
                {/* <span>Motive Safety</span> */}
              </div>
            </div>
            {/* <div>
              <button style={{ border: 0, outline: "none" }}>
                <svg
                  width="20px"
                  height="20px"
                  viewBox="0 0 20 20"
                  fill="rgba(0, 0, 0, 0.63)"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10 7.5C8.61932 7.5 7.50003 8.61929 7.50003 10C7.50003 11.3807 8.61932 12.5 10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5ZM8.75003 10C8.75003 9.30964 9.30968 8.75 10 8.75C10.6904 8.75 11.25 9.30964 11.25 10C11.25 10.6904 10.6904 11.25 10 11.25C9.30968 11.25 8.75003 10.6904 8.75003 10Z"
                  ></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M11.789 2.5H8.21106L7.5037 5.20761L6.9404 5.51883L4.14035 4.75234L2.3269 7.75805L4.43597 9.70951L4.43597 10.2905L2.3269 12.242L4.14035 15.2477L6.94041 14.4812L7.5037 14.7924L8.21106 17.5H11.789L12.4963 14.7924L13.0597 14.4812L15.8597 15.2477L17.6732 12.242L15.5641 10.2905L15.5641 9.70951L17.6732 7.75805L15.8597 4.75234L13.0597 5.51883L12.4963 5.2076L11.789 2.5ZM8.57756 6.04239L9.17645 3.75H10.8236L11.4225 6.0424L12.8998 6.85858L15.2778 6.20761L16.0769 7.53202L14.3141 9.1631L14.3141 10.8369L16.0769 12.468L15.2778 13.7924L12.8998 13.1414L11.4225 13.9576L10.8236 16.25H9.17645L8.57756 13.9576L7.10029 13.1414L4.72222 13.7924L3.92316 12.468L5.68597 10.8369L5.68597 9.1631L3.92316 7.53202L4.72222 6.20761L7.1003 6.85859L8.57756 6.04239Z"
                  ></path>
                </svg>
              </button>
            </div> */}
          </div>

          <div className="event-section">
            <h2 className="section-title">Event Details</h2>

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
              <label className="event-label">Unsafe Behaviors</label>
              <TooltipWrapper
                tooltipText={
                  "Changing lanes suddenly, frequently, or at an unsafe distance from the vehicle in front."
                }
              >
                <div className="unsafe-behaviors-select">
                  {data ? (
                    data && data[1] && data[1].message_reason
                  ) : (
                    <Skeleton />
                  )}
                </div>
              </TooltipWrapper>
            </div>

            <div className="event-row">
              <label className="event-label">Driver</label>
              <p className={data && data[2] ? "" : "driver-name"}>
                {data ? (
                  data && data[2] ? (
                    `${data[2].first_name} ${data[2].last_name}`
                  ) : (
                    "Unidentified"
                  )
                ) : (
                  <Skeleton />
                )}
              </p>
              {/* <p className="driver-id">ID: N/A</p> */}
            </div>

            <div className="event-row">
              <label className="event-label">Vehicle</label>
              <p className="vehicle-name">
                {data ? data && data[0] && data[0] : <Skeleton />}
              </p>
            </div>

            <div className="event-row">
              <label className="event-label">Location</label>
              <p className="location">
                {address ? address && getCityAndState(address) : <Skeleton />}
              </p>
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
    </div>
  );
};

export default EventDetails;
