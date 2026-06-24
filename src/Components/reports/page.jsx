// Events Component
"use client";
import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import axios from "axios";
import EventsTable from "./components/events-table"; // Ensure named export
import EventsFilters from "./components/events-filters"; // Ensure named export

const Events = ({ Table, Filters, Head, dataLoad, setDateStart, setDateEnd, targetRef, setType, setTypes, setTimeNow, types, docName }) => {
  const [selectEventDatas, setEventDatas] = useState(null);
  const [filterData, setFilterData] = useState(null);
  const [loading, setLoading] = useState(false);

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const { data: session } = useSession() || {};
  const token = session?.user?.token || null;

  return (
    <>
      <EventsFilters
        types={types}
        setEventDatas={setEventDatas}
        Filters={Filters}
        dataLoad={dataLoad}
        setDateStart={setDateStart}
        setDateEnd={setDateEnd}
        setTypes={setTypes}
        setType={setType}
        setTimeNow={setTimeNow}
      />
      <EventsTable loading={loading} Head={Head} Table={Table} targetRef={targetRef} docName={docName} />
    </>
  );
};

export default Events;
