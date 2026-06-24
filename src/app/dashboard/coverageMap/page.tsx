"use client";

import { DateTime } from "luxon";
import { debounce } from "lodash";
import Form from "react-bootstrap/Form";
import { useSession } from "next-auth/react";
import MapWithSearchBar from "./MapWithSearchBar";
import { DateRangePicker } from "react-date-range";
import { getMarkCoordinates } from "./MapWithSearchBar/constants";
import React, { useState, useEffect, useCallback, useRef } from "react";

export interface MarkCoordinate {
  lat: number;
  lng: number;
  label?: string;
}

interface User {
  token: string;
}

interface SessionData {
  user?: User;
}

const Page = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [filteredCoordinates, setFilteredCoordinates] = useState<
    MarkCoordinate[]
  >([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    MarkCoordinate[]
  >([]);
  const [toggleRightBar, setToggleRightBar] = useState(true);

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [isHybrid, setIsHybrid] = useState(false);

  const { data: session } = (useSession() as { data?: SessionData }) || {};

  const token = session && session.user && session?.user?.token;

  const timeZone = 'America/Denver';

  const getTodayInUSTimezone = () => {
    return DateTime.now().setZone(timeZone).startOf("day").toJSDate();
  };

  const today = getTodayInUSTimezone();

  const fetchCoordinates = useCallback(
    debounce(async (start, end, token) => {
      try {
        const coordinates = await getMarkCoordinates(start, end, token);
        setFilteredCoordinates(coordinates);
      } catch (error) {
        console.error("Error fetching coordinates:", error);
      }
    }, 1000), // Adjust the debounce delay as needed
    [token]
  );

  // Use useEffect to trigger the debounced fetch function
  useEffect(() => {
    if (dateStart && dateEnd && token) {
      fetchCoordinates(dateStart, dateEnd, token);
    }
  }, [dateStart, dateEnd, fetchCoordinates, token]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    const filtered = filteredCoordinates.filter((coord) =>
      coord.label?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredCoordinates(filtered);
  };

  const handleCheckboxChange = (coordinate: MarkCoordinate) => {
    setSelectedCoordinates((prev) => {
      const updated = new Set(prev.map((c) => JSON.stringify(c)));
      const coordinateStr = JSON.stringify(coordinate);

      if (updated.has(coordinateStr)) {
        updated.delete(coordinateStr);
      } else {
        updated.add(coordinateStr);
      }

      return Array.from(updated).map((c) => JSON.parse(c));
    });
  };

  const toggleMapview = () => {
    if (map) {
      map.setMapTypeId("roadmap");
    }
  };

  const toggleSateLiteView = () => {
    if (map) {
      map.setMapTypeId("hybrid");
    }
  };

  const formatDates = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(today),
      endDate: new Date(today),
      key: "selection",
    },
  ]);
  const [open, setOpen] = useState(false);

  const toggleDatePicker = () => {
    setOpen(!open);
  };

  const handleSelect = (ranges: any) => {
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

  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 7);

  useEffect(() => {
    setDateStart(formatDate(today));
    setDateEnd(formatDate(today));
  }, []);

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <>
      <div
        className="h-100 d-flex gap-5 coverage-map-wrapper"
        ref={containerRef}
      >
        <div
          style={toggleRightBar ? { width: "75%" } : { width: "100%" }}
          className="map-section"
        >
          {selectedCoordinates.length ? (
            <MapWithSearchBar
              selectedCoordinates={selectedCoordinates}
              map={map}
              setMap={setMap}
            />
          ) : (
            <MapWithSearchBar
              selectedCoordinates={filteredCoordinates}
              map={map}
              setMap={setMap}
            />
          )}
        </div>
        <div
          style={
            toggleRightBar ? { width: "25%" } : { width: "0%", display: "none" }
          }
          className="right-bar"
        >
          <div className="d-flex flex-column justify-content-between align-items-center mb-5">
            <div>
              <h1 className="m-0">Map Options</h1>
            </div>

            <div className="w-100 bg-white d-flex mt-5">
              <div
                style={{
                  cursor: "pointer",
                  background: `${!isHybrid ? "rgb(70 83 146)" : "#e5e7ee"}`,
                  transition: "all 0.5s",
                }}
                className="w-50 d-flex justify-content-center align-items-center"
                onClick={() => {
                  setIsHybrid(false);
                  toggleMapview();
                }}
              >
                <h6
                  style={{
                    color: `${!isHybrid ? "white" : ""}`,
                    fontWeight: 400,
                    transition: "all 0.5s",
                  }}
                  className="mb-0 p-1 py-3"
                >
                  Map
                </h6>
              </div>
              <div
                style={{
                  cursor: "pointer",
                  background: `${isHybrid ? "rgb(70 83 146)" : "#e5e7ee"}`,
                  transition: "all 0.5s",
                }}
                className="w-50 d-flex justify-content-center align-items-center mb-0"
                onClick={() => {
                  setIsHybrid(true);
                  toggleSateLiteView();
                }}
              >
                <h6
                  style={{
                    color: `${isHybrid ? "white" : ""}`,
                    fontWeight: 400,
                    transition: "all 0.5s",
                  }}
                  className="mb-0 p-1 py-3"
                >
                  Satelite
                </h6>
              </div>
            </div>

            <div className="d-flex align-items-stretch position-relative pt-5">
              <i
                style={{ marginTop: "6px" }}
                className="ki-outline ki-magnifier search-icon fs-2 text-gray-500 position-absolute top-50 translate-middle-y ms-2"
              ></i>
              <input
                placeholder="Search assets"
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "10px",
                  background: "#f6f7f9",
                  boxShadow: "none",
                  paddingLeft: "30px",
                  marginRight: 0,
                  width: "100%",
                }}
              />
            </div>

            <div
              style={{
                color: "#4b5675",
                maxWidth: "100%",
              }}
              className="pt-4"
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
                  width: "100%",
                }}
              />
              {open && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    top: "50px",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
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

          <Form>
            <div className="mb-3 mt-5">
              {filteredCoordinates.map((data) => (
                <Form.Check
                  key={data.label}
                  className="mb-5 text-secondary"
                  type="checkbox"
                  id={data.label}
                  label={data.label}
                  checked={selectedCoordinates.some(
                    (c) => JSON.stringify(c) === JSON.stringify(data)
                  )}
                  onChange={() => handleCheckboxChange(data)}
                />
              ))}
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export default Page;
