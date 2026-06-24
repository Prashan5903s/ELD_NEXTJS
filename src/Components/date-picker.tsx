import { DateTime } from "luxon";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRangePicker } from "react-date-range";
import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  setDateStart: Dispatch<SetStateAction<string>>;
  setDateEnd: Dispatch<SetStateAction<string>>;
};

export const DatePicker = ({ setDateStart, setDateEnd }: Props) => {
  const [open, setOpen] = useState(false);

  const timeZone = 'America/Denver';

  const getTodayInUSTimezone = () => {
    return DateTime.now().setZone(timeZone).startOf("day").toJSDate();
  };

  const today = getTodayInUSTimezone();

  const toggleDatePicker = () => {
    setOpen(!open);
  };

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(today),
      endDate: new Date(today),
      key: "selection",
    },
  ]);

  const formatDates = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const handleSelect = (ranges) => {
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
  return (
    <div
      style={{ color: "#4b5675" }}
      className="border border-end-0 border-start-0"
    >
      <input
        type="text"
        role="button"
        readOnly
        onClick={toggleDatePicker}
        value={`${dateRange[0].startDate.toLocaleDateString()} - ${(dateRange[0].endDate.toLocaleDateString() > formatDates(today)) ? formatDates(today) : (dateRange[0].endDate.toLocaleDateString())}`}
        style={{
          padding: "5px",
          textAlign: "center",
          border: "2px solid #ccc",
          borderRadius: "4px",
          width: "200px",
        }}
      />
      {open && (
        <div style={{ position: "absolute", zIndex: 1000 }}>
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
  );
};

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
