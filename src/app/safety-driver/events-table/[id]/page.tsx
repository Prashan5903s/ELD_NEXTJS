"use client";

import React, { useState, useEffect, useCallback } from "react";
import debounce from 'lodash.debounce';
import { useSession } from "next-auth/react";
import "./style.css";
import axios from "axios";
import Shadow from "@/app/Shadow/page";
import EventsTable from "./components/events-table";
import { useParams } from "next/navigation";

const Events = () => {

  const [selectEventDatas, setEventDatas] = useState(null);
  const [filterData, setFilterData] = useState(null);
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

  const param = useParams();

  const eventType = param?.id;

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: `${MapKey}`,
        },
      });
      const address = response.data.results[0]?.formatted_address || "Address not found";
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

  const LocationCell = ({ info }) => {
    const [address, setAddress] = useState(null);
    const locationData = info.getValue();

    let vehData: Data = {} as Data;

    try {
      vehData = JSON.parse(locationData);
    } catch (error) {
      console.error("Invalid JSON data:", error);
    }

    useEffect(() => {
      const fetchAndSetAddress = async () => {
        if (vehData?.GeoLocation?.Latitude && vehData?.GeoLocation?.Longitude) {
          try {
            const fetchedAddress = await fetchAddress(vehData.GeoLocation.Latitude, vehData.GeoLocation.Longitude);
            setAddress(fetchedAddress);
          } catch (error) {
            console.error("Error fetching address:", error);
          }
        }
      };

      fetchAndSetAddress();
    }, [vehData]);

    return (
      <div>
        {vehData && Object.keys(vehData).length > 0 ? (
          <div>
            {address || vehData.Address || "...."}
          </div>
        ) : (
          "..."
        )}
      </div>
    );
  };

  const fetchFilterData = useCallback(
    debounce(async () => {

      setLoading(false);

      try {
        const response = await axios.get(`${url}/driver/safety/event/detail/${eventType}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setFilterData(response.data.data);
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
      <EventsTable data={(eventTable && eventTable.length > 0) ? eventTable : []} loading={loading} />
    </>
  );
};

export default Events;
