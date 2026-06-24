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
  const [timeNow, setTimeNow] = useState();
  const [types, setTypes] = useState(false);
  const [type, setType] = useState();
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

  const fetchFilterData = useCallback(
    debounce(async () => {

      setLoading(false);

      setFilterData(null);

      try {
        const response = await axios.get(`${url}/mileage/data/${selectEventDatas[0]}/${selectEventDatas[1]}/${selectEventDatas[3]}/${selectEventDatas[2]}/${selectEventDatas[4]}`, {
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

  return (
    <>
      <EventsFilters setEventDatas={setEventDatas} setType={setType} setTimeNow={setTimeNow} setTypes={setTypes} types={types} />
      <EventsTable data={(filterData && filterData.length > 0) ? filterData : []} loading={loading} type={type} timeNow={timeNow} types={types} setTypes={setTypes} />
    </>
  );
};

export default Events;
