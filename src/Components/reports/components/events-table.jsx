"use client";

import "../style.css";
import { DateTime } from "luxon";
import { format } from "date-fns";
import Shadow from "@/app/Shadow/page";
import { Badge } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import React, { useState, useEffect } from "react";

// Function to format dates
const formatDate = (violationEndDate) => {
  return DateTime.fromISO(violationEndDate, { zone: "utc" }).toFormat("MMM dd yyyy, h:mm a");
};

// Function to format duration
const formatDuration = (breakViolation) => {
  const [hours, minutes, seconds] = breakViolation.split(":").map(Number);
  let formattedTime = "";
  if (hours > 0) formattedTime += `${hours} hr `;
  if (minutes > 0) formattedTime += `${minutes} min `;
  if (seconds > 0) formattedTime += `${seconds} sec`;
  return formattedTime.trim();
};

const EventsTable = ({
  loading,
  Head,
  Table,
  targetRef,
  docName
}) => {

  const [time, setTime] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const timeInSaltLake = new Date().toLocaleString("en-US", {
        timeZone: "America/Denver",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      setTime(timeInSaltLake);
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  // if (!loading) {
  //   return <Shadow header={4} val={5} />;
  // }

  return (
    <div>
      <Head />
      <Table />

      {/* Hidden div containing the PDF content */}
      <div style={{ position: "absolute", top: "-10000px" }}>
        <div ref={targetRef} style={{ maxWidth: "800px" }}>
          {PdfDownload({ time, Head, Table, docName })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;

// PDF content
const PdfDownload = ({ time, Head, Table, docName }) => {

  return (
    <div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-auto">
            <img src="/logo/dw.png" alt="company logo" className="img-fluid" />
          </div>
          <div className="col text-center text-md-start">
            <h1>{docName}</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>

      <div>
        <Head />
        <Table />
      </div>
    </div>
  );
};
