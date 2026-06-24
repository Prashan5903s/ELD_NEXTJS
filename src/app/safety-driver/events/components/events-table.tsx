"use client";

import React, { useEffect } from "react";
import Shadow from "@/app/Shadow/page";
import { Table, Image, Badge } from "react-bootstrap";
import "../style.css";
import Skeleton from "react-loading-skeleton";

type Props = {
  short_name: string;
  title: string;
}[];

const EventsTable = ({ data, loading }: { data: Props; loading: any }) => {
  if (!loading) {
    return <Shadow header={6} val={8} />;
  }



  return (
    <div className="table-responsive event-table">
      <Table className="w-100">
        <thead>
          <tr
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <th
              style={{
                width: "20%",
              }}
            >
              Behaviors
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr
                key={index}
                style={{
                  border: "1px solid #ebe4ee !important",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={() =>
                  (window.location.href = `/safety-driver/events-table/${item.short_name}`)
                }
              >
                <td style={{ width: "20%", border: 0 }}>
                  <strong>{item.short_name}</strong> <br />
                </td>
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
