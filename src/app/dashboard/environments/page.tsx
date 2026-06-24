"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import TruckWithTemprature from "./TruckWithTemprature";
import classes from "./TruckWithTemprature/TruckWithTemprature.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import { debounce } from "lodash";
import { useJsApiLoader } from "@react-google-maps/api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const Page = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envs, setEnvs] = useState(null);
  const [envData, setEnvData] = useState([]);

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

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

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

  const fetchUsers = useCallback(
    debounce(async () => {
      setLoading(true);
      try {
        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await axios.get(`${url}/assets/enviornment`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setEnvs(response.data);
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }, 1000),
    [url, token]
  );

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [fetchUsers, token]);

  useEffect(() => {
    if (envs) {
      const processEnvData = async () => {
        const envDataPromises = envs.map(async (data) => {
          const fuel = data && data[0] && data[0].obd_fuel;
          const mesFuel = (fuel * 9) / 5 + 32;
          if (data && data[0] && data[0]?.location) {
            var loctn = JSON.parse(data && data[0] && data[0]?.location);
          }

          // Extract latitude and longitude
          const latitude = loctn?.GeoLocation?.Latitude;
          const longitude = loctn?.GeoLocation?.Longitude;

          let address = "Unknown Location";
          if (latitude && longitude) {
            try {
              address = await fetchAddressFromCoordinates(
                latitude,
                longitude,
                MapKey
              );
            } catch (error) {
              console.error("Error fetching address:", error);
            }
          }

          return {
            address: address, // or you can specify a specific property for address if needed
            temperature: `${mesFuel}°F`,
            name: data[1],
          };
        });

        const resolvedEnvData = await Promise.all(envDataPromises);
        setEnvData(resolvedEnvData);
      };

      processEnvData();
    }
  }, [envs, MapKey]);

  async function fetchAddressFromCoordinates(latitude, longitude, apiKey) {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch the address");
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error("Geocoding API returned an error");
    }

    // Extract the formatted address from the API response
    const address = data.results[0]?.formatted_address || "Unknown Location";

    return address;
  }

  useEffect(() => {
    if (envs && envData) {
      setLoading(false);
    }
  }, [envs, envData]);

  if (loading) {
    return (
      <div>
        <h2>Environments</h2>
        <p style={{ marginBottom: "40px", color: "gray", cursor: "pointer" }}>
          <span onClick={() => router.push("/")}>Home - </span>
          <span style={{ cursor: "default" }}>Environments</span>
        </p>
        <div className={classes.wrapper}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={classes.truckContainer}>
              <div style={{ position: "relative", alignSelf: "center" }}>
                <Skeleton width={200} height={300} />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "50%",
                    transform: "translate(37%, -50%)",
                    fontSize: "14px",
                    marginLeft: "-6px",
                  }}
                >
                  {/* Optional nested skeleton */}
                </div>
              </div>
              <div className="d-flex flex-column">
                <div
                  className={classes.truckName}
                  style={{ marginTop: "20px" }}
                >
                  <Skeleton width={80} height={15} />
                </div>
                <div className={classes.address}>
                  <p
                    style={{ margin: 0, fontSize: "14px", textAlign: "center" }}
                  >
                    <Skeleton width={"100%"} height={15} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Environments</h2>
      <p style={{ marginBottom: "40px", color: "gray", cursor: "pointer" }}>
        <span onClick={() => router.push("/")}>Home - </span>
        <span style={{ cursor: "default" }}>Environments</span>
      </p>
      <div className={classes.wrapper}>
        {envData.map((data) => {
          return (
            <TruckWithTemprature
              key={data.temperature}
              address={data.address}
              temprature={data.temperature}
              name={data.name}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Page;
