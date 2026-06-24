"use client";

import "../style.css";
import axios from "axios";
import { DateTime } from "luxon";
import { format } from "date-fns";
import { Tooltip } from "react-tooltip";
import { usePDF } from "react-to-pdf";
import Shadow from "@/app/Shadow/page";
import { Badge } from "react-bootstrap";
import 'react-tooltip/dist/react-tooltip.css'
import Skeleton from "react-loading-skeleton";
import React, { useRef, useState, useEffect } from "react";

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
  const [address, setAddress] = useState<{ [key: number]: string }>({});
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

  const datas =
    data && Object.keys(data).length > 0
      ? Object.keys(data).map((item) => ({
        name: `${item}`,
        idlingData: [
          {
            vName: `${data[item]["vehicleName"]}`,
            avg_mpg: data[item]["avg_mpg"],
            avg_idle_mpg: data[item]["avg_idle_mpg"],
            avg_motion_mpg: data[item]["avg_motion_mpg"],
            avg_fuel_percent: data[item]["avg_fuel_percent"],
            avg_speed: data[item]["avg_speed"],
            avg_idle_fuel: data[item]["avg_idle_fuel"],
            rpm_percent: data[item]["rpm_percent"],
            percent_motion_fuel: data[item]["percent_motion_fuel"],
            utilization_time: data[item]["utilization_time"],
            total_idle_time: data[item]["total_idle_time"],
            total_motion_time: data[item]["total_motion_time"],
            rpm_percentage: data[item]["rpm_percent"],
            total_distance: data[item]["total_distance"],
            ha_event_per_miles: data[item]["ha_event_per_miles"],
            hb_event_per_miles: data[item]["hb_event_per_miles"],
            hu_event_per_miles: data[item]["hu_event_per_miles"],
          },
        ],
      }))
      : [];

  const { toPDF, targetRef } = usePDF({
    method: "save",
    filename: "fuel_performance_report.pdf",
    page: {
      margin: 10,
      orientation: 'landscape',
    },
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
        downloadCSV(datas);
        setTypes(false);
      }
    }
  }, [type, timeNow, types]);

  if (!loading) {
    return <Shadow header={4} val={5} />;
  }

  const formatTime = (timeString: string) => {
    const date = DateTime.fromFormat(timeString, "yyyy-MM-dd HH:mm:ss");
    if (!date.isValid) {
      console.error("Invalid date format");
      return "0";
    }
    return date.toFormat("MM/dd/yyyy hh:mm a");
  };

  const downloadCSV = (data: any, filename = "fuel_performance_report.csv") => {
    const headers = [
      "Driver",
      "Vehicle driven",
      "Avg MPG",
      "Motion MPG",
      "Total distance(mi)",
      "Avg fuel percentage",
      "Utilization time %",
      "Avg driving time",
      "Driving fuel %",
      "Idling time",
      "Idle fuel %",
      "Over RPM %",
      "Avg speed",
      "Hard acceleration",
      "Hard braking",
      "Hard cornering"
    ];

    const rows = data
      .map((vehicle: any) =>
        vehicle.idlingData
          .map((idlingItem: any) => [
            vehicle.name,
            idlingItem.vName,
            idlingItem.avg_mpg,
            idlingItem.avg_motion_mpg,
            idlingItem.total_distance,
            idlingItem.avg_fuel_percent,
            idlingItem.utilization_time,
            convertToHMS(idlingItem.total_motion_time),
            idlingItem.percent_motion_fuel,
            convertToHMS(idlingItem.total_idle_time),
            idlingItem.avg_idle_fuel,
            idlingItem.rpm_percentage,
            idlingItem.avg_speed,
            idlingItem.ha_event_per_miles,
            idlingItem.hb_event_per_miles,
            idlingItem.hu_event_per_miles
          ].join(","))
          .join("\n")
      )
      .join("\n");

    const csvContent = `${headers.join(",")}\n${rows}`;

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

  const convertToHMS = (totalMinutes) => {
    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes == null) return "0";

    // Extract the integer and fractional parts of the total minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.round((totalMinutes % 1) * 60); // Convert fractional part to seconds

    let result = [];

    if (hours > 0) result.push(`${hours} hours`);
    if (minutes > 0) result.push(`${minutes} minutes`);
    if (seconds > 0) result.push(`${seconds} seconds`);

    return result.join(' ');
  };

  return (
    <div>
      <div className="table-responsive">
        <table className="border table-striped table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>Driver</th>
              <th>Vehicle driven</th>
              <th>Avg MPG<i data-tooltip-id="avg-mpg-tooltip" data-tooltip-content="Average MPG (miles per gallon) (driving + idling)" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="avg-mpg-tooltip" /></th>
              <th>Avg Motion MPG<i data-tooltip-id="motion-mpg-tooltip" data-tooltip-content="Fuel economy while vehicle was in motion (speed > 5mph)" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="motion-mpg-tooltip" /></th>
              <th>Total distance (mi)<i data-tooltip-id="total-distance-tooltip" data-tooltip-content="Distance driven across all vehicles" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="total-distance-tooltip" /></th>
              <th>Avg fuel percentage<i data-tooltip-id="avg-fuel-percent-tooltip" data-tooltip-content="Fuel consumed by all vehicles driven" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="avg-fuel-percent-tooltip" /></th>
              <th>Utilization time %<i data-tooltip-id="utilization-time-tooltip" data-tooltip-content="% of time vehicle is driving over 5mph" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="utilization-time-tooltip" /></th>
              <th>Avg driving time<i data-tooltip-id="avg-driving-time-tooltip" data-tooltip-content="Time spent driving over 5mph." className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="avg-driving-time-tooltip" /></th>
              <th>Avg Driving fuel %<i data-tooltip-id="driving-fuel-tooltip" data-tooltip-content="Fuel consumed while driving over 5mph." className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="driving-fuel-tooltip" /></th>
              <th>Idling time<i data-tooltip-id="idling-time-tooltip" data-tooltip-content="Time spent idling (speed < 5mph)" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="idling-time-tooltip" /></th>
              <th>Avg Idle fuel %<i data-tooltip-id="idle-fuel-tooltip" data-tooltip-content="Fuel consumed while idling (speed < 5mph)" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="idle-fuel-tooltip" /></th>
              <th>Over RPM %<i data-tooltip-id="over-rpm-tooltip" data-tooltip-content="Percentage of time RPM exceeds 1700" className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="over-rpm-tooltip" /></th>
              <th>Avg speed</th>
              <th>Hard acceleration<i data-tooltip-id="hard-accel-tooltip" data-tooltip-content="Total hard acceleration events per 1,000 miles." className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="hard-accel-tooltip" /></th>
              <th>Hard braking<i data-tooltip-id="hard-brake-tooltip" data-tooltip-content="Total hard braking events per 1,000 miles." className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="hard-brake-tooltip" /></th>
              <th>Hard cornering<i data-tooltip-id="hard-cornering-tooltip" data-tooltip-content="Total hard cornering events per 1,000 miles." className="ms-2 ki-information-2 ki-outline"></i><Tooltip id="hard-cornering-tooltip" /></th>
            </tr>
          </thead>
          <tbody>
            {datas.length > 0 ? (
              datas.every(
                (idlingData) => idlingData.idlingData.length === 0
              ) ? (
                <tr className="text-center text-muted">
                  <td colSpan={16} className="text-center text-muted">
                    No data available
                  </td>
                </tr>
              ) : (
                datas.map((idlingData, idlingDataIndex) => (
                  <React.Fragment key={idlingDataIndex}>
                    {idlingData.idlingData.map((idling, idlingIndex) => (
                      <tr key={idlingIndex}>
                        {idlingIndex === 0 && (
                          <td
                            rowSpan={idlingData.idlingData.length}
                            className="align-middle font-weight-bold"
                          >
                            {idlingData.name}
                          </td>
                        )}
                        <td>{idling.vName}</td>
                        <td>{Math.round(idling.avg_mpg * 100) / 100}</td>
                        <td>
                          {Math.round(idling.avg_motion_mpg * 100) / 100}
                        </td>
                        <td>
                          {Math.round(idling.total_distance * 100) / 100}
                        </td>
                        <td>
                          {Math.round(idling.avg_fuel_percent * 100) / 100}
                        </td>
                        <td>
                          {Math.round(idling.utilization_time * 100) / 100}
                        </td>
                        <td>{convertToHMS(idling.total_motion_time)}</td>
                        <td>
                          {Math.round(idling.percent_motion_fuel * 100) / 100}
                        </td>
                        <td>{convertToHMS(idling.total_idle_time)}</td>
                        <td>
                          {Math.round(idling.avg_idle_fuel * 100) / 100}
                        </td>
                        <td>
                          {Math.round(idling.rpm_percent * 100) / 100}
                        </td>
                        <td>{Math.round(idling.avg_speed * 100) / 100}</td>
                        <td>
                          {Math.round(idling.ha_event_per_miles * 100) / 100}
                        </td>
                        <td>
                          {Math.round(idling.hb_event_per_miles * 100) / 100}
                        </td>
                        <td>
                          {Math.round(idling.hu_event_per_miles * 100) / 100}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )
            ) : (
              <tr className="text-center text-muted">
                <td colSpan={16} className="text-center text-muted">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ position: "absolute", top: "-10000px" }}>
        <div ref={targetRef} style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '100%', maxWidth: "1350px" }}>
          {PdfDownload({ datas, time })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;


// PDF content
const PdfDownload = ({ datas, time }: { datas: any; time: any; }) => {

  const roundNumber = (numb: any) => {
    if (numb === 0) return 0;  // Check for zero before proceeding

    const number = typeof numb === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numb)
      : !isNaN(Number(numb))
        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(numb))
        : 'Invalid input';

    return number;
  };

  const convertToHMS = (totalMinutes) => {
    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes == null) return "0";

    // Extract the integer and fractional parts of the total minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.round((totalMinutes % 1) * 60); // Convert fractional part to seconds

    let result = [];

    if (hours > 0) result.push(`${hours} hours`);
    if (minutes > 0) result.push(`${minutes} minutes`);
    if (seconds > 0) result.push(`${seconds} seconds`);

    return result.join(' ');
  };

  const formatTime = (timeString) => {
    // Parse the string using its custom format
    const date = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss');

    // Check if the date is valid
    if (!date.isValid) {
      console.error('Invalid date format');
      return null;
    }

    // Format the date into the desired format
    return date.toFormat('MM/dd/yyyy hh:mm a');
  };

  return (
    <div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-auto">
            <img src="/logo/dw.png" alt="company logo" className="img-fluid" />
          </div>
          <div className="col text-center text-md-start">
            <h1>Fuel performance report</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>
      <div>
        <div>
          <div className="table-responsive">
            <table className="border table-striped table-bordered table-hover table-sm">
              <thead className="thead-light">
                <tr>
                  <th>Driver</th>
                  <th>Vehicle driven</th>
                  <th>Avg MPG</th>
                  <th>Avg Motion MPG</th>
                  <th>Total distance (mi)</th>
                  <th>Avg fuel percentage</th>
                  <th>Utilization time %</th>
                  <th>Avg driving time</th>
                  <th>Avg Driving fuel %</th>
                  <th>Idling time</th>
                  <th>Avg Idle fuel %</th>
                  <th>Over RPM %</th>
                  <th>Avg speed</th>
                  <th>Hard acceleration</th>
                  <th>Hard braking</th>
                  <th>Hard cornering</th>
                </tr>
              </thead>
              <tbody>
                {datas.length > 0 ? (
                  datas.every(
                    (idlingData) => idlingData.idlingData.length === 0
                  ) ? (
                    <tr className="text-center text-muted">
                      <td colSpan={16} className="text-center text-muted">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    datas.map((idlingData, idlingDataIndex) => (
                      <React.Fragment key={idlingDataIndex}>
                        {idlingData.idlingData.map((idling, idlingIndex) => (
                          <tr key={idlingIndex}>
                            {idlingIndex === 0 && (
                              <td
                                rowSpan={idlingData.idlingData.length}
                                className="align-middle font-weight-bold"
                              >
                                {idlingData.name}
                              </td>
                            )}
                            <td>{idling.vName}</td>
                            <td>{Math.round(idling.avg_mpg * 100) / 100}</td>
                            <td>
                              {Math.round(idling.avg_motion_mpg * 100) / 100}
                            </td>
                            <td>
                              {Math.round(idling.total_distance * 100) / 100}
                            </td>
                            <td>
                              {Math.round(idling.avg_fuel_percent * 100) / 100}
                            </td>
                            <td>
                              {Math.round(idling.utilization_time * 100) / 100}
                            </td>
                            <td>{convertToHMS(idling.total_motion_time)}</td>
                            <td>
                              {Math.round(idling.percent_motion_fuel * 100) / 100}
                            </td>
                            <td>{convertToHMS(idling.total_idle_time)}</td>
                            <td>
                              {Math.round(idling.avg_idle_fuel * 100) / 100}
                            </td>
                            <td>
                              {Math.round(idling.rpm_percent * 100) / 100}
                            </td>
                            <td>{Math.round(idling.avg_speed * 100) / 100}</td>
                            <td>
                              {Math.round(idling.ha_event_per_miles * 100) / 100}
                            </td>
                            <td>
                              {Math.round(idling.hb_event_per_miles * 100) / 100}
                            </td>
                            <td>
                              {Math.round(idling.hu_event_per_miles * 100) / 100}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )
                ) : (
                  <tr className="text-center text-muted">
                    <td colSpan={16} className="text-center text-muted">
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
