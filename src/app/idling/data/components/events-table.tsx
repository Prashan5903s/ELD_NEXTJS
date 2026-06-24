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

  const datas =
    data && Object.keys(data).length > 0
      ? Object.keys(data).map((item) => ({
        name: `${item}`,
        idlingData: [
          ...data[item].map((dataItem) => ({
            id: `${dataItem['id']}`,
            reason: `${dataItem['message_reason']}`,
            startTime: `${dataItem['event_date_time']}`,
            location: `${[JSON.parse(dataItem['location']).GeoLocation.Latitude, JSON.parse(dataItem['location']).GeoLocation.Longitude]}`,
            duration: `${dataItem['duration']}`,
          })),
        ],
      }))
      : [];

  const addressRef = useRef(false); // to track if the address has been reset

  useEffect(() => {
    // Only reset the addresses when the datas array changes and it's not already reset
    if (!addressRef.current) {
      setAddress({});
      addressRef.current = true; // mark as reset
    }

    if (datas && datas.length > 0) {
      datas.forEach((item) => {
        item['idlingData'].forEach((value, index) => {
          fetchAddress(value['location'], index, value.id); // Correct the location parameter here
        });
      });
    }
  }, [datas]);

  const fetchAddress = (location: string, index: number, id: number) => {
    // Check if address for the index is already set
    if (address[id]) {
      return; // Skip API call if the address is already set
    }

    const [latitude, longitude] = location.split(",");

    if (!latitude || !longitude || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      console.error("Invalid coordinates:", location);
      return;
    }

    // Make API call to fetch the new address
    return axios
      .get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: MapKey, // Use the Map Key from environment
        },
      })
      .then((response) => {
        const formattedAddress = response.data.results[0]?.formatted_address || "Address not found";
        setAddress((prev) => ({ ...prev, [id]: formattedAddress }));
      })
      .catch((error) => {
        console.error("Error fetching address:", error.response ? error.response.data : error.message);
      });
  };

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

  const convertToHMS = (totalMinutes) => {

    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes == null || totalMinutes == undefined) return "0";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = 0; // Assuming you are only converting minutes, seconds will be 0

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
      return "0";
    }

    // Format the date into the desired format
    return date.toFormat('MM/dd/yyyy hh:mm a');
  };

  const downloadCSV = (data: any, filename = "idling_report.csv") => {
    const headers = [
      "Vehicle name",
      "Reason",
      "Start time",
      "Location",
      "Total idling",
    ];

    const rows = data
      .map((vehicle: any) =>
        vehicle.idlingData
          .map((idlingItem: any) =>
            [
              vehicle.name, // Vehicle name
              idlingItem.reason === "IDLING" ? "Idling start" : "Idling end", // Reason
              formatTime(String(idlingItem.startTime)), // Start time
              `"${address[idlingItem.id]}"`, // Location
              convertToHMS(idlingItem.duration), // Duration
            ]
              .join(",")
          )
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

  return (
    <div>
      <div className="border border-2 rounded mt-5">
        <div style={{ flexWrap: "wrap" }} className="d-flex justify-content-around">
          <div className="p-5 d-flex flex-column align-item-center justify-content-center">
            <div className="fs-5 fw-semibold text-center">
              {datas && datas.length > 0
                ? convertToHMS(
                  datas.reduce(
                    (total, idlingData) =>
                      total +
                      idlingData.idlingData.reduce(
                        (subTotal, idling) => subTotal + Number(idling.duration),
                        0
                      ),
                    0 // Use numeric 0 as the initial value
                  )
                )
                : 0}
            </div>
            <div>
              <p>Total idling time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="border table-striped table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>Vehicle</th>
              <th>Reason</th>
              <th>Start time</th>
              <th>Location</th>
              <th>Total idling</th>
            </tr>
          </thead>
          <tbody>
            {datas.length > 0 ?
              datas.every(
                (idlingData) => idlingData.idlingData.length === 0
              ) ? (
                <tr className="text-center text-muted">
                  <td colSpan={5} className="text-center text-muted">
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
                            {idling.reason === "IDLING"
                              ? "Idling start"
                              : "Idling end"}
                          </td>
                          <td>{formatTime(idling.startTime)}</td>
                          <td>{address[idling.id] || <Skeleton />}</td>
                          <td>{convertToHMS(idling.duration)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No data available.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      <div style={{ position: "absolute", top: "-100000px" }}>
        <div ref={targetRef} style={{ maxWidth: "800px" }}>
          {PdfDownload({ datas, time: timeNow, data, address })}
        </div>
      </div>
    </div>
  );
};

export default EventsTable;

// PDF content
const PdfDownload = ({ datas, time, data, address }: { datas: any; time: any; data: any; address: any; }) => {

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

    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes == null || totalMinutes == undefined) return "0";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = 0; // Assuming you are only converting minutes, seconds will be 0

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
            <h1>Idling report</h1>
          </div>
          <div className="col-auto text-center text-md-end">{time}</div>
        </div>
      </div>

      <div>
        <div className="border border-2 rounded mt-5">
          <div style={{ flexWrap: "wrap" }} className="d-flex justify-content-around">
            <div className="p-5 d-flex flex-column align-item-center justify-content-center">
              <div className="fs-5 fw-semibold text-center">
                {datas && datas.length > 0
                  ? convertToHMS(
                    datas.reduce(
                      (total, idlingData) =>
                        total +
                        idlingData.idlingData.reduce(
                          (subTotal, idling) => subTotal + Number(idling.duration),
                          0
                        ),
                      0 // Use numeric 0 as the initial value
                    )
                  )
                  : 0}
              </div>
              <div>
                <p>Total idling time</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="table-responsive">
            <table className="border table-striped table-bordered table-hover table-sm">
              <thead className="thead-light">
                <tr>
                  <th>Vehicle</th>
                  <th>Reason</th>
                  <th>Start time</th>
                  <th>Location</th>
                  <th>Total idling</th>
                </tr>
              </thead>
              <tbody>
                {datas.length > 0 ?
                  datas.every(
                    (idlingData) => idlingData.idlingData.length === 0
                  ) ? (
                    <tr className="text-center text-muted">
                      <td colSpan={5} className="text-center text-muted">
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
                                {idling.reason === "IDLING"
                                  ? "Idling start"
                                  : "Idling end"}
                              </td>
                              <td>{formatTime(idling.startTime)}</td>
                              <td>{address[idling.id] || '.......'}</td>
                              <td>{convertToHMS(idling.duration)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No data available.
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
