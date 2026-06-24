"use client";

import React from "react";
import axios from 'axios';
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import debounce from 'lodash.debounce';
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import { useState, useEffect, useCallback } from 'react';

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "160px" }}>
      <Skeleton height={350} />
    </div>
  ),
});

const BarChart = (startDate, endDate) => {

  const [chartValue, setChartValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [data, setData] = useState(null);

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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

  const startDates = startDate['startDate'];

  const endDates = startDate['endDate'];

  const fetchReport = useCallback(
    debounce(async () => {
      setLoading(false);
      try {
        const response = await axios.get(`${url}/safety/score/factor/${startDates}/${endDates}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setChartValue(response.data);
          setLoading(true);
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      }
    }, 500),
    [token, startDate, endDate, url]
  );

  useEffect(() => {
    if (token) {
      fetchReport();
    }

  }, [token, startDate, endDate, url]);

  const formatDateRange = (startDate, endDate) => {
    const options = { month: 'short', day: '2-digit' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  useEffect(() => {

    if (chartValue) {

      var date_start = chartValue[0];

      var date_end = chartValue[1];

      var hb = chartValue[2] == 0 ? 0 : chartValue[2].toFixed(2);

      var ha = chartValue[3] == 0 ? 0 : chartValue[3].toFixed(2);

      var hs = chartValue[4] == 0 ? 0 : chartValue[4].toFixed(2);

      var hu = chartValue[5] == 0 ? 0 : chartValue[5].toFixed(2);

      var spd = chartValue[6] == 0 ? 0 : chartValue[6].toFixed(2);

      var avgha = chartValue[7];

      var avghb = chartValue[8];

      var avghs = chartValue[9];

      var avghu = chartValue[10];

      var avgspd = chartValue[11];

      const values = [-avgha, -avghb, -avghs, -avghu, -avgspd];
      const sortedValues = values.sort((a, b) => a - b); // Sort in descending order

      const series = [
        {
          name: "Violations",
          data: sortedValues, // Values on the x-axis
        },
      ];

      let tooltipData = [
        {
          category: "Hard brake",
          value: avghb,
          moreInfo: {
            label: "Hard brake",
            date: `${formatDateRange(new Date(date_start), new Date(date_end))}`,
            value: `${hb} events / 1K mi`,
            percentage: "20%",
            isIncreased: false,
          },
        },
        {
          category: "Hard accel",
          value: avgha,
          moreInfo: {
            label: "Hard accel",
            date: `${formatDateRange(new Date(date_start), new Date(date_end))}`,
            value: `${ha} events / 1K mi`,
            percentage: "23%",
            isIncreased: false,
          },
        },
        {
          category: "Hard Stop",
          value: avghs,
          moreInfo: {
            label: "Hard Stop",
            date: `${formatDateRange(new Date(date_start), new Date(date_end))}`,
            value: `${hs} events / 1K mi`,
            percentage: "47%",
            isIncreased: true,
          },
        },
        {
          category: "Hard Turn",
          value: avghu,
          moreInfo: {
            label: "Hard Turn",
            date: `${formatDateRange(new Date(date_start), new Date(date_end))}`,
            value: `${hu} events / 1K mi`,
            percentage: "47%",
            isIncreased: false,
          },
        },
        {
          category: "Speeding",
          value: avgspd,
          moreInfo: {
            label: "Speeding",
            date: `${formatDateRange(new Date(date_start), new Date(date_end))}`,
            value: `${spd} events / 1K mi`,
            percentage: "47%",
            isIncreased: true,
          },
        },
      ];

      // Sort the tooltip data by value in descending order
      tooltipData = tooltipData.sort((a, b) => b.value - a.value);

      setData([series, tooltipData]);

    }

  }, [chartValue])

  // <span style="${comment.isIncreased ? "color:red;" : "color:green;"}">${comment.percentage}"

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    tooltip: {
      shared: true,
      intersect: false,
      custom: function ({ dataPointIndex, w }) {
        // Ensure that 'data' is defined and has at least two elements
        const comment = Array.isArray(data) && data.length > 1 ? data[1][dataPointIndex]?.moreInfo : null;

        // Check if comment is not null before trying to access its properties
        if (comment) {
          return `<div style="display: flex; background: black; color: white; border-radius: 4px; padding: 10px; width: fit-content;">
          <div style="display: flex; align-items: start; gap: 10px; padding: 10px; flex-direction: column;">
            <div>
              <p><strong>${comment.label}</strong></p>
              <p style="color: gray; font-size: 12px;">${comment.date}</p>
            </div>
            <div style="display: flex; gap: 30px;">
              <span>${comment.value}</span>
            </span>
            </div>
          </div>
        </div>
        
        `;
        }
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "40%",
      },
    },
    xaxis: {
      categories: Array.isArray(data) && data.length > 1 ? data[1].map(item => item.category) : [],
      labels: {
        formatter: function (value: string) {
          return `${value}`;
        },
      },
    },
    yaxis: {
      title: {
        text: undefined, // Optional: You can add a title for the y-axis if you need
      },
    },
    dataLabels: {
      enabled: true, // Enables showing the data values directly on the bars
      formatter: function (val: number) {
        return `${val}`; // Display the value as it is
      },
    },
    colors: ["#002766", "#003a8c", "#0050b3", "#1890ff", "#69c0ff"], // Color palette for the bars
  };

  if (!loading) {

    return (
      <Skeleton height={380} />
    );

  }

  return (
    <div>
      <Chart
        options={options}
        series={Array.isArray(data) && data.length > 0 ? data[0] : []} // Ensure data is an array
        type="bar"
        height={350}
        width={"100%"}
      />
    </div>

  );
};

export default BarChart;
