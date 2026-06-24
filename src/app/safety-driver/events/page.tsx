"use client";

import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import "./style.css";
import axios from "axios";
import EventsTable from "./components/events-table";

const Events = () => {
  const [selectEventDatas, setEventDatas] = useState(null);
  const [eventTable, setEventTable] = useState(null);
  const [loading, setLoading] = useState(false);

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: `${MapKey}`,
          },
        }
      );
      const address =
        response.data.results[0]?.formatted_address || "Address not found";
      return address;
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Error fetching address";
    }
  };

  type Data = {
    GeoLocation: {
      Latitude: number;
      Longitude: number;
    };
    Address: string;
  };

  const fetchFilterData = useCallback(
    debounce(async () => {
      setLoading(false);

      try {
        const response = await axios.get(`${url}/driver/data/safety`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setEventTable(response.data.data);
          setLoading(true);
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      }
    }, 500),
    [token, url, selectEventDatas]
  );

  useEffect(() => {
    if (token) {
      fetchFilterData();
    }
  }, [token, url]);

  return (
    <>
      <EventsTable
        data={eventTable && eventTable.length > 0 ? eventTable : []}
        loading={loading}
      />
    </>
  );
};

export default Events;
