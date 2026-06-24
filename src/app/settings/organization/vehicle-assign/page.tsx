"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Shadow from "@/app/Shadow/page";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from 'next-auth/react';
import { debounce } from "lodash";
import { getPermissions } from "@/Components/permission/page";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

const VehicleAssignTable: React.FC = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL as string;
  const asset_url = process.env.NEXT_PUBLIC_ASSERT_URL as string;
  const router = useRouter();
  const [vehicleAssign, setVehicleAssign] = useState<VehicleAssign | null>(
    null
  );
  const [permissn, setPermissn] = useState<number[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const { data: session } = useSession() as { data?: SessionData } || {};

  const token = session && session.user && session?.user?.token;

  interface Driver {
    id: string;
    first_name: string;
    last_name: string;
  }

  interface Vehicle {
    id: string;
    name: string;
  }

  interface Assignment {
    driver_id: string;
    vechile_id: string;
    is_active: number;
    id: string;
  }

  interface VehicleAssign {
    drivers: Driver[];
    vehicles: Vehicle[];
    assignments: Assignment[];
  }

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
    }, 1000), // Increase debounce to 2 seconds
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchPermissions(token);
    }
  }, [fetchPermissions, token]);

  const fetchUsers = async () => {
    if (!token) {
      console.error("No token available");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${url}/settings/vehicle/assign`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        setVehicleAssign(response.data);
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 500), [url, token]);

  useEffect(() => {
    if (token) {
      debouncedFetchUsers();
    }
  }, [debouncedFetchUsers, token]);

  const columns = React.useMemo(
    () => [
      {
        header: "Driver",
        accessorKey: "driver",
        cell: (info) => {
          const driver = vehicleAssign?.drivers.find(
            (driver) => driver.id === info.row.original.driver_id
          );
          return driver ? (
            <div>
              {driver.first_name} {driver.last_name}
            </div>
          ) : (
            <Skeleton width={100} />
          );
        },
      },
      {
        header: "Vehicle",
        accessorKey: "vehicle",
        cell: (info) => {
          const vehicle = vehicleAssign?.vehicles.find(
            (vehicle) => vehicle.id === info.row.original.vechile_id
          );
          return vehicle ? <div>{vehicle.name}</div> : <Skeleton width={150} />;
        },
      },
      {
        header: "Status",
        accessorKey: "is_active",
        cell: (info) => (
          <div
            className={`badge badge-light-${info.getValue() === 1 ? "success" : "danger"
              }`}
          >
            {info.getValue() === 1 ? "Active" : "Inactive"}
          </div>
        ),
      },
      {
        header: "Actions",
        cell: (info) => (
          <div>
            {permissn.includes(28) ? (
              <Link
                href={`./vehicle-assign/${info.row.original.id}`}
                className="btn btn-light btn-active-light-primary btn-flex btn-center btn-sm"
              >
                Actions <i className="ki ki-outline ki-down fs-5 ms-1"></i>
              </Link>
            ) : (
              <Skeleton width={100} />
            )}
          </div>
        ),
      },
    ],
    [vehicleAssign, permissn]
  );

  const table = useReactTable({
    data: vehicleAssign?.assignments || [], // Ensure data is provided
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

  if (loading) {
    return (
      <div className="listItems">
        <div className="topBar">
          <div className="title">
            <h2>Vehicle Assignment Lists</h2>
            <div className="path">Dashboard Drivers</div>
          </div>
        </div>
        <div className="mainList">
          <div className="row mt-3 card card-flush card-body pt-0">
            <div className="searchBar">
              <div className="search">
                <input
                  className="form-control form-control-solid w-250px ps-12"
                  type="text"
                  placeholder="Search Vehicle Assignment"
                />
              </div>
              {permissn.includes(27) && (
                <div className="btnGroup">
                  <Link
                    href="./vehicle-assign/add-assign"
                    className="btn-primary"
                  >
                    <i
                      className="ki-outline ki-plus-square fs-3"
                      style={{ marginRight: "8px" }}
                    ></i>
                    Add Vehicle Assignment
                  </Link>
                </div>
              )}
            </div>
            <div className="dataTables_wrapper dt-bootstrap4 no-footer">
              <div className="table-responsive">
                <Shadow header={5} val={5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="listItems">
      <div className="topBar">
        <div className="title">
          <h2>Vehicle Assignment List</h2>
          <div className="path">Dashboard Drivers</div>
        </div>
      </div>
      <div className="mainList">
        <div className="row mt-3 card card-flush card-body pt-0">
          <div className="searchBar">
            <div className="search">
              <input
                className="form-control form-control-solid w-250px ps-12"
                type="text"
                placeholder="Search Vehicle Assignment"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
            {permissn.includes(27) && (
              <div className="btnGroup">
                <Link
                  href="./vehicle-assign/add-assign"
                  className="btn-primary"
                >
                  <i
                    className="ki-outline ki-plus-square fs-3"
                    style={{ marginRight: "8px" }}
                  ></i>
                  Add Vehicle Assignment
                </Link>
              </div>
            )}
          </div>
          <div className="dataTables_wrapper dt-bootstrap4 no-footer">
            <div className="table-responsive">
              <table
                className="table-row-dashed fs-6 gy-5 dataTable no-footer"
                id="kt_tr_u_table"
              >
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="text-gray-600 fw-semibold">
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
              <div className="pagination d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="d-flex py-4">
                    <select
                      className="form-select bg-gray-100 border-0"
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
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
                      const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
                      return `Showing ${startRow} to ${endRow} of ${totalRows} records`;
                    })()}
                  </div>
                </div>
                <nav aria-label="Table pagination">
                  <ul className="pagination mb-0">
                    <li
                      className={`page-item ${!table.getCanPreviousPage() ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <i className="fs-1 ki-left ki-outline"></i>
                      </button>
                    </li>
                    {Array.from({ length: table.getPageCount() }).map((_, index) => (
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
                    ))}
                    <li
                      className={`page-item ${!table.getCanNextPage() ? "disabled" : ""}`}
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
    </div>
  );
};

export default VehicleAssignTable;
