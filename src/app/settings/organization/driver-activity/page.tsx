"use client";
import axios from "axios";
import Link from "next/link";
import { debounce } from "lodash";
import Shadow from "@/app/Shadow/page";
import { useSession } from "next-auth/react";
import "react-loading-skeleton/dist/skeleton.css";
import { useForm, Controller } from "react-hook-form";
import { getPermissions } from "@/Components/permission/page";
import React, { useEffect, useState, useCallback } from "react";
import ReAssignDriverModal from "../../../../Components/assignModal";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

const MAX_VISIBLE_PAGES = 7;
const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages = [];
  if (totalPages <= MAX_VISIBLE_PAGES) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
  }
  return pages;
};

const ActivityTable = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const [activity, setActivity] = useState([]);
  const [permissn, setPermissn] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dropdownValue1, setDropdownValue1] = useState<any>(null);
  const [dropdownValue2, setDropdownValue2] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [pageNo, setPageNo] = useState(1);
  const [itemNo, setItemNo] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const { control } = useForm({
    defaultValues: {
      search: "",
      filter1: "",
      filter2: "",
    },
  });

  const { data: session } = (useSession() as any) || {};
  const token = session?.user?.token;

  const fetchPermissions = useCallback(
    debounce(async (token) => {
      try {
        const perms = await getPermissions(token);
        setPermissn(perms);
      } catch (error) {
        if (error.response?.status === 429) {
          setTimeout(() => fetchPermissions(token), 5000);
        } else {
          console.error("Error fetching permissions:", error);
        }
      }
    }, 1000),
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchPermissions(token);
    }
  }, [fetchPermissions, token]);

  const fetchUsers = async () => {
    if (!token) return setLoading(false);

    setLoading(true);
    try {
      const response = await axios.get(
        `${url}/driver/work/activity/${dropdownValue1}/${dropdownValue2}/${pageNo}/${itemNo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        setActivity(response.data.driverShift?.data || []);
        setTotalRecords(response.data.driverShift?.total || 0); // ✅ set totalRecords here
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 1000), [
    url,
    token,
    dropdownValue1,
    dropdownValue2,
    pageNo,
    itemNo,
  ]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      debouncedFetchUsers();
    }
  }, [debouncedFetchUsers, token, dropdownValue1, dropdownValue2, pageNo, itemNo]);

  const formatTimeDate = (dt: string) => {
    const date = new Date(dt);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  };

  const columns = React.useMemo(() => {
    const showActions = activity?.some((row) => row.is_edit == 1);
    const baseColumns = [
      {
        header: "Driver",
        accessorKey: "driver",
        cell: (info) => {
          const { first_name, last_name } = info.row.original.user || {};
          return <div>{`${first_name || ""} ${last_name || ""}`}</div>;
        },
      },
      {
        header: "Vehicle",
        accessorKey: "vehicle",
        cell: (info) => {
          const { name } =
            info.row.original.vehicle_change ??
            info.row.original.vehicle ?? {};
          return <div>{name || ""}</div>;
        },
      },
      {
        header: "Current Shift Status",
        accessorKey: "current_shift_status",
        cell: (info) => {
          const { title } =
            info.row.original.current_shift_status_change != null
              ? info.row.original.log_option
              : info.row.original.option || {};
          return <div>{title || ""}</div>;
        },
      },
      {
        header: "Message Reason",
        accessorKey: "message_reason",
        cell: (info) => {
          return (
            <div>
              {info.row.original.message_reason_change != null
                ? info.row.original.message_reason
                : info.row.original.message_reason_change}
            </div>
          );
        },
      },
      {
        header: "Generated",
        accessorKey: "system_entry",
        cell: (info) => (info.getValue() === 1 ? "Automatic" : "Manual"),
      },
      {
        header: "Created",
        accessorKey: "created_at",
        cell: (info) => formattedDate(info.getValue()),
      },
    ];

    if (showActions) {
      baseColumns.push({
        header: "Actions",
        accessorKey: "actions",
        cell: (info) => {
          const rowData = info.row.original;
          return (
            <div>
              {rowData.is_edit !== 0 && permissn.includes(31) && (
                <>
                  <button
                    onClick={() => {
                      setSelectedRow(rowData);
                      setActiveModal(true);
                    }}
                    className="btn btn-light btn-active-light-primary btn-flex btn-center btn-sm"
                  >
                    ReAssign
                  </button>
                  /
                  <Link
                    href={`./driver-activity/${rowData.id}`}
                    className="btn btn-light btn-active-light-primary btn-flex btn-center btn-sm"
                  >
                    Edit
                  </Link>
                </>
              )}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [permissn, activity, activeModal]);

  const sortedActivity = React.useMemo(() => {
    return activity?.slice().sort((a, b) => {
      const dateA = new Date(a.start_log_time).getTime();
      const dateB = new Date(b.start_log_time).getTime();
      return dateB - dateA;
    });
  }, [activity]);

  const table = useReactTable({
    data: sortedActivity,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      return value
        ? String(value).toLowerCase().includes(filterValue.toLowerCase())
        : false;
    },
  });

  if (loading) {
    // Render loading effect while data is being fetched
    return (
      <div className="listItems">
        <div className="topBar">
          <div className="title">
            <h2>Driver Activity List</h2>
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
                  placeholder="Search Driver Activity"
                />
              </div>
              {permissn.includes(30) && (
                <div className="btnGroup">
                  <Link href="#" className="btn-primary">
                    <i
                      className="ki-outline ki-plus-square fs-3"
                      style={{ marginRight: "8px" }}
                    ></i>
                    Add Driver Activity
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

  // Once loading is complete, render the table
  return (
    <div className="listItems">
      <div className="topBar">
        <div className="title">
          <h2>Driver Activity List</h2>
          <div className="path">Dashboard Drivers</div>
        </div>
      </div>
      <div className="mainList">
        <div className="row mt-3 card card-flush card-body pt-0">
          <div className="searchBar">
            <div className="d-flex align-items-center gap-4 mb-4 flex-wrap">
              {/* Search Input */}
              <div className="search">
                <input
                  className="form-control form-control-solid w-250px ps-12"
                  type="text"
                  placeholder="Search Driver Activity"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>

              {/* Dropdown 1 */}
              <Controller
                name="filter1"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <select
                    {...field}
                    className="form-select form-select-solid w-200px"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value); // Update RHF
                      setDropdownValue1(value); // Local state update
                    }}
                    value={field.value || ""}
                  >
                    <option value="" disabled>
                      Select log type
                    </option>
                    <option value="1">Device Generated</option>
                    <option value="2">Log Assigned</option>
                    <option value="3">Identified Log</option>
                    <option value="4">Add Log</option>
                    <option value="5">Edit Log</option>
                    <option value="6">Unidentified Log</option>
                  </select>
                )}
              />

              {/* ⬇️ Dropdown 2 */}
              {dropdownValue1 && dropdownValue1 !== "1" && (
                <Controller
                  name="filter2"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select
                      {...field}
                      className="form-select form-select-solid w-200px"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                        setDropdownValue2(value);
                      }}
                      value={field.value || ""}
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      <option value="1">Accepted</option>
                      <option value="2">Rejected</option>
                      <option value="3">No action taken</option>
                    </select>
                  )}
                />
              )}

            </div>

            {permissn.includes(30) && (
              <div className="btnGroup">
                <Link
                  href="./driver-activity/add-activity"
                  className="btn-primary"
                >
                  <i
                    className="ki-outline ki-plus-square fs-3"
                    style={{ marginRight: "8px" }}
                  ></i>
                  Add Driver Activity
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
              {
                activeModal && selectedRow && (
                  <ReAssignDriverModal
                    activeModal={activeModal}
                    closeModal={() => {
                      setActiveModal(false);
                      setSelectedRow(null);
                    }}
                    date={formatTimeDate(selectedRow.start_log_time)}
                    driverId={selectedRow.driver_id}
                    assignDriverId={selectedRow.driver_id_change}
                    id={selectedRow.id}
                  />
                )
              }
              <nav aria-label="Page navigation">
                <ul className="pagination mb-0">
                  <li className={`page-item ${pageNo === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPageNo(pageNo - 1)} disabled={pageNo === 1}>
                      &laquo;
                    </button>
                  </li>

                  {getPageNumbers(pageNo, Math.ceil(totalRecords / itemNo)).map((page, idx) => (
                    <li
                      key={idx}
                      className={`page-item ${page === pageNo ? "active" : ""} ${page === "..." ? "disabled" : ""}`}
                    >
                      {page === "..." ? (
                        <span className="page-link">...</span>
                      ) : (
                        <button className="page-link" onClick={() => setPageNo(Number(page))}>
                          {page}
                        </button>
                      )}
                    </li>
                  ))}

                  <li className={`page-item ${pageNo >= Math.ceil(totalRecords / itemNo) ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPageNo(pageNo + 1)}
                      disabled={pageNo >= Math.ceil(totalRecords / itemNo)}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTable;
