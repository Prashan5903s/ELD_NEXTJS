'use client'
import Filter from "@/Components/filter";
import {
  severity,
  statuses,
} from "../static-data";
import axios from "axios";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import { useEffect, useState, useCallback } from "react";
import { DatePicker, formatDate } from "@/Components/date-picker";

export const EventsFilters = ({ setEventDatas }) => {

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const [data, setData] = useState(null);

  const [eventData, setEventData] = useState(null);

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

  const [date_start, setDateStart] = useState(formatDate(pastDate));

  const [date_end, setDateEnd] = useState(formatDate(today));

  const formatDateRange = (startDate, endDate) => {
    const options = { month: 'short', day: '2-digit' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
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

      setEventDatas([
        date_start,
        date_end,
        selectedDriver,
        selectedVehicle,
        selectedBehaviour
      ])

    }

  }, [date_start, date_end, selectedDriver, selectedVehicle, selectedBehaviour])

  const behaviours = [
    { id: 'HARDTURN', name: "HARDTURN" },
    { id: 'HARDBRAKE', name: "HARDBRAKE" },
    { id: 'SPEEDING', name: "SPEEDING" },
    { id: 'HARDACCEL', name: "HARDACCEL" },
    { id: 'HARDSTOP', name: "HARDSTOP" },
  ];


  useEffect(() => {
    if (data) {

      var driverData = data['driver'];

      const vehicleData = data['vehicle'];

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

    return (
      <Skeleton height={60} />
    );

  }


  return (
    <div className="events-filters">
      <DatePicker setDateEnd={setDateEnd} setDateStart={setDateStart} />
      <Filter
        data={filterData && filterData.length > 0 ? (filterData[0] && filterData[0]) : []}
        value={selectedDriver}
        label="Driver"
        placeholder="Search Driver"
        onFilterChange={handleDriverFilterChange} // Ensure that this will pass number[] directly
      />

      <Filter
        data={filterData && filterData.length > 0 ? (filterData[1] && filterData[1]) : []}
        value={selectedVehicle}
        label="Vehicle"
        placeholder="Search Vehicle"
        onFilterChange={handleVehicleFilterChange}
      />
      {/* <Filter
        data={severity}
        label="Severity"
        placeholder="Search Severity"
        onFilterChange={handleSeverityFilterChange}
      /> */}
      <Filter
        data={behaviours}
        value={selectedBehaviour}
        label="Behaviours"
        placeholder="Search Behaviours"
        onFilterChange={handleBehavioursFilterChange}
      />
      {/* <Filter
        data={statuses}
        label="Status"
        placeholder="Search Status"
        onFilterChange={handleStatusFilterChange}
      /> */}
    </div>
  );
};
