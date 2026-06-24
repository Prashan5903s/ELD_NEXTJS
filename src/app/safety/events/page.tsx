"use client";

import React, { useState, useEffect, useCallback } from "react";
import debounce from 'lodash.debounce';
import { useSession } from "next-auth/react";
import "./style.css";
import axios from "axios";
import Shadow from "@/app/Shadow/page";
import EventsTable from "./components/events-table";
import { EventsFilters } from "./components/events-filters";
import { eventTableData } from "./static-data";
import { json } from "stream/consumers";

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
        const response = await axios.get(`${url}/event/data/filter/${selectEventDatas[0]}/${selectEventDatas[1]}/${selectEventDatas[2]}/${selectEventDatas[3]}/${selectEventDatas[4]}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setFilterData(response.data);
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

  }, [token, url, selectEventDatas]);

  useEffect(() => {

    function formatDate(dateString) {
      const date = new Date(dateString);

      // Get individual date parts
      const month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero-indexed, so add 1
      const day = ("0" + date.getDate()).slice(-2);
      const year = date.getFullYear();

      // Get individual time parts
      let hours = date.getHours();
      const minutes = ("0" + date.getMinutes()).slice(-2);
      const ampm = hours >= 12 ? 'PM' : 'AM';

      // Convert 24-hour time to 12-hour format
      hours = hours % 12;
      hours = hours ? hours : 12; // If hour is 0, make it 12

      // Format the final string
      const formattedDate = `${month}/${day}/${year} ${("0" + hours).slice(-2)}:${minutes} ${ampm}`;

      return formattedDate;
    }



    if (filterData && Array.isArray(filterData)) {

      const eventTableData = filterData.map((data, index) => ({
        id: data.ids,
        preview: "https://via.placeholder.com/100",
        behavior: data?.logs?.message_reason || "No reason available",
        severity: "High",
        driver: `${data?.driver || "Unknown"}`,
        vehicle: data?.vehicle || "Unknown vehicle",
        date: `${formatDate(data?.logs?.event_date_time)}`,  // You can update this dynamically if needed
        location: ``,        // You might want to set this based on actual data
        status: "Coachable",           // If status is dynamic, adjust it accordingly
      }));

      // Now you can do something with eventTableData, such as updating state or logging it
      setEventTable(eventTableData);
      // Or set it to a state, e.g., setTableData(eventTableData);
    }
  }, [filterData, selectEventDatas]);

  return (
    <>
      <EventsFilters setEventDatas={setEventDatas} />
      <EventsTable data={(eventTable && eventTable.length > 0) ? eventTable : []} loading={loading} />
    </>
  );
};

export default Events;
