"use client";
import axios from "axios";
import { DateTime } from "luxon";
import { debounce } from "lodash";
import "react-date-range/dist/styles.css";
import ComplianceBox from "./ComplianceBox";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import "react-date-range/dist/theme/default.css";
import { DateRangePicker } from "react-date-range";
import ViaolationTable from "./DriverViolationTable";
import React, { useEffect, useCallback, useState } from "react";

const Page = () => {
  const [open, setOpen] = useState(false);

  const timeZone = 'America/Denver';

  const getTodayInUSTimezone = () => {
    return DateTime.now().setZone(timeZone).startOf("day").toJSDate();
  };

  const today = getTodayInUSTimezone();

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(today),
      endDate: new Date(today),
      key: "selection",
    },
  ]);

  const pastDate = new Date(today);

  const [date_start, setDateStart] = useState(formatDate(pastDate));

  const [date_end, setDateEnd] = useState(formatDate(today));

  const [loading, setLoading] = useState(false);

  const [datas, setDatas] = useState([]);

  const [graphData, setGraphData] = useState([]);

  const [graphLoading, setGraphLoading] = useState(false);

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

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchCompliance = async () => {
    if (!token) return; // Ensure token is available

    setLoading(false);
    try {
      const response = await axios.get(
        `${url}/compliance/hours/${date_start}/${date_end}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDatas(response.data || []);
      setLoading(true);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(true);
    }
  };

  // Use debounce to limit the API calls
  const debouncedFetchVehicles = useCallback(debounce(fetchCompliance, 1000), [
    token,
    url,
    date_start,
    date_end,
  ]);

  useEffect(() => {
    if (token) {
      debouncedFetchVehicles();
    }
  }, [debouncedFetchVehicles, token, date_start, date_end]);

  const dataComp = datas.map((val) => ({
    driver: val["driver_name"], // Corrected key and removed extra quotes
    hoursInViolation: val["total_time_violation"], // Corrected key and removed extra quotes
  }));

  const formatDates = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const dataViol = [dataComp];

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const handleSelect = (ranges) => {
    setDateRange([ranges.selection]);

    let startDate = formatDate(ranges.selection.startDate);
    let endDate = formatDate(ranges.selection.endDate);

    const todayFormatted = formatDate(today);

    // Prevent selection beyond today
    if (endDate > todayFormatted) {
      endDate = todayFormatted;
    }

    setDateStart(startDate);
    setDateEnd(endDate);

    setOpen(false);
  };
  const toggleDatePicker = () => {
    setOpen(!open);
  };

  const [selectedValue, setSelectedValue] = useState(0);

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  useEffect(() => {
    const convertTimeToSeconds = (timeStr) => {
      if (!timeStr) return 0; // Return 0 or any default value if timeStr is undefined or empty
      const [hours = 0, minutes = 0, seconds = 0] = timeStr
        .split(":")
        .map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const convertSecondsToTime = (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    let total_viol = 0;
    let total_time = 0;
    let total_comp = 0;
    let assignDriving = 0;
    let totalDriving = 0;

    if (datas && datas.length > 0) {
      datas.forEach((data) => {
        total_viol += convertTimeToSeconds(data["total_time_violation"]);
        total_time += convertTimeToSeconds(data["total_time"]);
        assignDriving += data["assigned_time"];
        totalDriving += data["total_drive"];
      });

    }

    total_comp = total_time - total_viol;

    var unassignDrive = totalDriving - assignDriving;

    var violpercentage = total_viol && total_time ? (total_viol / total_time) * 100 : 0;

    var violpercentage1 = violpercentage == 0 ? 0 : violpercentage.toFixed(1);

    var compercentage = (total_viol > 0 || total_time > 0) && 100 - violpercentage;

    var compercentage1 = Math.round(compercentage);

    var compercentage2 = compercentage == 0 ? 0 : compercentage.toFixed(1);

    // Convert compercentage2 to a string and then check if it ends with ".0" or ".00"
    compercentage2 =
      compercentage2.toString().endsWith(".00") ||
        compercentage2.toString().endsWith(".0")
        ? parseInt(compercentage2.toString())
        : parseFloat(compercentage2.toString());

    var formatTotal = total_time && convertSecondsToTime(total_time);
    var formatViol = total_viol && convertSecondsToTime(total_viol);
    var formatComp = total_comp && convertSecondsToTime(total_comp);
    var formatAssgn = assignDriving && convertSecondsToTime(assignDriving);
    var formatTotalDrive = totalDriving && convertSecondsToTime(totalDriving);
    var formatUnassgnDrive =
      unassignDrive && convertSecondsToTime(unassignDrive);
    var assgnPercent =
      assignDriving && totalDriving ? (assignDriving / totalDriving) * 100 : 0;
    var assgnPercent1 =
      assgnPercent === 0 ? 0 : Number(assgnPercent.toFixed(1));

    assgnPercent1 =
      assgnPercent1.toString().endsWith(".00") ||
        assgnPercent1.toString().endsWith(".0")
        ? parseInt(assgnPercent1.toString())
        : parseFloat(assgnPercent1.toString());

    var unassgnPercent =
      (assignDriving > 0 || totalDriving > 0) && 100 - assgnPercent;
    var unassgnPercent1 = unassgnPercent == 0 ? 0 : unassgnPercent.toFixed(1);

    unassgnPercent1 =
      unassgnPercent1.toString().endsWith(".00") ||
        unassgnPercent1.toString().endsWith(".0")
        ? parseInt(unassgnPercent1.toString())
        : parseFloat(unassgnPercent1.toString());

    var dataValue = [
      {
        title: "HOS Violations",
        negativeLabel: {
          name: "In Violations",
          percentage: `${violpercentage1}%`,
          time: `${formatViol == "0" ? "0h 0m" : formatViol}`,
        },
        positiveLabel: {
          name: "Compliant",
          percentage: `${compercentage2}%`,
          time: `${formatComp == "0" ? "0h 0m" : formatComp}`,
        },
        positivePercentage: `${compercentage1}`,
      },
      {
        title: "Unassigned Driving",
        negativeLabel: {
          name: "Unassigned",
          percentage: `${unassgnPercent1 ? (unassgnPercent1 == 0 ? 0 : unassgnPercent1) : 0
            }%`,
          time: `${formatUnassgnDrive == "0" ? "0h 0m" : formatUnassgnDrive}`,
        },
        positiveLabel: {
          name: "Assigned",
          percentage: `${assgnPercent1 ? (assgnPercent1 == 0 ? 0 : assgnPercent1) : 0
            }%`,
          time: `${formatAssgn == "0" ? "0h 0m" : formatAssgn}`,
        },
        positivePercentage: `${assgnPercent1 ? (assgnPercent1 == 0 ? 0 : assgnPercent1) : 0
          }`,
      },
      // {
      //   title: "Unassigned Segment",
      //   negativeLabel: {
      //     name: "In Violations",
      //     percentage: "0.06% ",
      //     time: "4h 49m",
      //   },
      //   positiveLabel: {
      //     name: "Compliant",
      //     percentage: "0.06% ",
      //     time: "4h 49m ",
      //   },
      //   positivePercentage: 96,
      // },
    ];

    setGraphData(dataValue);
  }, [datas]);

  useEffect(() => {
    if (graphData) {
      setGraphLoading(true);
    }
  }, [graphData]);

  return (
    <>
      <div
        style={{ color: "#4b5675" }}
        className="py-4 border border-end-0 border-start-0 mb-4"
      >
        <input
          type="text"
          role="button"
          readOnly
          onClick={toggleDatePicker}
          value={`${dateRange[0].startDate.toLocaleDateString()} - ${(dateRange[0].endDate.toLocaleDateString() > formatDates(today)) ? formatDates(today) : (dateRange[0].endDate.toLocaleDateString())}`}
          style={{
            padding: "10px",
            textAlign: "center",
            border: "2px solid #ccc",
            borderRadius: "4px",
            width: "200px",
          }}
        />
        {open && (
          <div style={{ position: "absolute", zIndex: 1000 }}>
            <DateRangePicker
              ranges={dateRange}
              onChange={handleSelect}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              maxDate={today}
            />
          </div>
        )}
      </div>
      {!loading ? (
        <div style={{ flexWrap: "wrap", gap: "20px" }} className="d-flex">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="position-relative">
              <div
                className="position-absolute"
                style={{
                  right: "22px",
                  top: "40%",
                  zIndex: 90,
                  outline: "none",
                }}
              ></div>
              <div className="d-flex" style={{ flexWrap: "wrap", gap: "20px" }}>
                <div
                  className="border rounded p-8 mw-450px"
                  style={{ flex: "0 0 350px" }}
                >
                  <div className="d-flex justify-content-between">
                    <h4 className="mb-0">
                      <Skeleton width={180} height={20} />
                    </h4>
                    <a
                      className="text-decoration-underline text-secondary"
                      style={{ cursor: "pointer" }}
                    >
                      <Skeleton width={80} height={15} />
                    </a>
                  </div>
                  {/* <div> */}
                  {/* </div> */}
                  <div>
                    <Skeleton width={300} height={140} />
                  </div>
                  <div className="d-flex mt-2 align-items-center justify-content-between pb-1 border-top-0 border-start-0 border-end-0 border">
                    <div className="d-flex gap-2 align-items-center">
                      <span
                        className="h-10px w-10px d-block"
                        style={{ backgroundColor: "red" }}
                      ></span>
                      <span>
                        <Skeleton width={130} height={15} />
                      </span>
                    </div>
                    <div>
                      <span>
                        <Skeleton width={20} height={15} />
                      </span>
                    </div>
                    <div>
                      <span>
                        <Skeleton width={20} height={15} />
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between pb-1 mt-2">
                    <div className="d-flex gap-2 align-items-center">
                      <span
                        className="h-10px w-10px d-block"
                        style={{ backgroundColor: "rgb(97, 193, 97)" }}
                      ></span>
                      <span className="d-block w-75px">
                        <Skeleton width={130} height={15} />
                      </span>
                    </div>
                    <div>
                      <span>
                        <Skeleton width={20} height={15} />
                      </span>
                    </div>
                    <div>
                      <span>
                        <Skeleton width={20} height={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flexWrap: "wrap", gap: "20px" }} className="d-flex">
          {graphData &&
            graphData.map((data, index) => {
              return (
                <div className="position-relative" key={`${data} ${index}`}>
                  <div
                    style={{
                      right: "22px",
                      top: "40%",
                      zIndex: 90,
                      outline: "none",
                    }}
                    className="position-absolute"
                  >
                    {/* {index === 0 && (
                  <Form.Select
                    size="sm"
                    style={{ border: "none", cursor: "pointer" }}
                    value={selectedValue}
                    onChange={handleChange}
                  >
                    <option value={0}>Hours</option>
                    <option value={1}>Minutes</option>
                  </Form.Select>
                )} */}
                  </div>
                  <div
                    style={{ flexWrap: "wrap", gap: "20px" }}
                    className="d-flex"
                  >
                    <ComplianceBox
                      dataSet={datas}
                      loading={loading}
                      title={data.title}
                      negativeLabel={data.negativeLabel}
                      positiveLabel={data.positiveLabel}
                      positivePercentage={data.positivePercentage}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
      <div style={{ color: "#4b5675" }}>
        <ViaolationTable tableData={dataViol[0]} loading={loading} />
      </div>
    </>
  );
};

export default Page;
