"use client";

import React from "react";
import Shadow from "@/app/Shadow/page";
import { Table, Image, Badge } from "react-bootstrap";
import "../style.css";
import Skeleton from "react-loading-skeleton";

type Props = {
  id: number;
  preview: string;
  behavior: string;
  severity: string;
  driver: string;
  vehicle: string;
  date: string;
  location: string;
  status: string;
}[];

const getStatusBadge = (status) => {
  if (status === "Coachable") {
    return (
      <Badge
        className="bg-red"
        color="red"
        style={{
          backgroundColor: "#ffecea !important",
          color: "red !important",
        }}
      >
        {status}
      </Badge>
    );
  } else if (status === "Pending review") {
    return (
      <Badge
        className="bg-orange"
        color="#7d5800"
        style={{
          backgroundColor: "#fff1cf !important",
          color: "#7d5800 !important",
        }}
      >
        {status}
      </Badge>
    );
  }
};

const EventsTable = ({ data, loading }: { data: Props; loading: any }) => {
  if (!loading) {
    return <Shadow header={6} val={8} />;
  }

  return (
    <div className="table-responsive event-table">
      <Table className="w-100">
        <thead>
          <tr>
            {/* <th style={{ width: "10%", paddingLeft: "15px" }}>Preview</th> */}
            <th style={{ width: "20%" }}>Behavior / Severity</th>
            <th style={{ width: "20%" }}>Driver / ID</th>
            <th style={{ width: "10%" }}>Vehicle</th>
            <th style={{ width: "25%" }}>Date (MDY CDT) / Location</th>
            {/* <th style={{ width: "15%" }}>Status</th> */}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr
                key={index}
                style={{ border: "1px solid #ebe4ee !important" }}
                onClick={() =>
                  (window.location.href = (item.behavior != 'SPEEDING' ? `/safety/event-details/${item.id}` : `/safety/speeding-details/${item.id}`))
                }
              >
                {/* <td style={{ paddingLeft: "15px", width: "10%", border: 0 }}>
                  <Image
                    src={"https://i.ibb.co/jg2Jm5z/truck-dashboard.png"}
                    rounded
                    fluid
                    style={{
                      height: "40px",
                      width: "80px",
                    }}
                  />
                </td> */}
                <td style={{ width: "20%", border: 0 }}>
                  <strong>{item.behavior}</strong> <br />
                  {/* <span
                    style={{
                      color: item.severity === "High" ? "red" : "orange",
                    }}
                  >
                    {item.severity}
                  </span> */}
                </td>
                <td style={{ width: "20%", border: 0 }}>
                  <a style={{ justifyContent: "left" }} href="#">
                    {item.driver}
                  </a>{" "}
                  N/A
                </td>
                <td style={{ width: "10%", border: 0 }}>{item.vehicle}</td>
                <td style={{ width: "25%", border: 0 }}>
                  {item.date} <br />
                  {item.location}
                </td>
                {/* <td style={{ width: "15%", border: 0, paddingRight: "15px" }}>
                  {getStatusBadge(item.status)}
                </td> */}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className="text-center d-flex justify-content-center align-items-center"
                style={{
                  textAlign: "center",
                  flex: "1 1 0%",
                  padding: "20px",
                  verticalAlign: "middle",
                  height: "100px",
                  // display: "flex",
                  // justifyContent: "center",
                  // alignItems: "center",
                }}
              >
                No data available
              </td>
            </tr>

          )}
        </tbody>
      </Table>
    </div>
  );
};

export default EventsTable;
