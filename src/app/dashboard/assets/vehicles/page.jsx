"use client";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import AddVehicleModal from "./vehicleForm/AddvehiclePopup";
import axios from "axios";
import Shadow from "@/app/Shadow/page";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import 'react-toastify/dist/ReactToastify.css';
import { getPermissions } from "@/Components/permission/page";
import { useSession } from 'next-auth/react';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ToggleSwitch from "@/Components/statustoggle";

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { ToastContainer } from "react-toastify";

const VehicleTable = () => {
  const [showModal, setShowModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [modalMode, setModalMode] = useState("add");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [permissn, setPermissn] = useState([]);

  const { data: session } = useSession() || {};

  const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

  const token = session && session.user && session?.user?.token;

  const fetchPermissions = useCallback(
    debounce(async (token) => {
      try {
        const perms = await getPermissions(token);
        setPermissn(perms);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          setTimeout(() => fetchPermissions(token), 5000); // Retry after 5 seconds
        } else {
          console.error("Error fetching permissions:", error);
        }
      }
    }, 500), // Increase debounce to 2 seconds
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchPermissions(token);
    }
  }, [fetchPermissions, token]);

  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const openModal = (mode, vehicleId = null) => {
    setModalMode(mode);
    setSelectedVehicleId(vehicleId);
    setShowModal(true);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const fetchVehicles = async () => {
    if (!token) return; // Ensure token is available

    setLoading(true);
    try {
      const response = await axios.get(`${url}/transport/vehicle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use debounce to limit the API calls
  const debouncedFetchVehicles = useCallback(debounce(fetchVehicles, 500), [
    token,
    url,
  ]);

  useEffect(() => {
    if (token) {
      debouncedFetchVehicles();
    }
  }, [debouncedFetchVehicles, token]);

  const updateVehiclesList = () => {
    debouncedFetchVehicles();
  };

  const LocationCell = ({ info }) => {

    const [address, setAddress] = useState(null);

    const locationData = info.getValue();

    // Ensure locationData is defined and not empty before parsing
    let vehData = {};

    if (locationData) {
      try {
        vehData = JSON.parse(locationData);
      } catch (error) {
        console.error("Invalid JSON data:", error);
      }
    } else {
      console.warn("No location data available.");
    }

    const fetchAddress = async (latitude, longitude) => {
      try {
        // Check if latitude and longitude are valid numbers
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Invalid coordinates');
        }

        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
          params: {
            latlng: `${latitude},${longitude}`,
            key: `${MapKey}`,
          },
        });

        const address = response.data.results[0]?.formatted_address || "Address not found";
        return address;
      } catch (error) {
        console.error("Error fetching address:", error);
        return "Error fetching address";
      }
    };

    useEffect(() => {
      // Ensure vehData contains valid GeoLocation data
      if (vehData?.GeoLocation?.Latitude && vehData?.GeoLocation?.Longitude) {
        // Only fetch address if Latitude and Longitude are valid
        fetchAddress(vehData.GeoLocation.Latitude, vehData.GeoLocation.Longitude)
          .then(setAddress)
          .catch((error) => console.error("Error fetching address:", error));
      } else {
        console.warn("Invalid or missing GeoLocation data.");
      }
    }, [vehData]);



    return (
      <div>
        {vehData && Object.keys(vehData).length > 0 ? (
          <>
            <div>
              {address || vehData.Address || "...."}
            </div>
          </>
        ) : (
          "..."
        )}
      </div>
    );
  };

  const columns = useMemo(
    () => [
      { header: "Name", accessorKey: "name" },
      {
        header: "Location",
        accessorKey: "latest_vehicle_log_history.location",
        cell: (info) => <LocationCell info={info} />, // Use the new component here
      },
      {
        header: "Current fuel",
        accessorKey: "latest_vehicle_log_history.obd_fuel",
        cell: (info) => {
          const fuelPercentage = info.getValue();

          return fuelPercentage ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "5px",
                  marginRight: "8px",
                }}
              >
                <div
                  style={{
                    width: `${fuelPercentage}%`,
                    height: "100%",
                    backgroundColor: "green",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
              <span>{fuelPercentage}%</span>
            </div>
          ) : (
            "...."
          );
        },
      },
      {
        header: "Moving status",
        accessorKey: "latest_vehicle_log_history.operating_states",
        cell: (info) => {
          const locData = info.getValue();
          let vehData = null;

          try {
            vehData = locData ? JSON.parse(locData) : null;
          } catch (error) {
            console.error("Invalid JSON data:", error);
          }

          return vehData && Object.keys(vehData).length > 0 ? (
            <div>
              {Object.keys(vehData).map((key) => (
                <div key={key}>
                  {vehData[key]?.Id === "IgnitionOff" ? (
                    <div className="badge badge-light-warning">Not moving</div>
                  ) : (
                    <div className="badge badge-light-success">Moving</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="badge badge-light-info">Pending</div>
          );
        },
      },
      {
        header: "Current driver",
        accessorKey: "latest_driver_shift_log.driver",
        cell: (info) => (
          <div>
            {info.getValue()
              ? `${info.getValue().first_name} ${info.getValue().last_name}`
              : "...."}
          </div>
        ),
      },
      { header: "VIN", accessorKey: "vin" },
      { header: "License Plate", accessorKey: "license_plate" },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info) => (
          <div className={`badge badge-light-${info.getValue() ? "success" : "danger"}`}>
            {info.getValue() ? "Active" : "Inactive"}
          </div>
        ),
      },
      {
        header: "Created",
        accessorKey: "created_at",
        cell: (info) => formattedDate(info.getValue()),
      },
      {
        header: "Actions",
        accessorKey: "",
        cell: (info) => {
          const { status, id } = info.row.original;
          return (
            <div>
              {permissn && permissn.length > 0 && permissn.includes(2) && (
                <button
                  className="btn btn-icon btn-active-light-primary w-30px h-30px me-3"
                  onClick={() => openModal("edit", id)}
                >
                  <i className="ki ki-outline ki-pencil fs-3"></i>
                </button>
              )}
              <ToggleSwitch
                status={status}
                vehicleId={id}
                updateVehiclesList={updateVehiclesList}
              />
            </div>
          );
        },
      },
    ],
    [formattedDate, permissn, openModal, updateVehiclesList]
  );

  // Create table instance
  const table = useReactTable({
    data: vehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      return String(value).toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  return (
    <>
      <ToastContainer />
      <div className="listItems">
        <div className="topBar">
          <div className="title">
            <h2>Vehicles List</h2>
            <div className="path">Dashboard Assets Vehicles</div>
          </div>
        </div>
        <div className="mainList">
          <div className="row mt-3 card card-flush card-body pt-0">
            <div className="searchBar">
              <div className="search" id="search-container">
                <input
                  type="text"
                  value={globalFilter || ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search..."
                  className="form-control"
                />
              </div>
              {permissn && permissn.length > 0 && permissn.includes(1) && (
                <div className="btnGroup">
                  <button
                    onClick={() => openModal("add")}
                    className="btn-primary"
                  >
                    <i
                      className="ki-outline ki-plus-square fs-3 mr-2"
                      style={{ marginRight: "8px" }}
                    ></i>
                    Add Vehicle
                  </button>
                </div>
              )}
            </div>
            <div className="dataTables_wrapper dt-bootstrap4 no-footer">
              <div className="table-responsive">
                {loading ? (
                  <Shadow header={5} val={5} />
                ) : (
                  <table className="align-middle table-row-dashed fs-6 gy-5 mb-0 dataTable no-footer">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="text-muted min-w-125px">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={table.getAllColumns().length}
                            style={{ textAlign: "center", padding: "20px" }}
                          >
                            No data available
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
                <div className="pagination d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="d-flex py-4">
                      <select
                        className="form-select bg-gray-100 border-0"
                        value={table.getState().pagination.pageSize}
                        onChange={(e) =>
                          table.setPageSize(Number(e.target.value))
                        }
                        style={{ width: "auto", display: "inline-block" }}
                      >
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <option key={pageSize} value={pageSize}>
                            {pageSize}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ms-4 py-4">
                      {(() => {
                        const pageSize = table.getState().pagination.pageSize;
                        const pageIndex = table.getState().pagination.pageIndex;
                        const totalRows = table.getCoreRowModel().rows.length;
                        const startRow = pageIndex * pageSize + 1;
                        const endRow = Math.min(
                          (pageIndex + 1) * pageSize,
                          totalRows
                        );
                        return `Showing ${startRow} to ${endRow} of ${totalRows} records`;
                      })()}
                    </div>
                  </div>
                  <nav aria-label="Table pagination">
                    <ul className="pagination mb-0">
                      <li
                        className={`page-item ${!table.getCanPreviousPage() ? "disabled" : ""
                          }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <i className="fs-1 ki-left ki-outline"></i>
                        </button>
                      </li>
                      {Array.from({ length: table.getPageCount() }).map(
                        (_, index) => (
                          <li
                            key={index}
                            className={`page-item ${table.getState().pagination.pageIndex === index
                              ? "active p-0 btn-primary"
                              : ""
                              }`}
                          >
                            <button
                              className={`page-link ${table.getState().pagination.pageIndex === index
                                ? "p-0 btn-primary text-white"
                                : ""
                                }`}
                              onClick={() => table.setPageIndex(index)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        )
                      )}
                      <li
                        className={`page-item ${!table.getCanNextPage() ? "disabled" : ""
                          }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          <i className="fs-1 ki-right ki-outline"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showModal && (
          <AddVehicleModal
            id={selectedVehicleId}
            open={showModal}
            close={toggleModal}
            updateVehiclesList={updateVehiclesList}
          />
        )}
      </div>
    </>
  );
};

export default VehicleTable;
