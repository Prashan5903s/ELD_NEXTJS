"use client";
import { severity, statuses } from "../static-data";
import axios from "axios";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import ClipLoader from "react-spinners/ClipLoader";
import { useEffect, useState, useCallback } from "react";
import Filter from "@/Components/filter";
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
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState(null);

  const [selectedFuelType, setSelectedFuelType] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(null);

  const today = new Date();
  const pastDate = new Date(today);

  interface User {
    token: string;
  }

  interface SessionData {
    user?: User;
  }

  const { data: session } = (useSession() as { data?: SessionData }) || {};
  const token = session?.user?.token;

  const [isLoading, setIsLoading] = useState(false);
  const [date_start, setDateStart] = useState(formatDate(pastDate));
  const [date_end, setDateEnd] = useState(formatDate(today));

  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleExport = (type) => {
    setTypes(true); // Set `types` to true
    setIsLoading(true);
    setType(type);
    setTimeNow(Date.now());
    setMenuOpen(false);
  };

  useEffect(() => {
    if (isLoading) {
      setTypes(isLoading);
    }
    setIsLoading(false);
  }, [isLoading, types]);

  const fetchReport = useCallback(
    debounce(async () => {
      setLoading(false);

      try {
        const response = await axios.get(`${url}/mileage/filter`, {
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
      setEventDatas([
        date_start,
        date_end,
        selectedJurisdiction,
        selectedVehicle,
        selectedFuelType,
      ]);
    }
  }, [
    date_start,
    date_end,
    selectedJurisdiction,
    selectedVehicle,
    selectedFuelType,
  ]);

  useEffect(() => {
    if (data) {
      const vehicleData = data["vehicle"];
      const fuelType = data["fuelType"];
      const state = data["states"];

      const vehicles = vehicleData.map((data) => ({
        id: data.id,
        name: `${data.name}`,
      }));

      const states = state.map((data) => ({
        id: `${data}`,
        name: `${data}`,
      }));

      const fuel_type = fuelType.map((data) => ({
        id: data.option_id,
        name: `${data.title}`,
      }));

      setFilterData([vehicles, states, fuel_type]);
    }
  }, [data]);

  const handleFuelTypeFilterChange = (selectedFuelType) => {
    setSelectedFuelType(selectedFuelType);
  };

  const handleVehicleFilterChange = (selectedVehicles) => {
    setSelectedVehicle(selectedVehicles.length > 0 ? selectedVehicles : null);
  };

  const handleJurisdictionFilterChange = (selectedJurisdiction) => {
    setSelectedJurisdiction(selectedJurisdiction);
  };

  if (types === true) {
    // Show loading container when `types` is true
    return (
      <div className=" d-flex align-items-center justify-content-center">
        <ClipLoader />
      </div>
    );
  }

  if (!loading) {
    return <Skeleton height={60} />;
  }

  return (
    <div>
      <div className="events-filters d-flex justify-content-between">
        {/* Filters Section */}
        <div className="d-flex gap-2">
          <div>
            <DatePicker setDateEnd={setDateEnd} setDateStart={setDateStart} />
          </div>
          <div className="d-flex gap-4">
            <div>
              <Filter
                data={filterData?.[0] || []}
                value={selectedVehicle}
                label="Vehicle"
                placeholder="Search Vehicle"
                onFilterChange={handleVehicleFilterChange}
              />
            </div>
            <div>
              <Filter
                data={filterData?.[1] || []}
                value={selectedJurisdiction}
                label="Jurisdiction"
                placeholder="Search Jurisdiction"
                onFilterChange={handleJurisdictionFilterChange}
              />
            </div>
            <div>
              <Filter
                data={filterData?.[2] || []}
                value={selectedFuelType}
                label="Fuel type"
                placeholder="Search Fuel type"
                onFilterChange={handleFuelTypeFilterChange}
              />
            </div>
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
    </div>
  );
};
