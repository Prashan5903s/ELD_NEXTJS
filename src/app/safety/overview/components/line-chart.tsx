"use client";

import axios from "axios";
import { DateTime } from 'luxon';
import dynamic from "next/dynamic";
import debounce from "lodash.debounce";
import { ApexOptions } from "apexcharts";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import React, { useState, useEffect, useCallback } from "react";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "160px" }}>
      <Skeleton height={350} />
    </div>
  ),
});

const SafetyScoreTrend = () => {

  const [chartValue, setChartValue] = useState(null);

  const [loading, setLoading] = useState(false);
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [datas, setDatas] = useState(null);

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


  const fetchReport = useCallback(
    debounce(async () => {
      setLoading(false);
      try {
        const response = await axios.get(`${url}/safety/score/trend`, {
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
    [token, url]
  );

  useEffect(() => {
    if (token) {
      fetchReport();
    }

  }, [token, url]);

  const formatDate = (dateString) => {
    const options = { month: 'short', day: '2-digit' } as const; // Using 'as const' to infer literal types
    const date = new Date(dateString); // Convert string to Date object

    return date.toLocaleDateString('en-US', options); // Format the date
  };

  useEffect(() => {
    if (chartValue) {

      // Extracting formatted dates and storing them in the categories array
      const extractedCategories = chartValue.map(item => formatDate(item.date));
      const extractedSafetyScore = chartValue.map(item => item.safety_score[0]);

      // Uncomment the next line to set categories if needed
      const values = [extractedCategories, extractedSafetyScore];
      setDatas(values);
    }
  }, [chartValue]);


  const tooltipData = chartValue && chartValue.length > 0 ? chartValue.map((data) => ({
    date: `${DateTime.fromISO(data.date).toFormat('MMM dd')}`,
    comment: {
      excellentDrivers: `${data['safety_score'][3]['excellent']}%`,
      goodDriver: `${data['safety_score'][3]['good']}%`,
      fairDrivers: `${data['safety_score'][3]['fair']}%`,
      poorDriver: `${data['safety_score'][3]['poor']}%`,
    }
  })) : [];

  const data: ApexOptions = {
    colors: ["#26477d"],
    series: [
      {
        name: "Safety Score",
        data: Array.isArray(datas) && datas[1].length > 0 ? datas[1] : [],
      },
    ],

    chart: {
      type: "line",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: 2,
    },
    markers: {
      size: 4,
    },
    xaxis: {
      categories: Array.isArray(datas) && datas[0].length > 0 ? datas[0] : [],
      labels: {
        rotate: -45,
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (value) => value.toFixed(0),
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      custom: function ({ dataPointIndex, w }) {
        const dateLabel = w.globals.labels[dataPointIndex]; // Get correct x-axis date

        const comment = tooltipData[dateLabel]?.comment || {
          excellentDrivers: "100%",
          goodDriver: "0%",
          fairDrivers: "0%",
          poorDriver: "0%",
        };

        return `<div style="background:black;color:white;border-radius:4px;padding:10px;max-width:290px;">
                 <div style="display:flex;align-items:center;gap:50px;padding:10px;border-top:1px solid #574f4f;max-width:260px;">
                   <div>
                     <p><strong>Excellent Drivers</strong></p>
                     <p style="color: gray;font-size: 12px;">SCORE RANGE 90 - 100</p>
                   </div>
                   <div>${comment.excellentDrivers}</div>
                 </div>
                 <div style="display:flex;align-items:center;gap:50px;padding:10px;border-top:1px solid #574f4f;max-width:260px;">
                   <div>
                     <p><strong>Good Drivers</strong></p>
                     <p style="color: gray;font-size: 12px;">SCORE RANGE 77 - 89</p>
                   </div>
                   <div>${comment.goodDriver}</div>
                 </div>
                 <div style="display:flex;align-items:center;gap:50px;padding:10px;border-top:1px solid #574f4f;max-width:260px;">
                   <div>
                     <p><strong>Fair Drivers</strong></p>
                      <p style="color: gray;font-size: 12px;">SCORE RANGE 50 - 78</p>
                   </div>
                   <div>${comment.fairDrivers}</div>
                 </div>
                 <div style="display:flex;align-items:center;gap:50px;padding:10px;border-top:1px solid #574f4f;max-width:260px;">
                   <div>
                     <p><strong>Poor Drivers</strong></p>
                      <p style="color: gray;font-size: 12px;">SCORE RANGE 0 - 49</p>
                   </div>
                   <div>${comment.poorDriver}</div>
                 </div>
                </div>`;
      },
    },
    annotations: {
      yaxis: [{}],
      xaxis: [
        {
          x: "Aug 25",
          borderColor: "#000",
          strokeDashArray: 5,
        },
      ],
    },
  };

  if (!loading) {

    return (
      <Skeleton height={380} />
    )

  }

  return (
    <div className="chart">
      <Chart
        options={data}
        series={data.series}
        type="line"
        height={350}
        width={"100%"}
      />
    </div>
  );
};

export default SafetyScoreTrend;
