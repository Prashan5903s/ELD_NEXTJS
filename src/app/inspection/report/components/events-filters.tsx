"use client";
import Filter from "@/Components/filter";
import { severity, statuses } from "../static-data";
import axios from "axios";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import { useEffect, useState, useCallback } from "react";
import { DatePicker, formatDate } from "@/Components/date-picker";

export const EventsFilters = ({
  setEventDatas,
  setType,
  setTimeNow,
  setTypes,
  types,
}) => {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const [data, setData] = useState(null);

  const [eventData, setEventData] = useState(null);

  const [timestamp, setTimestamp] = useState(Date.now()); // Add a timestamp to trigger re-render

  const [filterData, setFilterData] = useState(null);

  const [loading, setLoading] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [selectedBehaviour, setSelectedBehaviour] = useState(null);

  const today = new Date();

  const pastDate = new Date(today);

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

  const [isLoading, setIsLoading] = useState(false);

  const [date_start, setDateStart] = useState(formatDate(pastDate));

  const [date_end, setDateEnd] = useState(formatDate(today));

  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleExport = (type) => {
    setTypes(true);
    // setIsLoading(true);
    setType(type);
    setTimeNow(Date.now()); // Force re-render by updating timestamp
    setMenuOpen(false); // Close the menu after action
    // setTypes(false);
  };

  const formatDateRange = (startDate, endDate) => {
    const options = { month: "short", day: "2-digit" };
    return `${startDate.toLocaleDateString(
      "en-US",
      options
    )} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  const fetchReport = useCallback(
    debounce(async () => {
      setLoading(false);

      try {
        const response = await axios.get(`${url}/event/data/set`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setData(response.data);
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

  useEffect(() => {
    if (date_start && date_end) {
      setEventDatas([date_start, date_end, selectedDriver, selectedVehicle]);
    }
  }, [
    date_start,
    date_end,
    selectedDriver,
    selectedVehicle,
  ]);

  const behaviours = [
    { id: "HARDTURN", name: "HARDTURN" },
    { id: "HARDBRAKE", name: "HARDBRAKE" },
    { id: "SPEEDING", name: "SPEEDING" },
    { id: "HARDACCEL", name: "HARDACCEL" },
    { id: "HARDSTOP", name: "HARDSTOP" },
  ];

  useEffect(() => {
    if (data) {
      var driverData = data["driver"];

      const vehicleData = data["vehicle"];

      const drivers = [
        ...driverData.map((data) => ({
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
        })),
      ];

      const vehicles = [
        ...vehicleData.map((data) => ({
          id: data.id,
          name: `${data.name}`,
        })),
      ];

      setFilterData([drivers, vehicles]);

      // You can now use the 'drivers' array here, e.g., setting state or other operations
    }
  }, [data]);

  const handleDriverFilterChange = (selectedDrivers: number[] | string) => {
    setSelectedDriver(selectedDrivers); // Update the state with the selected drivers
  };

  const handleVehicleFilterChange = (selectedDrivers: number[]) => {
    if (!selectedDrivers || selectedDrivers.length === 0) {
      selectedDrivers = null; // Set to null if no drivers are selected
    }
    setSelectedVehicle(selectedDrivers);
  };

  // const handleSeverityFilterChange = (selectedValue: number[]) => {

  // };

  const handleBehavioursFilterChange = (selectedValue: string[]) => {
    setSelectedBehaviour(selectedValue);
  };

  // const handleStatusFilterChange = (selectedValue: number[]) => {

  // };

  if (!loading) {
    return <Skeleton height={60} />;
  }

  return (
    <div>
      {types ? (
        <div className="loading-container d-flex align-items-center justify-content-center">
          <ClipLoader color="#007bff" size={30} />
        </div>
      ) : (
        <div className="events-filters d-flex justify-content-between">
          {/* Filters Section */}
          <div className="d-flex gap-2">
            <div>
              <DatePicker setDateEnd={setDateEnd} setDateStart={setDateStart} />
            </div>
            <div>
              <Filter
                data={
                  filterData && filterData.length > 0
                    ? filterData[0] && filterData[0]
                    : []
                }
                value={selectedDriver}
                label="Driver"
                placeholder="Search Driver"
                onFilterChange={handleDriverFilterChange}
              />
            </div>
            <div>
              <Filter
                data={
                  filterData && filterData.length > 0
                    ? filterData[1] && filterData[1]
                    : []
                }
                value={selectedVehicle}
                label="Vehicle"
                placeholder="Search Vehicle"
                onFilterChange={handleVehicleFilterChange}
              />
            </div>
          </div>

          {/* Export and Menu Section */}
          <div>
            <button
              onClick={toggleMenu}
              className="btn btn-sm btn-icon btn-active-color-primary"
              aria-expanded={isMenuOpen}
            >
              <i className="ki-outline ki-dots-vertical fs-2"></i>
            </button>

            {isMenuOpen && (
              <div
                className="dropdown-menu show position-absolute end-0 mt-2"
                style={{ minWidth: "150px", zIndex: 1050 }}
              >
                <button
                  className="dropdown-item"
                  onClick={() => handleExport("pdf")}
                >
                  Export as PDF
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleExport("csv")}
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
