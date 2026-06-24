'use client'
import "../style.css";
import axios from "axios";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import TooltipWrapper from "@/Components/tooltip";
import React, { useState, useEffect, useCallback } from "react";
import Skeleton from "react-loading-skeleton";

const PerformanceLeaderBoard = ({ startDate, endDate }: { startDate: any, endDate: any, }) => {

  const [performData, setPerformData] = useState(null);
  const [datas, setDatas] = useState(null);
  const [loading, setLoading] = useState(false);
  

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

  const formatDateRange = (startDate, endDate) => {
    const options = { month: 'short', day: '2-digit' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const fetchReport = useCallback(
  
    debounce(async () => {
      setLoading(false);
      try {
        const response = await axios.get(`${url}/safety/driver/score/${startDate}/${endDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setPerformData(response.data);
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

  useEffect(() => {
    if (performData) {
      // Transform performData into an array of objects and sort them
      const transformedData = performData.map((item) => ({
        name: item[0],
        score: item[1],
        change: null,
        coaching: true
      }));

      // Sort lowestScores in ascending order by score
      const lowestScores = [...transformedData].sort((a, b) => a.score - b.score);

      // Sort highestScores in descending order by score
      const highestScores = [...transformedData].sort((a, b) => b.score - a.score);

      const data = {
        lowestScores,
        highestScores,
      };

      setDatas(data);

    }
  }, [performData]);


  const renderScoreSection = (title, scores = []) => (
    <div className="score-section">
      <div className="d-flex align-items-center justify-content-between">
        <h3>{title}</h3>
        <p style={{ textTransform: "uppercase", fontSize: "10px" }}>
          score vs. prev
        </p>
      </div>
      {scores.length > 0 ? (
        scores.map((item, index) => (
          // <TooltipWrapper tooltipText={toolTip(item)} key={index}>
          <div key={index} className="score-item">
            <div>
              <div>{item.name}</div>
              {/* <div className="coaching">
                  {item.coaching && "OVERDUE FOR COACHING"}
                </div> */}
            </div>
            <div className="score-n-value">
              <div className={`score ${item.score < 77 ? "blue" : "orange"}`}>
                {item.score % 1 !== 0 ? (item.score).toFixed(1) : (item.score)}
              </div>
              <div
                className="change"
                style={{ color: item.change > 0 ? "green" : "red" }}
              >
                {item.change === null ? (
                  <>--</>
                ) : (
                  <>
                    <span
                      style={{
                        color: item.change > 0 ? "green" : "red",
                        transform:
                          item.change > 0
                            ? "rotate(180deg) translateY(-1px)"
                            : "",
                        display: "inline-flex",
                      }}
                    >
                      ↓
                    </span>{" "}
                    <span style={{ display: "inline-flex" }}>
                      {item.change.toString().replace("-", "")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          // </TooltipWrapper>
        ))
      ) : (
        <div>No scores available</div> // Optional: Display message if no scores
      )}
    </div>
  );

  if (!loading) {

    return (
      <Skeleton height={160} />
    );

  }

  return (
    <div className="scores-container">
      {renderScoreSection("Lowest Scores", datas?.lowestScores)}
      {renderScoreSection("Highest Scores", datas?.highestScores)}
      {/* {renderScoreSection("Biggest Score Change", data.biggestScoreChange)} */}
    </div>
  );
};

// const toolTip = (item) => {
//   return (
//     <div
//       className="bg-black"
//       style={{
//         fontSize: "14px",
//         textAlign: "left",
//         color: "white",
//         borderRadius: "4px",
//       }}
//     >
//       {/* <div>{`${item.name} was last coached on Sep 29.`}</div>
//       <div className="mt-2">
//         {`${item.name} needs to be added to a group before they can be assigned to a coach.`}
//       </div> */}
//     </div>
//   );
// };

export default PerformanceLeaderBoard;
