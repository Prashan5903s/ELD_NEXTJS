"use client";
import React from "react";
import dynamic from "next/dynamic";
import styles from "../../styles/chart.module.css";
import { ApexOptions } from "apexcharts";
import {
  calculateTimeDifference,
  calculateTimeDifferenceAndFormat,
  getClosestTime,
} from "./utils";

const GraphChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <p>Loading chart...</p>,
});

function Chart({ processedData, params = null, rawData }) {
  const xLabels = Array.from({ length: 1440 / 15 }, (_, i) => {
    const hours = String(Math.floor((i * 15) / 60)).padStart(2, "0");
    const minutes = String((i * 15) % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  const xAxis = [];
  let cumulativeHours = 0;
  let cumulativeMinutes = 0;

  processedData.forEach((point) => {
    const [hours, minutes, seconds] = point.totalTime.split(".").map(Number);

    cumulativeHours += hours;
    cumulativeMinutes += minutes + Math.floor(seconds / 60);

    if (cumulativeMinutes >= 60) {
      cumulativeHours += Math.floor(cumulativeMinutes / 60);
      cumulativeMinutes = cumulativeMinutes % 60;
    }

    const formattedTime = `${cumulativeHours}.${cumulativeMinutes
      .toString()
      .padStart(2, "0")}`;
    xAxis.push(formattedTime);
  });

  const xData = ["0.00", ...xAxis];

  let fetchingEndStatus = 0;

  if (processedData.length > 0) {
    const lastLine = processedData[processedData.length - 1];
    if (lastLine.status) {
      fetchingEndStatus = lastLine.status;
    }
  }

  const yAxis = processedData.map((point) => point.status);
  const yData = [...yAxis, fetchingEndStatus];

  // Map xData to indices in the 15-minute intervals array
  const mappedData = new Array(xLabels.length).fill(null);
  xData.forEach((time, index) => {
    const [hours, minutes] = time.split(".");
    const formattedTime = `${hours.padStart(2, "0")}:${minutes.padEnd(2, "0")}`;
    const i = xLabels.indexOf(formattedTime);
    if (i !== -1) {
      mappedData[i] = { x: formattedTime, y: yProcessData(yData[index]) };
    }
  });

  // Fill gaps with the previous non-null value or a default value if all previous are null
  for (let i = 1; i < mappedData.length; i++) {
    if (mappedData[i] === null) {
      if (mappedData[i - 1] !== null) {
        mappedData[i] = { x: xLabels[i], y: mappedData[i - 1].y };
      } else {
        mappedData[i] = { x: xLabels[i], y: 0 };
      }
    }
  }

  // Handle the case where the first value might be null
  if (mappedData[0] === null) {
    mappedData[0] = { x: xLabels[0], y: 0 };
  }

  const filteredData = processedData[0].colorLineData;
  const colorLineData = [];

  filteredData.forEach((entry) => {
    const stime = entry.stime;
    const etime = entry.etime;
    const color = entry.color;

    if (!stime || !etime || !color) {
      console.error(`Invalid entry: ${JSON.stringify(entry)}`);
      return;
    }

    try {
      const startColumn = timeToColumn(stime);
      const endColumn = timeToColumn(etime);

      let colorEntry = colorLineData.find((e) => e.color === color);
      if (!colorEntry) {
        colorEntry = {
          color: color,
          colNums: [],
        };
        colorLineData.push(colorEntry);
      }

      for (let i = startColumn; i < endColumn; i++) {
        if (!colorEntry.colNums.includes(i)) {
          colorEntry.colNums.push(i);
        }
      }
    } catch (error) {
      console.error(
        `Error processing entry with stime: ${stime}, etime: ${etime}, color: ${color}`,
        error.message
      );
    }
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    // Handle special case for midnight
    if (hours === 0 && minutes === 0) {
      return "00:00";
    }

    // Format hours according to the 24-hour format
    const formattedHours = hours.toString().padStart(2, "0");
    return `${formattedHours}:${minutes.toString().padStart(2, "0")}`;
  };

  const today = new Date().toISOString().slice(0, 10);

  const processViolationData = (data, key) => {
    // Get today's date in the correct format (ISO string without time part)
    const today = new Date().toISOString().split("T")[0];

    return data.map((item) => {

      switch (key) {

        case 'Shift_data':

          const startDate = new Date(item["violation_startTime"]);

          const endDate = new Date(item["violation_endTime"]);

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted = formatTime(item["violation_startTime"]);
          const endTimeFormatted = formatTime(item["violation_endTime"]);

          let isEndOfDay = false; // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate instanceof Date && !isNaN(endDate.getTime())) {
            isEndOfDay =
              endDate.toISOString().startsWith(today) &&
              endDate.getUTCHours() === 23 &&
              endDate.getUTCMinutes() === 59;
          }

          return {
            stime: startTimeFormatted,
            etime: isEndOfDay ? "24:00" : endTimeFormatted,
          };

          // Your logic for 'Shift_data'

          break;

        case 'eight_hour_break_violation':

          const startDate1 = new Date(item["violation_start_time"]);

          const endDate1 = new Date(item["violation_end_date"]);

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted1 = formatTime(item["violation_start_time"]);

          const endTimeFormatted1 = formatTime(item["violation_end_date"]);

          let isEndOfDay1 = false; // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate1 instanceof Date && !isNaN(endDate1.getTime())) {
            isEndOfDay1 =
              endDate1.toISOString().startsWith(today) &&
              endDate1.getUTCHours() === 23 &&
              endDate1.getUTCMinutes() === 59;
          }

          return {
            stime: startTimeFormatted1,
            etime: isEndOfDay1 ? "24:00" : endTimeFormatted1,
          };

          break;

        case 'driver_eleven_viol_data':

          const startDate2 = new Date(item["drive_start_time"]);

          const endDate2 = new Date(item["drive_end_time"]);

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted2 = formatTime(item["drive_start_time"]);
          const endTimeFormatted2 = formatTime(item["drive_end_time"]);

          let isEndOfDay2 = false; // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate2 instanceof Date && !isNaN(endDate2.getTime())) {
            isEndOfDay2 =
              endDate2.toISOString().startsWith(today) &&
              endDate2.getUTCHours() === 23 &&
              endDate2.getUTCMinutes() === 59;
          }

          return {
            stime: startTimeFormatted2,
            etime: isEndOfDay2 ? "24:00" : endTimeFormatted2,
          };

        case 'cycle_data':

          const startDate3 = new Date(item["violation_startTime"]);
          const endDate3 = new Date(item["violation_endTime"]);

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted3 = formatTime(item["violation_startTime"]);
          const endTimeFormatted3 = formatTime(item["violation_endTime"]);

          let isEndOfDay3 = false; // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate3 instanceof Date && !isNaN(endDate3.getTime())) {
            isEndOfDay3 =
              endDate3.toISOString().startsWith(today) &&
              endDate3.getUTCHours() === 23 &&
              endDate3.getUTCMinutes() === 59;
          }

          return {
            stime: startTimeFormatted3,
            etime: isEndOfDay3 ? "24:00" : endTimeFormatted3,
          };

          break;

          break;
        default:
          // Optional: handle other cases if needed
          break;
      }


    });
  };

  const specificKeys = [
    "Shift_data",
    "cycle_data",
    "eight_hour_break_violation",
    "driver_eleven_viol_data",
  ];

  let overtimeRanges = [];

  var dataSet = [
    {
      stime: '15:13',
      etime: '17:10',
    },
    {
      stime: '16:10',
      etime: '18:25',
    },
    {
      stime: '12:00',
      etime: '13:59',
    },
  ];

  if (params["params"] && params["params"][2]) {
    specificKeys.forEach((key) => {

      if (params["params"][2][key]) {

        overtimeRanges = overtimeRanges.concat(

          processViolationData(params["params"][2][key], key)

        );

      }

    });
  }

  overtimeRanges.sort((a, b) => a.stime.localeCompare(b.stime));

  const adjustedOvertimeRanges = adjustData(overtimeRanges);

  const xAnnotations = adjustedOvertimeRanges.map((range) => ({
    x: range.stime,
    x2: range.etime,
    fillColor: "#FF4560",
    opacity: 0.3,
    borderColor: "#FF4560",
    borderWidth: 1,
  }));

  const annotations = [
    {
      y: 0,
      y2: 1,
      borderColor: "#fefbe2",
      borderWidth: 0.5,
      fillColor: "yellow",
      opacity: 0.1,
    },
    {
      y: 1,
      y2: 2,
      borderColor: "#ddfeda",
      borderWidth: 0.5,
      fillColor: "green",
      opacity: 0.1,
    },
  ];


  const series = [
    {
      name: "",
      data: mappedData.map((d) => d.y),
      myCustomData: ["Testing my cutom data avaailablity"],
    },
  ];

  const seriesToTruckStatus = {
    0.5: { value: 1, name: "On", color: "yellow" },
    1.5: { value: 2, name: "D", color: "green" },
    2.5: { value: 3, name: "SB", color: "blue" },
    3.5: { value: 4, name: "OFF", color: "grey" },
  };

  const options: ApexOptions = {
    tooltip: {
      enabled: true,
      x: {
        show: false,
      },
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const yValue = series[seriesIndex][dataPointIndex];

        const xValue = w.globals.labels[dataPointIndex];

        const timeInterval = getClosestTime(
          rawData,
          w.globals.categoryLabels[xValue],
          seriesToTruckStatus[yValue]?.value
        );

        return `<div style="background: white; padding: 10px 5px; text-align: center; z-index: 9999;" class="custom-tooltip">
                  <div style="display: flex; gap: 10px;">
                    <strong style="background-color: ${seriesToTruckStatus[yValue]?.color
          };display: block; width: 30px;border-radius: 2px;">${seriesToTruckStatus[yValue]?.name
          }</strong>
                    <strong style="display: block;">
                     ${timeInterval?.stime} - ${timeInterval?.etime}
                     </strong>
                  </div>
                  <div><p style="margin: 0;">${calculateTimeDifferenceAndFormat(
            timeInterval?.stime,
            timeInterval?.etime
          )}</p></div>
                  <div style="width: 100%;text-align: center;">${timeInterval?.truckDetails[0]?.text != "abc" ? timeInterval?.truckDetails[0]?.text : ""
          }</div>
                </div>`;
      },
    },
    chart: {
      zoom: {
        enabled: false,
      },
      animations: {
        speed: 100,
        enabled: false,
        easing: "linear",
      },
      foreColor: "#333",
      dropShadow: {
        enabled: false,
      },
      type: "line",
      toolbar: {
        show: false,
      },
      redrawOnParentResize: true,
    },

    stroke: {
      width: 3,
      curve: "stepline",
      lineCap: "butt",
      dashArray: 0,
      colors: ["#000000"],
    },
    colors: ["#000000"],
    xaxis: {
      categories: xLabels,
      tickAmount: 23,
      labels: {
        rotate: -90,
        style: {
          colors: [],
          fontSize: "10px",
        },
      },
      position: "top",
    },
    markers: {
      size: 0,
    },
    yaxis: {
      tickAmount: 4,
      min: 0,
      max: 4,
      labels: {
        formatter: function (value) {
          return typeof value === "number" ? value.toFixed(0) : value; // Check if value is a number
        },
      },
    },
    grid: {
      show: false,
      borderColor: "#90A4AE",
      strokeDashArray: 0,
      position: "back",
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    annotations: {
      yaxis: annotations.map((anno) => ({
        y: anno.y,
        y2: anno.y2,
        borderColor: anno.borderColor,
        borderWidth: anno.borderWidth,
        fillColor: anno.fillColor,
        opacity: anno.opacity,
      })),
      xaxis: xAnnotations.map((anno) => ({
        x: anno.x,
        x2: anno.x2,
        borderColor: anno.borderColor,
        borderWidth: anno.borderWidth,
        fillColor: anno.fillColor,
        opacity: anno.opacity,
      })),
    },
  };

  return (
    <div className={styles.apexChartmain}>
      <div
        className={`${styles.container1}`}
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        <div
          className={`${styles.backgroundDiv}`}
          style={{
            position: "absolute",
            top: 0,
            left: "0px",
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            zIndex: 1,
          }}
        >
          <GraphChart
            className={styles.section + " " + styles.apexCharts}
            options={options}
            series={series}
            type="line"
            height="100%"
            width="100%"
          />
        </div>
        <div className={`${styles.foregroundHead}`}>
          <h5>M</h5> <h6>1</h6> <h6>2</h6> <h6>3</h6> <h6>4</h6> <h6>5</h6>{" "}
          <h6>6</h6> <h6>7</h6> <h6>8</h6> <h6>9</h6> <h6>10</h6> <h6>11</h6>
          <h5>N</h5> <h6>1</h6> <h6>2</h6> <h6>3</h6> <h6>4</h6> <h6>5</h6>{" "}
          <h6>6</h6> <h6>7</h6> <h6>8</h6> <h6>9</h6> <h6>10</h6> <h5>M</h5>
        </div>
        <div className={`${styles.foregroundDiv}`}>
          <table>
            <tbody>
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 96 }).map((_, colIndex) => {
                    const matchingTruck = colorLineData.find((truck) =>
                      truck.colNums.includes(colIndex)
                    );
                    return (
                      <td
                        key={colIndex}
                        style={{
                          padding: "0px",
                          position: "relative",
                          height: "10%",
                          borderBottom:
                            matchingTruck && rowIndex === 3
                              ? `10px solid ${matchingTruck.color}`
                              : "0px",
                        }}
                      >
                        {colIndex % 4 === 3 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "10%",
                              borderLeft: "1px solid grey",
                              borderBottom:
                                matchingTruck && rowIndex === 3
                                  ? `4px solid ${matchingTruck.color}`
                                  : "1px solid grey",
                            }}
                          ></div>
                        )}
                        {colIndex % 4 === 2 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "15%",
                              borderLeft: "1px solid grey",
                              borderBottom:
                                matchingTruck && rowIndex === 3
                                  ? `4px solid ${matchingTruck.color}`
                                  : "1px solid grey",
                            }}
                          ></div>
                        )}
                        {colIndex % 4 === 1 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "10%",
                              borderLeft: "1px solid grey",
                              borderBottom:
                                matchingTruck && rowIndex === 3
                                  ? `4px solid ${matchingTruck.color}`
                                  : "1px solid grey",
                            }}
                          ></div>
                        )}
                        {colIndex % 4 === 0 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "100%",
                              borderLeft: "1px solid lightgrey",
                              borderBottom:
                                matchingTruck && rowIndex === 3
                                  ? `4px solid ${matchingTruck.color}`
                                  : "1px solid grey",
                            }}
                          ></div>
                        )}
                        {colIndex == 95 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "100%",
                              borderRight: "1px solid lightgrey",
                              borderBottom:
                                matchingTruck && rowIndex === 3
                                  ? `4px solid ${matchingTruck.color}`
                                  : "1px solid grey",
                            }}
                          ></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function yProcessData(data) {
  const valueMap = {
    1: 0.5, // 1 or ON
    ON: 0.5,
    2: 1.5, // 2 or D
    D: 1.5,
    3: 2.5, // 3 or SB
    SB: 2.5,
    4: 3.5, // 4 or Off
    Off: 3.5,
  };
  return valueMap[data] !== undefined ? valueMap[data] : null;
}

function timeToColumn(time) {
  if (!time || typeof time !== "string") {
    throw new Error(`Invalid time format: ${time}`);
  }
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`);
  }
  return hours * 4 + Math.floor(minutes / 15);
}

const roundToNearest15 = (minutes) => Math.round(minutes / 15) * 15;

const timeToMinutes = (time) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const adjustData = (data) => {
  let previousEndTime = 0;
  const MAX_TIME = 23 * 60 + 45; // Maximum allowed time (23:45)

  return data.map((item) => {
    let { stime, etime } = item;

    let stimeInMinutes = timeToMinutes(stime);
    let etimeInMinutes = timeToMinutes(etime);

    stimeInMinutes = Math.max(stimeInMinutes, previousEndTime);
    stimeInMinutes = roundToNearest15(stimeInMinutes);
    etimeInMinutes = roundToNearest15(etimeInMinutes);

    // Ensure end time is not greater than 23:45
    etimeInMinutes = Math.min(
      Math.max(etimeInMinutes, stimeInMinutes + 15),
      MAX_TIME
    );

    previousEndTime = etimeInMinutes;
    return {
      ...item,
      stime: minutesToTime(stimeInMinutes),
      etime: minutesToTime(etimeInMinutes),
    };
  });
};

export default Chart;
