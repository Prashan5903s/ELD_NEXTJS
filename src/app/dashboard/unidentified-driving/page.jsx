"use client";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import UpdateUnidentifiedDriving from "./unidentifiedForm/AddUnidentifiedDrivingPopup";
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

const UndefinedDrivingTable = () => {
  const [showModal, setShowModal] = useState(false);
  const [unidentifiedDriving, setUnidentifiedDriving] = useState([]);
  const [modalMode, setModalMode] = useState("add");
  const [unidentifiedField, setUnidentifiedField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [permissn, setPermissn] = useState([]);

  const { data: session } = useSession() || {};

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

  const openModal = (mode, data = null) => {
    setUnidentifiedField(data);
    setModalMode(mode);
    setShowModal(true);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const fetchVehicles = async () => {
    if (!token) return; // Ensure token is available

    setLoading(true);
    try {
      const response = await axios.get(`${url}/transport/unidentified/driving/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnidentifiedDriving(response.data.driverLog || []);
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

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "vehicle",
        cell: (info) => {
          const vehicle = info.getValue();
          return (
            <div>
              {vehicle.name}
            </div>
          )
        }
      },
      {
        header: "Duty status",
        accessorKey: "option",
        cell: (info) => {
          const status = info.getValue();
          return (
            <div>
              {status.title}
            </div>
          )
        }
      },
      {
        header: "Time",
        accessorKey: "start_log_time",
        cell: (info) => {
          return (
            <div>
              {formattedDate(info.getValue())}
            </div>
          )
        }
      },
      {
        header: "Actions",
        accessorKey: "action",
        cell: (info) => {
          return (
            <div>
              {permissn && permissn.length > 0 && permissn.includes(2) && (
                <button
                  className="btn btn-icon btn-active-light-primary w-30px h-30px me-3"
                  onClick={() => openModal("edit", info.row.original)}
                >
                  <i className="ki ki-outline ki-pencil fs-3"></i>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [formattedDate, permissn, openModal, updateVehiclesList]
  );

  // Create table instance
  const table = useReactTable({
    data: unidentifiedDriving,
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
            <h2>Unidentified driving List</h2>
            <div className="path">Dashboard Assets Unidentified driving</div>
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
          <UpdateUnidentifiedDriving
            unidentifiedDriving={unidentifiedField}
            open={showModal}
            close={toggleModal}
            updateVehiclesList={updateVehiclesList}
          />
        )}
      </div>
    </>
  );
};

export default UndefinedDrivingTable;
