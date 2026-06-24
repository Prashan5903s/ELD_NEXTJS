"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Shadow from "@/app/Shadow/page";
import ImagePopupModal from "./addForm/ImagePopup";
import AddDocumentModal from "./addForm/AddDocumentPopup";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import { getPermissions } from "@/Components/permission/page";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "react-loading-skeleton/dist/skeleton.css"; // Import skeleton styles
import ToggleSwitchDocument from "../../../driverComponent/DriverDocumentToggle";

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

const DocumentTable = () => {
  interface Driver {
    id: number;
    first_name: string;
    last_name: string;
  }

  interface DocumentType {
    list_option: any;
    option_id: number;
    title: string;
  }

  interface Datas {
    drivers: Driver[];
    document_types: DocumentType[];
    // Other properties if needed
  }

  // Initialize state with an empty object matching the Datas interface
  const [datas, setData] = useState<Datas>({ drivers: [], document_types: [] });

  const [showModal, setShowModal] = useState(false);
  const [imageModal, setImageShowModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [docs, setDocs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [Errors, setError] = useState();
  const [modalMode, setModalMode] = useState("add");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [imageToShow, setImageToShow] = useState(null); // Add state for modal image
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  const [permissn, setPermissn] = useState([]);
  const assetUrl = process.env.NEXT_PUBLIC_ASSERT_URL;

  interface User {
    token: string;
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User;
    // Add other properties you expect in the session data
  }

  const { data: session } = (useSession() as { data?: SessionData }) || {};

  const token = session && session.user && session?.user?.token;

  // const fetchPermissions = useCallback(
  //   debounce(async (token) => {
  //     try {
  //       const perms = await getPermissions(token);
  //       setPermissn(perms);
  //     } catch (error) {
  //       if (error.response && error.response.status === 429) {
  //         setTimeout(() => fetchPermissions(token), 5000); // Retry after 5 seconds
  //       } else {
  //         console.error("Error fetching permissions:", error);
  //       }
  //     }
  //   }, 1000), // Increase debounce to 2 seconds
  //   [token]
  // );

  // useEffect(() => {
  //   if (token) {
  //     fetchPermissions(token);
  //   }
  // }, [fetchPermissions, token]);

  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
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

  const toggleImageModal = () => {
    setImageShowModal(!imageModal);
  };

  const fetchDocuments = useCallback(
    debounce(async () => {
      setLoading(true);
      if (!token) return;
      try {
        // Replace this URL with the actual endpoint for fetching documents
        const response = await axios.get(`${url}/document/data/driver`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocs(response.data.data || []);
        setData(response.data.data || []);
        setLoading(false); // Set loading to false once data is fetched
      } catch (err) {
        setLoading(false); // Set loading to false once data is fetched
        console.error("Error fetching documents: " + err.message);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    }, 500), // Debounce time in milliseconds
    [url, token] // Dependencies if any
  );

  const handleEyeClick = (image) => {
    setImageToShow(image); // Set the image to show in modal
    setImageShowModal(true); // Open the modal
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [fetchDocuments, token]);

  const updateDocumentList = () => {
    fetchDocuments(); // Refresh the vehicle list
  };

  const columns = React.useMemo(
    () => [
      {
        header: "Document type",
        accessorKey: "list_option.title", // Custom accessorKey for rendering
        cell: (info) => {
          const dtype = info.getValue();
          return dtype;
        },
      },
      {
        header: "File",
        accessorKey: "image",
        cell: (info) => (
          <button
            className="btn btn-icon btn-active-light-primary"
            onClick={() =>
              handleEyeClick(`${assetUrl}/documents/${info.getValue()}`)
            }
          >
            <i className="ki ki-outline ki-eye fs-3"></i>
          </button>
        ),
      },
      {
        header: "Note",
        accessorKey: "note",
        cell: (info) => {
          {
            info.getValue() == "undefined" ? "" : info.getValue();
          }
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info) => (
          <div
            className={`badge badge-light-${
              info.getValue() == 1 ? "success" : "danger"
            }`}
          >
            {info.getValue() == 1 ? "Active" : "Inactive"}
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
        cell: (info) => {
          const { status, id } = info.row.original; // Extract status and id
          return (
            <div>
              {/* {permissn.includes(2) && ( */}
                <button
                  className="btn btn-icon btn-active-light-primary w-30px h-30px me-3"
                  onClick={() => openModal("edit", info.row.original.id)}
                >
                  <i className="ki ki-outline ki-pencil fs-3"></i>
                </button>
              {/* )} */}
              <ToggleSwitchDocument
                status={status == 1 ? 1 : 0}
                documentId={id}
                updateDocumentsList={updateDocumentList} // Pass update function
              />
            </div>
          );
        },
      },
    ],
    [formattedDate, permissn, datas]
  );

  const table = useReactTable({
    data: docs,
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
      <div className="listItems">
        {/* Header and Search bar */}
        <div className="topBar">
          <div className="title">
            <h2>Documents List</h2>
            <div className="path">Dashboard Documents</div>
          </div>
        </div>
        <div className="mainList">
          <div className="row mt-3 card card-flush card-body pt-0">
            <div className="searchBar">
              <div className="search">
                <input
                  className="form-control form-control-solid w-250px ps-12"
                  type="text"
                  placeholder="Search Document"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
              <div className="search" id="search-container"></div>
              {/* {permissn.includes(1) && ( */}
              <div className="btnGroup">
                <button
                  onClick={() => openModal("add")}
                  className="btn-primary"
                >
                  <i
                    className="ki-outline ki-plus-square fs-3 mr-2"
                    style={{ marginRight: "8px" }}
                  ></i>
                  Add Documents
                </button>
              </div>
              {/* // )} */}
            </div>

            {/* Data Table */}
            <div className="dataTables_wrapper dt-bootstrap4 no-footer">
              <div className="table-responsive">
                {loading ? (
                  <Shadow header={5} val={5} />
                ) : (
                  <table
                    id="vehicleTable"
                    className="align-middle table-row-dashed fs-6 gy-5 mb-0 dataTable no-footer"
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
                    <tbody className="fw-semibold text-gray-600">
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
                        className={`page-item ${
                          !table.getCanPreviousPage() ? "disabled" : ""
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
                            className={`page-item ${
                              table.getState().pagination.pageIndex === index
                                ? "active p-0 btn-primary"
                                : ""
                            }`}
                          >
                            <button
                              className={`page-link ${
                                table.getState().pagination.pageIndex === index
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
                        className={`page-item ${
                          !table.getCanNextPage() ? "disabled" : ""
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

        {imageModal && (
          <ImagePopupModal
            id={imageToShow}
            open={imageModal}
            close={toggleImageModal}
            imageSrc={imageToShow}
          />
        )}
        {showModal && (
          <AddDocumentModal
            id={selectedVehicleId}
            open={showModal}
            close={toggleModal}
            updateDocumentList={updateDocumentList}
          />
        )}
      </div>
    </>
  );
};

export default DocumentTable;
