"use client";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import debounce from "lodash.debounce";
import classes from "./DriverDetails.module.css";
import { useParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useSession } from "next-auth/react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import myImage from "../../../public/logo/a.png"; // Ensure this path is correct
import LineChart from "../GraphComponents/LineChart";
import { useScreenWidth } from "../hooks/useScreenWidth";

const center = {
  lat: 34.4142989,
  lng: -112.2301242,
};

export default function Driverdetails() {
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const [datas, setData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [vehicleDatas, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graph, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHourOpen, setIsHourOpen] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markerIcons, setMarkerIcons] = useState({});
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const { slug } = useParams();
  const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

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

  const { isSmallScreen: isMobileView } = useScreenWidth();

  const mapContainerStyle = {
    height: isMobileView ? "80vh" : "100%",
    width: "100%",
  };

  const [showMapOnly, setShowMapOnly] = useState(false);

  const fetchData = useCallback(
    debounce(async (slug) => {
      if (!slug) return;
      setLoading(true); // Ensure the loading state is set at the beginning

      try {
        const response = await fetch(`${BackEND}/driver/detail/${slug}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text(); // Get the response body text for more details
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 1000), // 300ms debounce delay
    [BackEND, token] // Dependencies for useCallback
  );

  useEffect(() => {
    if (slug && token) {
      fetchData(slug); // Pass slug as argument to fetchData
    }
  }, [slug, fetchData, token]); // Dependencies for useEffect

  const fetchMapData = useCallback(
    debounce(async (slug) => {
      try {
        const response = await fetch(
          `${BackEND}/driver/location/data/${slug}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const results = await response.json();
        setMapData(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 1000), // Adjust the debounce delay (300ms is just an example)
    [slug, token, BackEND]
  );

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    fetchMapData(slug);
  }, [slug, fetchMapData, token]);

  const fetchGraphData = useCallback(
    debounce(async (slug) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BackEND}/graph/chart/data/${slug}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const results = await response.json();
        setGraphData(results);
      } catch (err) {
        setIsLoading(false);
        setError(err.message);
      }
    }, 1000), // Adjust debounce delay (e.g., 300ms)
    [token, BackEND, setIsLoading] // Memoized dependencies
  );

  useEffect(() => {
    if (!slug || !token) return;
    fetchGraphData(slug);
  }, [slug, fetchGraphData, token]);

  useEffect(() => {
    if (!Array.isArray(mapData) || mapData.length === 0) return;

    const updatedVehicleData = mapData.map((datas) => {
      let rotate = null;

      switch (datas[3]) {
        case "N":
          rotate = 0;
          break;
        case "S":
          rotate = 180;
          break;
        case "W":
          rotate = 270;
          break;
        case "E":
          rotate = 90;
          break;
        default:
          rotate = null;
      }

      return {
        name: datas[0],
        lat: datas[1],
        lng: datas[2],
        rotation: rotate,
      };
    });

    setVehicleData(updatedVehicleData);
  }, [mapData]);

  useEffect(() => {
    const createRotatedIcon = async (imageUrl, rotation) => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          resolve(canvas.toDataURL());
        };
      });
    };

    const updateMarkerIcons = async () => {
      const icons = {};
      for (const vehicle of vehicleDatas) {
        const rotatedIcon = await createRotatedIcon(
          myImage.src,
          vehicle.rotation
        );
        icons[vehicle.name] = rotatedIcon;
      }
      setMarkerIcons(icons);
    };

    updateMarkerIcons();
  }, [vehicleDatas]);

  useEffect(() => {
    const handleZoom = (event) => {
      if (window.innerWidth > 2500 && (event.ctrlKey || event.metaKey)) {
        if (event.key === "-") {
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleZoom);
    return () => {
      document.removeEventListener("keydown", handleZoom);
    };
  }, []);

  const handleMapLoad = () => {
    setMapLoaded(true);
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

  // Handle loading and errors
  if (loadError) {
    console.error("Google Maps API Loader Error:", loadError);
    return <div>Error loading Google Maps API</div>;
  }

  if (loading)
    return (
      <div className="container-fluid">
        <div className="row">
          <div className={`col-4 ${classes.leftSideScroll}`}>
            <Skeleton
              height={40}
              width={200}
              style={{ marginBottom: "20px" }}
            />
            <Skeleton
              height={30}
              width={200}
              style={{ marginBottom: "20px" }}
            />
            <Skeleton
              height={20}
              width={100}
              style={{ marginBottom: "20px" }}
            />
            <Skeleton
              height={20}
              width={150}
              style={{ marginBottom: "20px" }}
            />
            <Skeleton height={150} style={{ marginBottom: "20px" }} />
            <Skeleton height={50} style={{ marginBottom: "20px" }} />
            <Skeleton height={50} style={{ marginBottom: "20px" }} />
          </div>
          <div className="col-8 overflow-hidden">
            <Skeleton height={400} />
          </div>
        </div>
      </div>
    );

  if (error) return <div>Error: {error}</div>;

  const handleToggleDetail = () => {
    setIsDetailOpen(!isDetailOpen);
  };

  const handleToggleHour = () => {
    setIsHourOpen(!isHourOpen);
  };

  const leftSide = () => {
    return (
      <div
        className={`col-6 ${isMobileView ? classes.leftSideScrolMobile : classes.leftSideScroll
          }`}
      >
        <Link
          href="/dashboard/drivers"
          className="align-items-start flex-column btn btn-outline btn-outline btn-outline-muted btn-active-light-secondary"
        >
          <i className="ki-duotone ki-left"></i> Back
        </Link>
        <h3 className="align-items-start flex-column fs-2 fw-bold text-gray-800 mt-5">
          {datas && datas[0] && datas[0].first_name}{" "}
          {datas && datas[0] && datas[0].last_name}
        </h3>
        <div className="mb-4">
          <i className="ki-duotone ki-phone align-middle fs-4">
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
          <span className="fs-7">
            {datas && datas[0] && datas[0].mobile_no}
          </span>
        </div>
        {/* <div> */}
        {/* <span className="fs-7">
            <i className="ki-duotone align-middle ki-notepad fs-4">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
              <span className="path4"></span>
              <span className="path5"></span>
            </i>
            <span className="border-bottom border-dark-subtle">
              View Driver Record
            </span>
          </span> */}
        {/* <div>
            <i className="ki-duotone align-middle ki-tablet fs-4">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
            </i>
            <span className="fs-7">Signed out from v.2420.202.12103</span>
          </div> */}
        {/* </div> */}

        <div className="separator my-5"></div>

        <div className="accordion accordion-icon-toggle">
          <div className="mb-5">
            <div
              className="accordion-header py-3 d-flex"
              data-bs-toggle="collapse"
              data-bs-target="#kt_accordion_2_item_1"
              onClick={handleToggleDetail}
            >
              <span className="">
                <i
                  className={`ki-duotone ${isDetailOpen ? "ki-up" : "ki-down"
                    } fs-5 fw-bolder`}
                ></i>
              </span>
              <h4 className="fw-bold mb-0 ms-4">Details</h4>
            </div>
            {isDetailOpen && (
              <div className="fs-7">
                <div className="d-flex justify-content-between mt-4">
                  <div>
                    <p>Driver License</p>
                  </div>
                  <div>{datas && datas[3] && datas[3].licenseNumber}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="separator my-5"></div>

        <div className="accordion accordion-icon-toggle" id="kt_accordion_2">
          <div className="mb-5">
            <div
              className="accordion-header py-3 d-flex"
              onClick={handleToggleHour}
            >
              <span className="">
                <i
                  className={`ki-duotone ${isHourOpen ? "ki-up" : "ki-down"
                    } fs-5 fw-bolder`}
                ></i>
              </span>
              <h5 className="fw-bold mb-0 ms-4">Hours of Service</h5>
            </div>
            {isHourOpen && (
              <div className="fs-7 ">
                <div
                  className={`d-flex justify-content-between mt-4 ${classes.expandDiv}`}
                >
                  <div>
                    <p>Log</p>
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/drivers/detail/${slug}/hoursOfService`}
                      className="border-bottom border-dark-subtle link-dark"
                    >
                      View log details
                    </Link>
                  </div>
                </div>
                <div className="fs-7">
                  <div className={`d-flex justify-content-around mt-4`}>
                    <div className={`${classes.chartDiv}`}>
                      {isLoading ? <LineChart params={graph} /> : ""}
                    </div>
                  </div>
                </div>
                <table>
                  <tbody>
                    {datas && datas.length > 0 && (
                      <>
                        <tr>
                          <td className="text-start fw-normal">Duty status</td>
                          <td className="text-end fw-semibold">
                            {datas[5] ? (
                              <span className="badge text-bg-dark">
                                {datas[5]}
                              </span>
                            ) : (
                              <span className="badge text-bg-dark">
                                Off duty
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-start fw-normal">
                            Time in current status
                          </td>
                          {datas[2] ? (
                            <td className="text-end fw-normal">{datas[2]}</td>
                          ) : (
                            <td className="text-end fw-normal">00:00:00</td>
                          )}
                        </tr>
                        <tr>
                          <td className="text-start fw-normal">
                            Time until break
                          </td>
                          {datas[8] ? (
                            <td className="text-end fw-normal">{datas[8]}</td>
                          ) : (
                            <td className="text-end fw-normal">08:00:00</td>
                          )}
                        </tr>
                        <tr>
                          <td className="text-start fw-normal">
                            Drive remaining
                          </td>
                          {datas[7] ? (
                            <td className="text-end fw-normal">{datas[7]}</td>
                          ) : (
                            <td className="text-end fw-normal">11:00:00</td>
                          )}
                        </tr>
                        <tr>
                          <td className="text-start fw-normal">
                            Shift remaining
                          </td>
                          {datas[8] ? (
                            <td className="text-end fw-normal">{datas[4]}</td>
                          ) : (
                            <td className="text-end fw-normal">14:00:00</td>
                          )}
                        </tr>
                        <tr>
                          <td className="text-start fw-normal">
                            Cycle remaining
                          </td>
                          {datas[8] ? (
                            <td className="text-end fw-normal">{datas[6]}</td>
                          ) : (
                            <td className="text-end fw-normal">60:00:00</td>
                          )}
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const map = (isStreetViewActive) => {

    const handleMapLoad = (map) => {
      const streetView = map.getStreetView();
      streetView.addListener("visible_changed", () => {
        setIsStreetViewActive(streetView.getVisible());
      });
    };

    return (
      <div
        className={`col-6 overflow-hidden ${isMobileView ? classes.mapDivMobile : classes.mapDiv
          }`}
      >
        {isLoaded ? ( // Ensure consistent render structure
          <GoogleMap
            onLoad={handleMapLoad}
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={5}
            options={{ mapTypeId: "hybrid", streetViewControl: true }}
          >
            {!isStreetViewActive &&
              vehicleDatas.map((vehicle) => (
                <Marker
                  key={vehicle.name}
                  position={{ lat: vehicle.lat, lng: vehicle.lng }}
                  icon={{
                    url: markerIcons[vehicle.name] || myImage.src, // Default image if not found
                    scaledSize: new window.google.maps.Size(60, 60),
                    anchor: new window.google.maps.Point(30, 30),
                  }}
                  onMouseOver={() => setHoveredMarker(vehicle.name)}
                  onMouseOut={() => setHoveredMarker(null)}
                >
                  {hoveredMarker === vehicle.name && (
                    <InfoWindow options={{ pixelOffset: new window.google.maps.Size(0, -20) }}>
                      <div className="p-2 bg-light fs-4 rounded shadow-sm">
                        <h6 className="fw-bold mb-0 fs-4">{vehicle.name}</h6>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              ))}
          </GoogleMap>
        ) : null}
      </div>
    );
  };

  return (
    <>
      {!isMobileView && (
        <div className="container-fluid" style={{ overflow: "auto" }}>
          <div className="row">
            {leftSide()}
            {map(isStreetViewActive)}
          </div>
        </div>
      )}

      {isMobileView && (
        <>
          <div className="container-fluid">
            <div className="d-flex flex-column">
              {!showMapOnly && <div>{leftSide()}</div>}
              {showMapOnly && <div>{map(isStreetViewActive)}</div>}
            </div>
          </div>

          <div className="w-100 bg-white d-flex mt-5">
            <div
              style={{
                cursor: "pointer",
                background: `${!showMapOnly ? "#3856eb" : "white"}`,
              }}
              className="w-50 d-flex justify-content-center align-items-center"
              onClick={() => setShowMapOnly(false)}
            >
              <h3
                style={{ color: `${!showMapOnly ? "white" : ""}` }}
                className="mb-0 p-5"
              >
                Driver
              </h3>
            </div>
            <div
              style={{
                cursor: "pointer",
                background: `${showMapOnly ? "#3856eb" : "white"}`,
              }}
              className="w-50 d-flex justify-content-center align-items-center mb-0"
              onClick={() => setShowMapOnly(true)}
            >
              <h3
                style={{ color: `${showMapOnly ? "white" : ""}` }}
                className="mb-0 p-5"
              >
                Map
              </h3>
            </div>
          </div>
        </>
      )}
    </>
  );
}
