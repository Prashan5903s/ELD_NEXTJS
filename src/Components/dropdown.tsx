import React, { useState, useRef, useEffect, ReactNode } from "react";

interface StatusOption {
  label: string;
  icon: ReactNode;
}

const Dropdown = ({ data }: { data: StatusOption[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(data[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(
    undefined
  );

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleStatusSelect = (status: StatusOption) => {
    setSelectedStatus(status);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Set the dropdown width to match the button width
    if (buttonRef.current) {
      setDropdownWidth(buttonRef.current.offsetWidth);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        style={{
          border: "none",
          background: "#0073e7",
          borderRadius: "4px",
          minWidth: "160px",
          width: "100%",
        }}
        className="d-flex gap-3 justify-content-between align-items-center border-0 flex items-center px-4 py-2 bg-blue-500 text-white rounded-md focus:outline-none"
        onClick={toggleDropdown}
      >
        <span className="mr-2">{selectedStatus.icon}</span>
        {selectedStatus.label}
        <span className="ml-2">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5.44199 8.04248L4.55811 8.92637L9.38184 13.7501H10.6183L15.442 8.92637L14.5581 8.04248L10.0001 12.6005L5.44199 8.04248Z"></path>
          </svg>
        </span>
      </button>
      {isOpen && (
        <div
          className="absolute mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-10"
          style={{ width: dropdownWidth, position: "absolute" }}
        >
          {data.map((status) => (
            <div
              key={status.label}
              onClick={() => handleStatusSelect(status)}
              className={`d-flex gap-3 items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                selectedStatus.label === status.label ? "bg-gray-100" : ""
              }`}
            >
              <span className="mr-2">{status.icon}</span>
              {status.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
