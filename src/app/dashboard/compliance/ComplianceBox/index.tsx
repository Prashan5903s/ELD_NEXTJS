"use client";

import React, { lazy } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CircularProgressChart = lazy(
  () => import("../../../../Components/GraphComponents/CircularProgressChart")
);

type NegativeLabel = {
  name: string;
  percentage: string;
  time: string;
};

type PositiveLabel = {
  name: string;
  percentage: string;
  time: string;
};

// Define the type for items in the dataSet array
type DataItem = {
  // Replace these with actual properties of dataSet items
  id: number; // Example property
  value: number; // Example property
};

interface ComplianceBoxProps {
  title: string;
  loading: boolean;
  dataSet: DataItem[];
  negativeLabel: NegativeLabel;
  positiveLabel: PositiveLabel;
  positivePercentage: number;
}

const ComplianceBox: React.FC<ComplianceBoxProps> = ({
  title,
  dataSet,
  loading,
  negativeLabel,
  positiveLabel,
  positivePercentage,
}) => {
  return (
    <div style={{ flex: "0 0 350px" }} className="border rounded p-8 mw-450px">
      <div className="d-flex justify-content-between">
        <h4 className="mb-0">{title}</h4>
        <a style={{ cursor: "pointer" }}>View details</a>
      </div>
      <div>
        <CircularProgressChart positivePercentage={positivePercentage} />
      </div>
      <div className="d-flex mt-2 align-items-center justify-content-between pb-1 border-top-0 border-start-0 border-end-0 border">
        <div className="d-flex gap-2 align-items-center">
          <span
            style={{ backgroundColor: "red" }}
            className="h-10px w-10px d-block"
          ></span>
          <span>{negativeLabel.name}</span>
        </div>
        <div>
          <span>{negativeLabel.percentage}</span>
        </div>
        <div>
          <span>{negativeLabel.time}</span>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between pb-1 mt-2">
        <div className="d-flex gap-2 align-items-center">
          <span
            style={{ backgroundColor: "#61c161" }}
            className="h-10px w-10px d-block"
          ></span>
          <span className="d-block w-75px">{positiveLabel.name}</span>
        </div>
        <div>
          <span>{positiveLabel.percentage}</span>
        </div>
        <div>
          <span>{positiveLabel.time}</span>
        </div>
      </div>
    </div>
  );
};

export default ComplianceBox;
