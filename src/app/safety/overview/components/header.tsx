"use client";

import "../style.css";
import { DateTime } from "luxon";
import "react-date-range/dist/styles.css";
import { useEffect, useState } from "react";
import "react-date-range/dist/theme/default.css";
import { DateRangePicker } from "react-date-range";

type Props = {
  safetyScores: {
    scores: number;
    label: string;
    scroreVariation: number;
  };
  subItems: (
    | {
      id: number;
      label: string;
      value: string;
      valueInPercentage: number;
    }
    | {
      id: number;
      label: string;
      value: number;
      valueInPercentage: number;
    }
  )[];
};

const SafetyHeader = ({ data, setStartDate, setEndDate, date1, date2 }: { data: Props, setStartDate: any, setEndDate: any, date1: any, date2: any }) => {

  const [open, setOpen] = useState(false);

  const timeZone = 'America/Denver';

  const getTodayInUSTimezone = () => {
    return DateTime.now().setZone(timeZone).startOf("day").toJSDate();
  };

  const today = getTodayInUSTimezone();

  const pastDate = new Date(today);

  const [date_start, setDateStart] = useState(formatDate(pastDate));
  const [date_end, setDateEnd] = useState(formatDate(today));
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (data) {
      setLoading(true);
    }

  }, [data])

  const formatDateRange = (startDate, endDate) => {
    const options = { month: 'short', day: '2-digit' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(today),
      endDate: new Date(today),
      key: "selection",
    },
  ]);

  const toggleDatePicker = () => {
    setOpen(!open);
  };

  useEffect(() => {
    if (date1 && date2) {
      setDateRange([
        {
          startDate: new Date(date1),
          endDate: new Date(date2),
          key: "selection",
        },
      ]);

      setDateStart(date1);

      setDateEnd(date2);

    }
  }, [date1, date2]);

  const handleSelect = (ranges) => {
    setDateRange([ranges.selection]);

    let startDate = formatDate(ranges.selection.startDate);
    let endDate = formatDate(ranges.selection.endDate);

    const todayFormatted = formatDate(today);

    // Prevent selection beyond today
    if (endDate > todayFormatted) {
      endDate = todayFormatted;
    }

    setStartDate(startDate);
    setEndDate(endDate);

    setDateStart(startDate);

    setDateEnd(endDate);

    setOpen(false);
  };

  return (
    <div className="safety-header">
      <div className="safety-score">
        <p>SAFETY SCORES</p>
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div>
            <h1>{((data.safetyScores.scores).toFixed(1))}</h1>
          </div>
          <div className="marking">
            {/* <svg
              _ngcontent-ysn-c441=""
              width="9"
              height="10"
              viewBox="0 0 9 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform:
                  data.safetyScores.scroreVariation < 0
                    ? "rotate(180deg) translateY(-1px)"
                    : "",
              }}
            >
              <path
                color={data.safetyScores.scroreVariation < 0 ? "red" : "green"}
                _ngcontent-ysn-c441=""
                d="M3.643 9.5h1.27V3.104l2.425 2.424.869-.877L4.278.72.341 4.652l.886.877 2.416-2.424V9.5z"
                fill="currentColor"
              ></path>
            </svg>
            <strong
              style={{
                display: "block",
                color: data.safetyScores.scroreVariation < 0 ? "red" : "green",
              }}
            >
              {data.safetyScores.scroreVariation.toString().replace("-", "")}
            </strong> */}
          </div>
        </div>
        <p>{data.safetyScores.label} </p>
      </div>
      <div className="safety-header-right-side">
        <div className="safety-date-section">
          <div style={{ fontWeight: 800 }}> {formatDateRange(new Date(date_start), new Date(date_end))}</div>
          <div>
            <div
              style={{ color: "#4b5675" }}
              className="border border-end-0 border-start-0"
            >
              <input
                type="text"
                role="button"
                readOnly
                onClick={toggleDatePicker}
                value={`${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`}
                style={{
                  padding: "5px",
                  textAlign: "center",
                  border: "2px solid #ccc",
                  borderRadius: "4px",
                  width: "200px",
                }}
              />
              {open && (
                <div style={{ position: "absolute", right: 0, zIndex: 1000 }}>
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
          </div>
        </div>
        <div className="safety-sub-items">
          {data.subItems.map((data, index) => {
            return (
              <div key={data.id}>
                <div>
                  <p>
                    <strong>{data.label}</strong>
                  </p>
                  <p>
                    {data.value}
                    {data.valueInPercentage !== null && (
                      <>
                        {/* <svg
                          _ngcontent-ysn-c441=""
                          width="9"
                          height="10"
                          viewBox="0 0 9 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            marginBottom: "3px",
                            marginLeft: "5px",
                            transform:
                              data.valueInPercentage < 0
                                ? "rotate(180deg) translateY(-1px)"
                                : "",
                          }}
                        >
                          <path
                            color={data.valueInPercentage > 0 ? "green" : "red"}
                            _ngcontent-ysn-c441=""
                            d="M3.643 9.5h1.27V3.104l2.425 2.424.869-.877L4.278.72.341 4.652l.886.877 2.416-2.424V9.5z"
                            fill="currentColor"
                          ></path>
                        </svg>
                        {data.valueInPercentage !== null &&
                          data.valueInPercentage.toString().replace("-", "") +
                          "%"} */}
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export default SafetyHeader;
