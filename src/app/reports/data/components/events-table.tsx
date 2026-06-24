"use client";

import "../style.css";
import { DateTime } from "luxon";
import { format } from "date-fns";
import Shadow from "@/app/Shadow/page";
import { Badge } from "react-bootstrap";
import { usePDF, Margin } from "react-to-pdf";
import Skeleton from "react-loading-skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import React, { useState, useEffect } from "react";

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
  data,
  loading,
  type,
  timeNow,
  types,
  setTypes,
}: {
  data: Props;
  loading: boolean;
  type: string;
  timeNow: any;
  types: boolean;
  setTypes: (value: boolean) => void;
}) => {
  const { toPDF, targetRef } = usePDF({
    method: "save",
    filename: "hos_violation_report.pdf",
    page: { margin: Margin.MEDIUM },
  });

  const handleDownload = async () => {
    await toPDF(); // Wait for the PDF to be created and downloaded
  };

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

  const downloadCSV = (data, filename = "hos_violation_report.csv") => {
    const headers = ["driver", "violation", "start", "end", "duration"];

    // If data is empty, only include headers
    const rows =
      data && data.length > 0
        ? data.map((row) => Object.values(row).join(",")).join("\n")
        : "";

    const csvContent = `${headers.join(",")}\n${rows}`;

    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (type && timeNow && types) {
      if (type === "pdf") {
        handleDownload();
      } else {
        downloadCSV(csvData);
      }
      setTypes(false);
    }
  }, [type, timeNow, types]);

  if (!loading) {
    return <Shadow header={4} val={5} />;
  }

  const datas =
    data && data.length > 0
      ? data.map((item) => ({
        driver: `${item[0].first_name} ${item[0].last_name}`,
        total_logs: item[1]["total_log_count"],
        violations: [
          ...item[1]["Shift_data"].map((shiftItem) => ({
            violation: "Shift 14 Hour Limit",
            start: `"${formatDate(shiftItem["violation_startTime"])}"`, // Ensure date-time is wrapped
            end: `"${formatDate(shiftItem["violation_endTime"])}"`, // Ensure date-time is wrapped
            duration: formatDuration(shiftItem["violation_duration"]),
          })),
          ...item[1]["cycle_data"].map((cycleItem) => ({
            violation: "Cycle 70 Hour Shift Limit",
            start: `"${formatDate(cycleItem["violation_startTime"])}"`,
            end: `"${formatDate(cycleItem["violation_endTime"])}"`,
            duration: formatDuration(cycleItem["violation_duration"]),
          })),
          ...item[1]["driver_eleven_viol_data"].map((driveItem) => ({
            violation: "Adverse Driving 11 Hour Shift Limit",
            start: `"${formatDate(driveItem["drive_start_time"])}"`,
            end: `"${formatDate(driveItem["drive_end_time"])}"`,
            duration: formatDuration(driveItem["drive_violate"]),
          })),
          ...item[1]["eight_hour_break_violation"].map((breakTime) => ({
            violation: "Break 30 minute Shift Limit",
            start: `"${formatDate(breakTime["violation_start_time"])}"`,
            end: `"${formatDate(breakTime["violation_end_date"])}"`,
            duration: formatDuration(breakTime["break_violation"]),
          })),
        ],
      }))
      : [];

  let log = 0;
  datas &&
    datas.length > 0 &&
    datas.forEach((value) => {
      log += value["total_logs"];
    });

  const csvData = datas.flatMap((values) =>
    values.violations.map((item) => ({
      driver: values.driver,
      violation: item.violation,
      start: item.start, // Wrapped in quotes earlier
      end: item.end, // Wrapped in quotes earlier
      duration: item.duration,
    }))
  );

  const driversWithViolations = datas.filter(
    (driverData) => driverData.violations.length > 0
  ).length;

  return (
    <div>
      <div className="border border-2 rounded mt-5">
        <div
          style={{ flexWrap: "wrap" }}
          className="d-flex justify-content-around"
        >
          <div className="p-5">
            <div className="fs-5 fw-semibold text-center">{datas.length}</div>
            <p>Drivers audited</p>
          </div>
          <div className="p-5">
            <div className="fs-5 fw-semibold text-center">
              {driversWithViolations}
            </div>
            <p>Drivers with HOS violations</p>
          </div>
          <div className="p-5">
            <div className="fs-5 fw-semibold text-center">{log}</div>
            <p>Logs Audited</p>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="border table-striped table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>Driver</th>
              <th>Violation</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {datas && datas.length > 0 ? (
              datas.every(
                (driverData) => driverData.violations.length === 0
              ) ? (
                <tr className="text-center text-muted">
                  <td colSpan={5} className="text-center text-muted">
                    No data available
                  </td>
                </tr>
              ) : (
                datas.map((driverData, driverIndex) => (
                  <React.Fragment key={driverIndex}>
                    {driverData.violations.length > 0
                      ? driverData.violations.map(
                        (violation, violationIndex) => (
                          <tr key={violationIndex}>
                            {violationIndex === 0 && (
                              <td
                                rowSpan={driverData.violations.length}
                                className="align-middle font-weight-bold"
                              >
                                {driverData.driver}
                              </td>
                            )}
                            <td>{violation.violation}</td>
                            <td>{JSON.parse(violation.start)}</td>
                            <td>{JSON.parse(violation.end)}</td>
                            <td>{violation.duration}</td>
                          </tr>
                        )
                      )
                      : null}
                  </React.Fragment>
                ))
              )
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden div containing the PDF content */}
      <div style={{ position: "absolute", top: "-10000px" }}>
        <div ref={targetRef} style={{ maxWidth: "800px" }}>
          {PdfDownload({ datas, time })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;

// PDF content
const PdfDownload = ({ datas, time }: { datas: any; time: any }) => {
  const driversWithViolations =
    datas && datas.length > 0
      ? datas.filter((driverData) => driverData.violations.length > 0).length
      : 0;

  let log = 0;

  datas && datas.length > 0
    ? datas.map((value) => {
      log += value["total_logs"];
    })
    : 0;

  return (
    <div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-auto">
            <img src="/logo/dw.png" alt="company logo" className="img-fluid" />
          </div>
          <div className="col text-center text-md-start">
            <h1>HOS violation report</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>

      <div>
        <div className="border border-2 rounded mt-5">
          <div className="d-flex justify-content-around flex-wrap">
            <div className="p-3 p-md-5 w-100 w-md-auto text-center">
              <div className="fs-5 fw-semibold">{datas.length}</div>
              <p>Drivers audited</p>
            </div>
            <div className="p-3 p-md-5 w-100 w-md-auto text-center">
              <div className="fs-5 fw-semibold">{driversWithViolations}</div>
              <p>Drivers with HOS violations</p>
            </div>
            <div className="p-3 p-md-5 w-100 w-md-auto text-center">
              <div className="fs-5 fw-semibold">{log}</div>
              <p>Logs Audited</p>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="border table-striped table-bordered table-hover table-sm">
            <thead className="thead-light">
              <tr>
                <th>Driver</th>
                <th>Violation</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {datas && datas.length > 0 ? (
                datas.every(
                  (driverData) => driverData.violations.length === 0
                ) ? (
                  <tr className="text-center text-muted">
                    <td colSpan={5} className="text-center text-muted">
                      No data available
                    </td>
                  </tr>
                ) : (
                  datas.map((driverData, driverIndex) => (
                    <React.Fragment key={driverIndex}>
                      {driverData.violations.length > 0
                        ? driverData.violations.map(
                          (violation, violationIndex) => (
                            <tr key={violationIndex}>
                              {violationIndex === 0 && (
                                <td
                                  rowSpan={driverData.violations.length}
                                  className="align-middle font-weight-bold"
                                >
                                  {driverData.driver}
                                </td>
                              )}
                              <td>{violation.violation}</td>
                              <td>{JSON.parse(violation.start)}</td>
                              <td>{JSON.parse(violation.end)}</td>
                              <td>{violation.duration}</td>
                            </tr>
                          )
                        )
                        : null}
                    </React.Fragment>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No data available
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
