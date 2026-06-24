// EventsFilters Component
"use client";
import { DatePicker, formatDate } from "@/Components/date-picker";
import ClipLoader from "react-spinners/ClipLoader";
import { useEffect, useState, useCallback } from "react";

const EventsFilters = ({
  types,
  setEventDatas,
  Filters,
  dataLoad,
  setDateStart,
  setDateEnd,
  setTypes,
  setType,
  setTimeNow,
}) => {

  const [isMenuOpen, setMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".dropdown-menu") &&
        !event.target.closest(".btn-icon")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleExport = (type) => {
    setTypes(true);
    setType(type);
    setTimeNow(Date.now()); // Trigger refresh
    setMenuOpen(false); // Close menu after selection
  };

  return (
    <div>
      <div>
      </div>
      {types ? (
        <div className="loading-container d-flex align-items-center justify-content-center">
          <ClipLoader color="#007bff" size={30} />
        </div>
      ) : (
        <div className="events-filters d-flex justify-content-between position-relative">
          {/* Filters Section */}
          <div className="d-flex gap-2">
            <div>
              <DatePicker setDateEnd={setDateEnd} setDateStart={setDateStart} />
            </div>
            <Filters />
            {/* Render Filters here */}
          </div>

          {/* Export and Menu Section */}
          <div className="position-relative">
            <button
              onClick={toggleMenu}
              className="btn btn-sm btn-icon btn-active-color-primary"
              aria-expanded={isMenuOpen}
              aria-label="Toggle export menu"
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

export default EventsFilters;
