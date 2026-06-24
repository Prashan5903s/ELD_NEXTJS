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
        totalDefects += data[key][2];
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
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const datas =
    data && Object.keys(data).length > 0
      ? Object.keys(data).map((item) => ({
        name: `${item}`,
        idlingData: [
          ...data[item][0].map((dataItem) => ({
            vehicle: `${dataItem['vehicle']}`,
            duration: `${convertToHMS(dataItem['duration'])}`,
            startTime: `${dataItem['inspection_time']}`,
            odometer: `${dataItem['odometer']}`,
            open: `${dataItem['open']}`,
            resolve: `${dataItem['resolve']}`,
            status: `${dataItem['status']}`,
          })),
        ],
      }))
      : [];

  const { toPDF, targetRef } = usePDF({
    method: "save",
    filename: "idling_report.pdf",
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
        downloadCSV(datas);
        setTypes(false);
      }
    }
  }, [type, timeNow, types]);

  if (!loading) {
    return <Shadow header={4} val={5} />;
  }

  const formatTime = (timeString) => {

    // Parse the string using its custom format
    const date = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss');

    // Check if the date is valid
    if (!date.isValid) {
      console.error('Invalid date format');
      return "0";
    }

    // Format the date into the desired format
    return date.toFormat('MM/dd/yyyy hh:mm a');
  };

  const downloadCSV = (data: any, filename = "inspection_report.csv") => {
    const headers = [
      "Driver",
      "Inspection Date \\ Time",
      "Vehicle",
      "Open defects",
      "Resolved defects",
      "Inspection Duration",
      "Odometer",
      "Status",
    ];

    // Generate CSV rows
    const rows = data
      .map((dataItem: any) =>
        dataItem.idlingData.map((value: any) =>
          [
            dataItem.name,               // Driver name
            formatTime(value.startTime), // Inspection Date \ Time
            value.vehicle,               // Vehicle name
            value.open,                  // Open defects
            value.resolve,               // Resolved defects
            (value.duration),              // Inspection Duration
            value.odometer,              // Odometer
            value.status,                // Status
          ].join(",")
        )
      )
      .flat(); // Flatten the nested array

    // Combine headers and rows into CSV content
    const csvContent = `${headers.join(",")}\n${rows.join("\n")}`;

    // Create a Blob and trigger the download
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
      <div className="border border-2 rounded mt-5">
        <div style={{ flexWrap: "wrap" }} className="d-flex justify-content-around">
          <div className="p-5 d-flex flex-column align-item-center justify-content-center">
            <div className="fs-5 fw-semibold text-center">
              {inspectLog}
            </div>
            <div>
              <p>Total Inspection Report</p>
            </div>
          </div>
          <div className="p-5 d-flex flex-column align-item-center justify-content-center">
            <div className="fs-5 fw-semibold text-center">
              {defectLog}
            </div>
            <div>
              <p>Inspection reports with defect</p>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="border table-striped table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>Driver</th>
              <th>Inspection Date \ Time</th>
              <th>Vehicle</th>
              <th>Open defects</th>
              <th>Resolved defects</th>
              <th>Inspection Duration</th>
              <th>Odometer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {datas.length > 0 ?
              datas.every(
                (idlingData) => idlingData.idlingData.length === 0
              ) ? (
                <tr className="text-center text-muted">
                  <td colSpan={8} className="text-center text-muted">
                    No data available
                  </td>
                </tr>
              )
                :
                (
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
                          <td>
                            {formatTime(idling.startTime)}
                          </td>
                          <td>{(idling.vehicle)}</td>
                          <td>{idling.open}</td>
                          <td>{idling.resolve}</td>
                          <td>{idling.duration}</td>
                          <td>{(idling.odometer)}</td>
                          <td>{(idling.status)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                <tr>
                  <td colSpan={8} className="text-center">
                    No data available.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      <div style={{ position: "absolute", top: "-10000px" }}>
        <div ref={targetRef} style={{ maxWidth: "800px" }}>
          {PdfDownload({ datas, time: timeNow, inspectLog, defectLog })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;

// PDF content
const PdfDownload = ({ datas, time, inspectLog, defectLog }: { datas: any; time: any; inspectLog: any; defectLog: any; }) => {

  const roundNumber = (numb: any) => {
    if (numb === 0) return 0;  // Check for zero before proceeding

    const number = typeof numb === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numb)
      : !isNaN(Number(numb))
        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(numb))
        : 'Invalid input';

    return number;
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
            <h1>Inspection report</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>

      <div>
        <div className="border border-2 rounded mt-5">
          <div style={{ flexWrap: "wrap" }} className="d-flex justify-content-around">
            <div className="p-5 d-flex flex-column align-item-center justify-content-center">
              <div className="fs-5 fw-semibold text-center">
                {inspectLog}
              </div>
              <div>
                <p>Total Inspection Report</p>
              </div>
            </div>
            <div className="p-5 d-flex flex-column align-item-center justify-content-center">
              <div className="fs-5 fw-semibold text-center">
                {defectLog}
              </div>
              <div>
                <p>Inspection reports with defect</p>
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="border table-striped table-bordered table-hover table-sm">
            <thead className="thead-light">
              <tr>
                <th>Driver</th>
                <th>Inspection Date \ Time</th>
                <th>Vehicle</th>
                <th>Open defects</th>
                <th>Resolved defects</th>
                <th>Inspection Duration</th>
                <th>Odometer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {datas.length > 0 ?
                datas.every(
                  (idlingData) => idlingData.idlingData.length === 0
                ) ? (
                  <tr className="text-center text-muted">
                    <td colSpan={8} className="text-center text-muted">
                      No data available
                    </td>
                  </tr>
                )
                  :
                  (
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
                            <td>
                              {formatTime(idling.startTime)}
                            </td>
                            <td>{(idling.vehicle)}</td>
                            <td>{idling.open}</td>
                            <td>{idling.resolve}</td>
                            <td>{idling.duration}</td>
                            <td>{(idling.odometer)}</td>
                            <td>{(idling.status)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                  <tr>
                    <td colSpan={8} className="text-center">
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
