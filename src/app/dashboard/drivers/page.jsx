"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from 'next-auth/react';
import Shadow from "@/app/Shadow/page";
import { debounce } from "lodash";
import { getPermissions } from "@/Components/permission/page";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ToastContainer } from "react-toastify";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

const DriverTable = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const asset_url = process.env.NEXT_PUBLIC_ASSERT_URL;
  const router = useRouter();
  const [driver, setDriver] = useState([]);
  const [permissn, setPermissn] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  const fetchPermissions = useCallback(
    debounce(async (token) => {
      try {
        const perms = await getPermissions(token);
        setPermissn(perms);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.warn("Rate limit hit, retrying in 5 seconds...");
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

  const fetchUsers = useCallback(
    debounce(async () => {
      setLoading(true);
      try {

        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await axios.get(`${url}/driver`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setDriver(response.data.user);
        } else {
          console.error("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }, 1000),
    [url, token]
  );

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [fetchUsers, token]);

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

  const columns = React.useMemo(
    () => [
      {
        header: "User & Roles",
        accessorKey: "first_name", // Placeholder, not used in cell rendering
        cell: (info) => {
          const { first_name, last_name, email, avatar_image, id } =
            info.row.original; // Access the correct data
          return permissn && permissn.length > 0 && permissn.includes(36) ? (
            <div className="d-flex align-items-center">
              <Link href={`/dashboard/drivers/detail/${id}`} legacyBehavior>
                <a className="d-flex align-items-center text-reset text-decoration-none">
                  <div className="symbol symbol-circle symbol-50px overflow-hidden me-3">
                    <div className="symbol-label">
                      <Image
                        src={
                          avatar_image
                            ? `${asset_url}/whiteLabel/${avatar_image}`
                            : `${asset_url}/assets/img/profile.jpg`
                        }
                        alt={first_name}
                        width={50}
                        height={50}
                        layout="responsive"
                      />
                    </div>
                  </div>
                  <div className="d-flex flex-column">
                    {first_name} {last_name}
                    <span>{email}</span>
                  </div>
                </a>
              </Link>
            </div>
          ) : (
            <div className="d-flex align-items-center">
              <div className="symbol symbol-circle symbol-50px overflow-hidden me-3">
                <div className="symbol-label">
                  <Image
                    src={
                      avatar_image
                        ? `${asset_url}/whiteLabel/${avatar_image}`
                        : `${asset_url}/assets/img/profile.jpg`
                    }
                    alt={first_name}
                    width={50}
                    height={50}
                    layout="responsive"
                  />
                </div>
              </div>
              <div className="d-flex flex-column">
                {first_name} {last_name}
                <span>{email}</span>
              </div>
            </div>
          );
        },
      },
      { header: "Mobile No", accessorKey: "mobile_no" },
      {
        header: "Status",
        accessorKey: "is_active",
        cell: (info) => (
          <div
            className={`badge badge-light-${info.getValue() ? "success" : "danger"
              }`}
          >
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
        accessorKey: "id",
        cell: (info) => (
          <div className="text-end">
            {permissn && permissn.length > 0 && permissn.includes(11) && (
              <td className="text-end">
                <Link
                  href={`./drivers/edit/${info.getValue()}`}
                  className="btn btn-light btn-active-light-primary btn-flex btn-center btn-sm"
                >
                  Actions <i className="ki ki-outline ki-down fs-5 ms-1"></i>
                </Link>
              </td>
            )}
          </div>
        ),
      },
    ],
    [formattedDate, permissn]
  );

  const table = useReactTable({
    data: driver,
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
      <>
        <ToastContainer />
        <div className="listItems">
          <div className="topBar">
            <div className="title">
              <h2>Driver List</h2>
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
                    placeholder="Search Product"
                  />
                </div>
                {permissn && permissn.length > 0 && permissn.includes(10) && (
                  <div className="btnGroup">
                    <Link
                      href="#"
                      className="btn-primary"
                    >
                      <i
                        className="ki-outline ki-plus-square fs-3"
                        style={{ marginRight: "8px" }}
                      ></i>
                      Add Driver
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
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="listItems">
        <div className="topBar">
          <div className="title">
            <h2>Driver List</h2>
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
                  placeholder="Search Driver"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
              {permissn && permissn.length > 0 && permissn.includes(10) && (
                <div className="btnGroup">
                  <Link href="./drivers/driver-add" className="btn-primary">
                    <i
                      className="ki-outline ki-plus-square fs-3"
                      style={{ marginRight: "8px" }}
                    ></i>
                    Add Driver
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
              </div>
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
    </>
  );
};

export default DriverTable;
