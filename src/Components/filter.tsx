import React, { useState, useEffect, useRef } from "react";
import "./filters-styles.css";

type FilterItem = {
  id: any;
  name: string;
};

type FilterProps = {
  data: FilterItem[];
  label: string;
  placeholder: string;
  value: any;
  onFilterChange?: (selectedItems: any[] | null) => void; // Allow null as a type
};

const Filter: React.FC<FilterProps> = ({
  data,
  label,
  placeholder,
  onFilterChange,
  value, // Add the value prop
}) => {
  const [selectedItems, setSelectedItems] = useState<any[]>(value || []); // Initialize from the value prop
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selectedItems with value when the prop changes
  useEffect(() => {
    setSelectedItems(value || []);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectItem = (id: any) => {
    const updatedSelectedItems = selectedItems.includes(id)
      ? selectedItems.filter((itemId) => itemId !== id)
      : [...selectedItems, id];
    setSelectedItems(updatedSelectedItems);

    if (onFilterChange) {
      onFilterChange(updatedSelectedItems.length > 0 ? updatedSelectedItems : null);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
    if (onFilterChange) {
      onFilterChange(null); // Send null instead of an empty array
    }
  };

  const filteredItems = data && data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        style={{
          padding: "6px 12px",
          background: "white",
          border: "1px solid #ebe4ee",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "4px",
        }}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {label} {selectedItems.length > 0 && `(${selectedItems.length})`}
        <div>
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 20 20"
            fill="rgba(0, 0, 0, 0.63)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5.44199 8.04248L4.55811 8.92637L9.38184 13.7501H10.6183L15.442 8.92637L14.5581 8.04248L10.0001 12.6005L5.44199 8.04248Z"></path>
          </svg>
        </div>
      </button>

      {isDropdownOpen && (
        <div
          style={{
            border: "none",
            borderRadius: "4px",
            marginTop: "4px",
            backgroundColor: "white",
            position: "absolute",
            zIndex: 10,
            width: "200px",
            boxShadow:
              "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px",
          }}
        >
          <input
            type="text"
            placeholder={placeholder}
            className="filter-input"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ maxHeight: "175px", overflowY: "auto" }}>
            {filteredItems && filteredItems.map((item) => (
              <div key={item.id} style={{ marginBottom: "8px" }}>
                <label className="d-flex gap-3 filter-label">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                  {item.name}
                </label>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "8px",
              textAlign: "left",
              padding: selectedItems.length > 0 ? "8px 8px 8px 8px" : 0,
              borderTop:
                selectedItems.length > 0 ? "1px solid #ebe4ee" : "none",
            }}
          >
            {selectedItems.length > 0 && (
              <>
                <span>{selectedItems.length} Selected</span> ·{" "}
                <button
                  onClick={handleClearSelection}
                  style={{
                    color: "blue",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default Filter;
