"use client";

import "../style.css";
import axios from "axios";
import { format } from "date-fns";
import Shadow from "@/app/Shadow/page";
import { DateTime } from 'luxon';
import { Badge } from "react-bootstrap";
import { usePDF } from "react-to-pdf";
import React, { useRef, useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { duration } from "@mui/material";

const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

// Types for the data and violations
type Violation = {
  violation: string;
  start: string;
  end: string;
  duration: string;
};

type DriverData = {
  first_name: string;
  last_name: string;
  shift_data: Violation[];
  cycle_data: Violation[];
};

type Props = DriverData[][]; // Assuming data structure is an array of arrays

// Function to format dates
const formatDate = (violationEndDate: string) => {
  const date = new Date(violationEndDate);
  return format(date, "MMM dd yyyy, h:mm a");
};

// Function to format duration
const formatDuration = (breakViolation: string) => {
  const [hours, minutes, seconds] = breakViolation.split(":").map(Number);
  let formattedTime = "";
  if (hours > 0) formattedTime += `${hours} hr `;
  if (minutes > 0) formattedTime += `${minutes} min `;
  if (seconds > 0) formattedTime += `${seconds} sec`;
  return formattedTime.trim();
};

const EventsTable = ({
  data,
  loading,
  type,
  timeNow,
  types,
  setTypes,
}: {
  data: any; // Adjusted data type for demonstration
  loading: boolean;
  type: string;
  timeNow: any;
  types: boolean;
  setTypes: (flag: boolean) => void;
}) => {

  const [defectLog, setDefectLog] = useState(0);
  const [inspectLog, setInspectLog] = useState(0);

  useEffect(() => {
    if (data) {

      let totalDefects = 0;
      let totalInspections = 0;

      Object.keys(data).forEach((key) => {
        totalInspections += data[key][1];
        totalDefects += data[key][1];
      });

      setInspectLog(totalInspections);
      setDefectLog(totalDefects);
    }
  }, [data]);

  const convertToHMS = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds == null || totalSeconds == undefined) return "0";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format the result to ensure two digits for minutes and seconds
    const formattedHours = String(hours).padStart(1, '0');
    const formattedMinutes = String(minutes).padStart(1, '0');
    const formattedSeconds = String(seconds).padStart(1, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const { toPDF, targetRef } = usePDF({
    method: "save",
    filename: "driver_safety_score_report.pdf",
    page: { margin: 10 },
  });

  const handleDownload = async () => {
    await toPDF();
  };

  useEffect(() => {
    if (type && timeNow && types) {
      if (type === "pdf") {
        handleDownload();
        setTypes(false);
      } else {
        downloadCSV(data);
        setTypes(false);
      }
    }
  }, [type, timeNow, types]);

  if (!loading) {
    return <Shadow header={4} val={5} />;
  }

  const formatTime = (timeString) => {
    // Parse as an ISO string
    const date = DateTime.fromISO(timeString, { zone: "utc" });

    // Check if the date is valid
    if (!date.isValid) {
      console.error("Invalid date format");
      return "0";
    }

    // Format the date into the desired format
    return date.toFormat("MM/dd/yyyy hh:mm a");
  };

  const downloadCSV = (data, filename = "driver_safety_score_report.csv") => {
    const headers = [
      "Driver",
      "Inspection Date \ Time",
      "Miles driven",
      "Safety score",
      "Performance brand",
      "Total acceleration",
      "Acceleration 1K / mi",
      "Acceleration points",
      "Acceleration impact",
      "Total braking",
      "Braking 1K / mi",
      "Braking points",
      "Braking impact",
      "Total hard turn",
      "Hard turn 1K / mi",
      "Hard turn points",
      "Hard turn impact",
      "Total hard stop",
      "Hard stop 1K / mi",
      "Hard stop points",
      "Hard stop impact",
      "Total speeding",
      "Speeding 1K / mi",
      "Speeding points",
      "Speeding impact",
    ];

    const rows = data.map((value) => [
      value.name,
      formatTime(value.startTime) + " - " + formatTime(value.endTime),
      (value.total_mile).toFixed(1),
      (value.safety_score).toFixed(1),
      value.performance,
      value.hard_accel_count,
      value.ha_event_per_mile == 0 ? 0 : (value.ha_event_per_mile).toFixed(1),
      value.max_hard_accel_point,
      value.hard_accel_impact,
      value.hard_brake_count,
      value.hb_event_per_mile == 0 ? 0 : (value.hb_event_per_mile).toFixed(3),
      value.max_hard_brake_point,
      value.hard_brake_impact,
      value.hard_turn_count,
      value.ht_event_per_mile == 0 ? 0 : (value.ht_event_per_mile).toFixed(3),
      value.max_hard_turn_point,
      value.hard_turn_impact,
      value.hard_stop_count,
      value.hs_event_per_mile == 0 ? 0 : (value.hs_event_per_mile).toFixed(3),
      value.max_hard_stop_point,
      value.hard_stop_impact,
      value.speeding_count,
      value.speed_event_per_mile == 0 ? 0 : (value.speed_event_per_mile).toFixed(3),
      value.max_speed_point,
      value.speeding_impact,
    ].join(","));

    const csvContent = `${headers.join(",")}\n${rows.join("\n")}`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="table-responsive">
        <table className="border table-striped table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>Driver</th>
              <th>Inspection Date \ Time</th>
              <th>Miles driven</th>
              <th>Safety score</th>
              <th>Performance brand</th>
              <th>Total acceleration</th>
              <th>Acceleration 1K / mi</th>
              <th>Acceleration Points Available</th>
              <th>Acceleration Points Earned</th>
              <th>Acceleration impact</th>
              <th>Total braking</th>
              <th>Braking 1K / mi</th>
              <th>Braking points Available</th>
              <th>Braking points Earned</th>
              <th>Braking impact</th>
              <th>Total hard turn</th>
              <th>Hard turn 1K / mi</th>
              <th>Hard turn points Available</th>
              <th>Hard turn points Earned</th>
              <th>Hard turn impact</th>
              <th>Total hard stop</th>
              <th>Hard stop 1K / mi</th>
              <th>Hard stop points Available</th>
              <th>Hard stop points Earned</th>
              <th>Hard stop impact</th>
              <th>Total speeding</th>
              <th>Speeding 1K / mi</th>
              <th>Speeding points Available</th>
              <th>Speeding points Earned</th>
              <th>Speeding impact</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ?
              (
                data.map((value, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td>{value.name}</td>
                      <td>{formatTime(value.startTime) + " - " + formatTime(value.endTime)}</td>
                      <td>{(value.total_mile).toFixed(1)}</td>
                      <td>{(value.safety_score).toFixed(1)}</td>
                      <td>{value.performance}</td>
                      <td>{value.hard_accel_count}</td>
                      <td>{value.ha_event_per_mile == 0 ? 0 : (value.ha_event_per_mile).toFixed(1)}</td>
                      <td>{value.max_hard_accel_point}</td>
                      <td>{value.max_hard_accel_point - value.hard_accel_impact}</td>
                      <td>{value.hard_accel_impact}</td>
                      <td>{value.hard_brake_count}</td>
                      <td>{value.hb_event_per_mile == 0 ? 0 : (value.hb_event_per_mile).toFixed(3)}</td>
                      <td>{value.max_hard_brake_point}</td>
                      <td>{value.max_hard_brake_point - value.hard_brake_impact}</td>
                      <td>{value.hard_brake_impact}</td>
                      <td>{value.hard_turn_count}</td>
                      <td>{value.ht_event_per_mile == 0 ? 0 : (value.ht_event_per_mile).toFixed(3)}</td>
                      <td>{value.max_hard_turn_point}</td>
                      <td>{value.max_hard_turn_point - value.hard_turn_impact} </td>
                      <td>{value.hard_turn_impact}</td>
                      <td>{value.hard_stop_count}</td>
                      <td>{value.hs_event_per_mile == 0 ? 0 : (value.hs_event_per_mile).toFixed(3)}</td>
                      <td>{value.max_hard_stop_point}</td>
                      <td>{value.max_hard_stop_point - value.hard_stop_impact}</td>
                      <td>{value.hard_stop_impact}</td>
                      <td>{value.speeding_count}</td>
                      <td>{value.speed_event_per_mile == 0 ? 0 : (value.speed_event_per_mile).toFixed(3)}</td>
                      <td>{value.max_speed_point}</td>
                      <td>{value.max_speed_point - value.speeding_impact}</td>
                      <td>{value.speeding_impact}</td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={25} className="text-center">
                    No data available.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      <div style={{ position: "absolute", top: "-10000px" }}>
        <div ref={targetRef} style={{ maxWidth: "800px" }}>
          {PdfDownload({ data, time: timeNow, inspectLog, defectLog })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;

// PDF content
const PdfDownload = ({ data, time, inspectLog, defectLog }: { data: any; time: any; inspectLog: any; defectLog: any; }) => {

  const roundNumber = (numb: any) => {
    if (numb === 0) return 0;  // Check for zero before proceeding

    const number = typeof numb === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(numb)
      : !isNaN(Number(numb))
        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(numb))
        : 'Invalid input';

    return number;
  };

  const formatTime = (timeString) => {
    // Parse as an ISO string
    const date = DateTime.fromISO(timeString, { zone: "utc" });

    // Check if the date is valid
    if (!date.isValid) {
      console.error("Invalid date format");
      return "0";
    }

    // Format the date into the desired format
    return date.toFormat("MM/dd/yyyy hh:mm a");
  };

  return (
    <div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-auto">
            <img src="/logo/dw.png" alt="company logo" className="img-fluid" />
          </div>
          <div className="col text-center text-md-start">
            <h1>Driver safety score report</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>

      <div>
        <div className="table-responsive">
          <table className="border table-striped table-bordered table-hover table-sm">
            <thead className="thead-light">
              <tr>
                <th>Driver</th>
                <th>Inspection Date \ Time</th>
                <th>Miles driven</th>
                <th>Safety score</th>
                <th>Performance brand</th>
                <th>Total acceleration</th>
                <th>Acceleration 1K / mi</th>
                <th>Acceleration Points Available</th>
                <th>Acceleration Points Earned</th>
                <th>Acceleration impact</th>
                <th>Total braking</th>
                <th>Braking 1K / mi</th>
                <th>Braking points Available</th>
                <th>Braking points Earned</th>
                <th>Braking impact</th>
                <th>Total hard turn</th>
                <th>Hard turn 1K / mi</th>
                <th>Hard turn points Available</th>
                <th>Hard turn points Earned</th>
                <th>Hard turn impact</th>
                <th>Total hard stop</th>
                <th>Hard stop 1K / mi</th>
                <th>Hard stop points Available</th>
                <th>Hard stop points Earned</th>
                <th>Hard stop impact</th>
                <th>Total speeding</th>
                <th>Speeding 1K / mi</th>
                <th>Speeding points Available</th>
                <th>Speeding points Earned</th>
                <th>Speeding impact</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ?
                (
                  data.map((value, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td>{value.name}</td>
                        <td>{formatTime(value.startTime) + " - " + formatTime(value.endTime)}</td>
                        <td>{(value.total_mile).toFixed(1)}</td>
                        <td>{(value.safety_score).toFixed(1)}</td>
                        <td>{value.performance}</td>
                        <td>{value.hard_accel_count}</td>
                        <td>{value.ha_event_per_mile == 0 ? 0 : (value.ha_event_per_mile).toFixed(1)}</td>
                        <td>{value.max_hard_accel_point}</td>
                        <td>{value.max_hard_accel_point - value.hard_accel_impact}</td>
                        <td>{value.hard_accel_impact}</td>
                        <td>{value.hard_brake_count}</td>
                        <td>{value.hb_event_per_mile == 0 ? 0 : (value.hb_event_per_mile).toFixed(3)}</td>
                        <td>{value.max_hard_brake_point}</td>
                        <td>{value.max_hard_brake_point - value.hard_brake_impact}</td>
                        <td>{value.hard_brake_impact}</td>
                        <td>{value.hard_turn_count}</td>
                        <td>{value.ht_event_per_mile == 0 ? 0 : (value.ht_event_per_mile).toFixed(3)}</td>
                        <td>{value.max_hard_turn_point}</td>
                        <td>{value.max_hard_turn_point - value.hard_turn_impact} </td>
                        <td>{value.hard_turn_impact}</td>
                        <td>{value.hard_stop_count}</td>
                        <td>{value.hs_event_per_mile == 0 ? 0 : (value.hs_event_per_mile).toFixed(3)}</td>
                        <td>{value.max_hard_stop_point}</td>
                        <td>{value.max_hard_stop_point - value.hard_stop_impact}</td>
                        <td>{value.hard_stop_impact}</td>
                        <td>{value.speeding_count}</td>
                        <td>{value.speed_event_per_mile == 0 ? 0 : (value.speed_event_per_mile).toFixed(3)}</td>
                        <td>{value.max_speed_point}</td>
                        <td>{value.max_speed_point - value.speeding_impact}</td>
                        <td>{value.speeding_impact}</td>
                      </tr>
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={25} className="text-center">
                      No data available.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
