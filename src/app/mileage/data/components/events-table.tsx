"use client";

import "../style.css";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Shadow from "@/app/Shadow/page";
import { Badge } from "react-bootstrap";
import { usePDF, Margin } from "react-to-pdf";
import Skeleton from "react-loading-skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import { da } from "@faker-js/faker";

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
  const date = new Date(violationEndDate);
  return format(date, "MMM dd yyyy, h:mm a");
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
  setTypes: (flag: boolean) => void;
}) => {
  const { toPDF, targetRef } = usePDF({
    method: "save",
    filename: "mileage_report.pdf",
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

  const downloadCSV = (data, filename = "mileage_report.csv") => {
    const headers = [
      "Vehicle name",
      "Jurisdiction",
      "Distance",
      "Start odometer",
      "End odometer",
      "Start coordinator",
      "Last coordinator"
    ];

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
        setTypes(false);
      } else {
        downloadCSV(csvData);
        setTypes(false);
      }
    }
  }, [type, timeNow, types]);

  if (!loading) {
    return <Shadow header={4} val={5} />;
  }

  const datas =
    data && data[0] && data[0].length > 0
      ? data[0].map((item) => ({
        name: `${item['name']}`,
        // total_logs: item[1]["total_log_count"],
        mileageData: [
          ...item['mileage_data'].map((dataItem) => ({
            distance: `${dataItem['distance']}`,
            startOdometer: `${dataItem['StartOdometer']}`, // Ensure date-time is wrapped
            endOdometer: `${dataItem['endOdometer']}`,
            Jurisdiction: `${dataItem['stateName']}`,
            startCoordinator: `"${dataItem['startCoordinate']}"`,
            lastCoordinator: `"${dataItem['endCoordinate']}"`, // Ensure date-time is wrapped
          })),
        ],
      }))
      : [];

  const csvData = datas.flatMap((values) =>
    values['mileageData'].map((item) => ({
      "Vehicle name": values.name,
      "Jurisdiction": item.Jurisdiction,
      "Distance": item.distance,
      "Start odometer": item.startOdometer, // Wrapped in quotes earlier
      "End odometer": item.endOdometer, // Wrapped in quotes earlier
      "Start coordinator": item.startCoordinator,
      "Last coordinator": item.lastCoordinator, // Wrapped in quotes earlier
    }))
  );

  // const driversWithViolations = datas.filter(
  //   (driverData) => driverData.violations.length > 0
  // ).length;

  const roundNumber = (numb) => {
    if (numb === 0) return 0;  // Check for zero before proceeding

    const number = typeof numb === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numb)
      : !isNaN(Number(numb))
        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(numb))
        : 'Invalid input';

    return number;
  };


  return (
    <div>
      <div className="border border-2 rounded mt-5">
        <div
          style={{ flexWrap: "wrap" }}
          className="d-flex justify-content-around"
        >
          <div className="p-5">
            <div className="fs-5 fw-semibold text-center">
              {data && (roundNumber(data[1]) + " mil")}
            </div>
            <p>Total distance</p>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="border table-striped table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>Vehicle</th>
              <th>Jurisdiction</th>
              <th>Distance (mi)</th>
              <th>OBD start</th>
              <th>OBD end</th>
              <th>Coordinate start</th>
              <th>Coordinate end</th>
            </tr>
          </thead>
          <tbody>
            {datas && datas.length > 0 ? (
              datas.every(
                (mileageData) => mileageData['mileageData'].length === 0
              ) ? (
                <tr className="text-center text-muted">
                  <td colSpan={7} className="text-center text-muted">
                    No data available
                  </td>
                </tr>
              ) : (
                datas.map((mileageData, mileageDataIndex) => (
                  <React.Fragment key={mileageDataIndex}>
                    {mileageData['mileageData'].length > 0
                      ? mileageData['mileageData'].map(
                        (mileage, mileageIndex) => (
                          <tr key={mileageIndex}>
                            {mileageIndex === 0 && (
                              <td
                                rowSpan={mileageData['mileageData'].length}
                                className="align-middle font-weight-bold"
                              >
                                {mileageData['name']}
                              </td>
                            )}
                            <td>{mileage['Jurisdiction']}</td>
                            <td>
                              {
                                roundNumber(mileage['distance'])
                              }
                            </td>
                            <td>{mileage['startOdometer']}</td>
                            <td>{mileage['endOdometer']}</td>
                            <td>{JSON.parse(mileage['startCoordinator'])}</td>
                            <td>{JSON.parse(mileage['lastCoordinator'])}</td>
                          </tr>
                        )
                      )
                      : null}
                  </React.Fragment>
                ))
              )
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-muted">
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
          {PdfDownload({ datas, time, data })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;

// PDF content
const PdfDownload = ({ datas, time, data }: { datas: any; time: any, data: any }) => {

  const roundNumber = (numb) => {
    if (numb === 0) return 0;  // Check for zero before proceeding

    const number = typeof numb === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numb)
      : !isNaN(Number(numb))
        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(numb))
        : 'Invalid input';

    return number;
  };

  return (
    <div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-auto">
            <img src="/logo/dw.png" alt="company logo" className="img-fluid" />
          </div>
          <div className="col text-center text-md-start">
            <h1>Mileage report</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>

      <div>
        <div>
          <div className="border border-2 rounded mt-5">
            <div
              style={{ flexWrap: "wrap" }}
              className="d-flex justify-content-around"
            >
              <div className="p-5">
                <div className="fs-5 fw-semibold text-center">
                  {data && (roundNumber(data[1]) + " mil")}
                </div>


                <p>Total distance</p>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="border table-striped table-bordered table-hover table-sm">
              <thead className="thead-light">
                <tr>
                  <th>Vehicle</th>
                  <th>Jurisdiction</th>
                  <th>Distance (mi)</th>
                  <th>OBD start</th>
                  <th>OBD end</th>
                  <th>Manual Odo Edit</th>
                  <th>Coordinate start</th>
                  <th>Coordinate end</th>
                </tr>
              </thead>
              <tbody>
                {datas && datas.length > 0 ? (
                  datas.every(
                    (mileageData) => mileageData['mileageData'].length === 0
                  ) ? (
                    <tr className="text-center text-muted">
                      <td colSpan={7} className="text-center text-muted">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    datas.map((mileageData, mileageDataIndex) => (
                      <React.Fragment key={mileageDataIndex}>
                        {mileageData['mileageData'].length > 0
                          ? mileageData['mileageData'].map(
                            (mileage, mileageIndex) => (
                              <tr key={mileageIndex}>
                                {mileageIndex === 0 && (
                                  <td
                                    rowSpan={mileageData['mileageData'].length}
                                    className="align-middle font-weight-bold"
                                  >
                                    {mileageData['name']}
                                  </td>
                                )}
                                <td>{mileage['Jurisdiction']}</td>
                                <td>
                                  {
                                    roundNumber(mileage['distance'])
                                  }
                                </td>
                                <td>{mileage['startOdometer']}</td>
                                <td>{mileage['endOdometer']}</td>
                                <td>No</td>
                                <td>{JSON.parse(mileage['startCoordinator'])}</td>
                                <td>{JSON.parse(mileage['lastCoordinator'])}</td>
                              </tr>
                            )
                          )
                          : null}
                      </React.Fragment>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      No data available
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
