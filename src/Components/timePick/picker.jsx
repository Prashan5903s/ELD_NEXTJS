'use client'
import React, { useState } from 'react';
import Select from 'react-select';

// Define your options for hours, minutes, and AM/PM
const hoursOptions = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString().padStart(2, '0'),
  label: (i + 1).toString().padStart(2, '0'),
}));

const minutesOptions = Array.from({ length: 60 }, (_, i) => ({
  value: i.toString().padStart(2, '0'),
  label: i.toString().padStart(2, '0'),
}));

const amPmOptions = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

const CustomTimePicker = () => {
  const [selectedHour, setSelectedHour] = useState(hoursOptions[0]);
  const [selectedMinute, setSelectedMinute] = useState(minutesOptions[0]);
  const [selectedAmPm, setSelectedAmPm] = useState(amPmOptions[0]);

  return (
    <div className="mb-5 row">
      <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
        Start Time
      </label>
      <div className="col-lg-10 col-md-12 col-sm-12">
        <div className="d-flex align-items-center">
          <Select
            options={hoursOptions}
            value={selectedHour}
            onChange={setSelectedHour}
            className="time-select"
            styles={customSelectStyles}
            placeholder="HH"
          />
          <span className="mx-2">:</span>
          <Select
            options={minutesOptions}
            value={selectedMinute}
            onChange={setSelectedMinute}
            className="time-select"
            styles={customSelectStyles}
            placeholder="MM"
          />
          <Select
            options={amPmOptions}
            value={selectedAmPm}
            onChange={setSelectedAmPm}
            className="time-select"
            styles={customSelectStyles}
          />
        </div>
      </div>
    </div>
  );
};

const customSelectStyles = {
  control: (base) => ({
    ...base,
    minWidth: 60,
    margin: '0 5px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'black',
  }),
};

export default CustomTimePicker;
