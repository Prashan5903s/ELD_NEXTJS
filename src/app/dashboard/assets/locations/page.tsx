"use client";
import axios from "axios";
import { debounce } from "lodash";
import Shadow from "@/app/Shadow/page";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import "react-toastify/dist/ReactToastify.css";
import "react-loading-skeleton/dist/skeleton.css";
import { useJsApiLoader } from "@react-google-maps/api";
import { getPermissions } from "@/Components/permission/page";
import ToggleSwitchLocation from "@/Components/locationToggle";
import AddLocationModal from "./locationForm/addLocationPopup";
import React, { useMemo, useEffect, useState, useCallback } from "react";

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { ToastContainer } from "react-toastify";

type LocationData = {
  id: number;
  name: string;
  address: string;
  address_types?: string;
  // Add other fields as needed
};

const LocationTable = () => {
  const [showModal, setShowModal] = useState(false);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [locationName, setLocationName] = useState("");
  const [modalMode, setModalMode] = useState("add");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();

  const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

  const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = useMemo(
    () => ["places", "geometry", "drawing"],
    []
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MapKey,
    libraries,
    id: "google-map-script",
    version: "weekly",
  });

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

  const [permissions, setPermissions] = useState([]);

  const fetchPermissions = useCallback(
    debounce(async (token) => {
      try {
        const perms = await getPermissions(token);
        setPermissions(perms);
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

  const formattedDate = (dateString: string): string => {
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

  const findLocation = async (shapeData) => {
    if (window.google) {
      const datas = JSON.parse(shapeData);
      const { type, center, bounds, paths } = datas;
      let latLng;

      if (type === "circle" && center) {
        latLng = new window.google.maps.LatLng(center.lat, center.lng);
      } else if (type === "rectangle" && bounds) {
        latLng = new window.google.maps.LatLng(
          (bounds.north + bounds.south) / 2,
          (bounds.east + bounds.west) / 2
        );
      } else if (type === "polygon" && paths) {
        const centerLatLng = paths.reduce(
          (acc, point) => ({
            lat: acc.lat + point.lat,
            lng: acc.lng + point.lng,
          }),
          { lat: 0, lng: 0 }
        );
        latLng = new window.google.maps.LatLng(
          centerLatLng.lat / paths.length,
          centerLatLng.lng / paths.length
        );
      }

      if (latLng) {
        const geocoder = new window.google.maps.Geocoder();
        return new Promise((resolve, reject) => {
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK) {
              if (results[0]) {
                resolve(results[0].formatted_address);
              } else {
                resolve("No results found");
              }
            } else {
              resolve("Geocoder failed");
            }
          });
        });
      } else {
        return "Invalid shape data";
      }
    } else {
      return "Google Maps API not loaded";
    }
  };

  const openModal = (mode, locationId = null) => {
    setModalMode(mode);
    setSelectedLocationId(locationId);
    setShowModal(true);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  // Function to fetch location data
  const fetchLocation = async () => {
    setLoading(true);
    try {
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await axios.get(`${url}/asset/location`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageIndex + 1, // page index starts from 1
          size: pageSize,
          filter: globalFilter,
        },
      });

      // Ensure response.data.locations is the correct path
      setLocationData(response.data.locations || []);
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetchLocation function
  const debouncedFetchLocation = useCallback(
    debounce(fetchLocation, 1000),
    [pageIndex, pageSize, globalFilter, url, token] // Ensure token is in the dependency array
  );

  useEffect(() => {
    if (token) {
      debouncedFetchLocation();
    }
  }, [debouncedFetchLocation, token]);

  function updateLocationsList() {
    debouncedFetchLocation();
  }

  const columns = React.useMemo(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Address", accessorKey: "address" },
      {
        header: "Map drawn",
        accessorKey: "shapeData",
        cell: (props) => <ShapeDataCell value={props.getValue()} />,
      },
      {
        header: "Notes",
        accessorKey: "notes",
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
            className={`badge badge-light-${info.getValue() ? "success" : "danger"
              }`}
          >
            {info.getValue() ? "Active" : "Inactive"}
          </div>
        ),
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        cell: (info) => <div>{formattedDate(info.getValue())}</div>,
      },
      {
        header: "Actions",
        cell: (info) => {
          const { status, id } = info.row.original; // Extract status and id
          return (
            <div>
              {permissions &&
                permissions.length > 0 &&
                permissions.includes(5) && (
                  <button
                    className="btn btn-icon btn-active-light-primary w-30px h-30px me-3"
                    onClick={() => openModal("edit", info.row.original.id)}
                  >
                    <i className="ki ki-outline ki-pencil fs-3"></i>
                  </button>
                )}
              <ToggleSwitchLocation
                status={status}
                locationId={id}
                updateLocationsList={updateLocationList} // Pass update function
              />
            </div>
          );
        },
      },
    ],
    [permissions]
  );

  const ShapeDataCell = ({ value }) => {
    const datas = JSON.parse(value);
    const type = datas?.type;
    const [locationName, setLocationName] = useState<string | null>(null);
    const [mapLoad, setMapLoad] = useState(true);

    useEffect(() => {
      const fetchLocationName = async () => {
        const name = (await findLocation(value)) as string;
        setLocationName(name);
      };

      fetchLocationName();
    }, [value]);

    useEffect(() => {
      if (locationName) {
        setMapLoad(false);
      }
    }, [locationName]);

    return (
      <div>
        {type === "polygon" && (
          <div className="d-flex">
            <div style={{ marginRight: "4px" }}>
              <svg
                viewBox="0 0 24 24"
                className="text-primary"
                style={{
                  fontSize: "1.8rem",
                  width: "1em",
                  height: "1em",
                  fill: "currentcolor",
                }}
              >
                <polygon
                  points="2.8559420108795166,14.883604288101196 14.618008613586426,3.6527273654937744 21.068174362182617,20.347273111343384"
                  fillOpacity="0.25"
                ></polygon>
                <path d="m21.068174,17.691323c-0.075884,0 -0.151769,0 -0.227653,0l-4.553058,-11.913835c0.607074,-0.455306 0.986496,-1.214149 0.986496,-2.12476c0,-1.441802 -1.214149,-2.655951 -2.655951,-2.655951s-2.655951,1.214149 -2.655951,2.655951c0,0.455306 0.075884,0.834727 0.303537,1.214149l-8.11962,7.740199c-0.379422,-0.227653 -0.834727,-0.303537 -1.290033,-0.303537c-1.441802,0 -2.655951,1.214149 -2.655951,2.655951c0,1.441802 1.214149,2.655951 2.655951,2.655951c0.910612,0 1.745339,-0.53119 2.276529,-1.290033l13.355637,4.021868c0,0 0,0 0,0c0,1.441802 1.214149,2.655951 2.655951,2.655951s2.655951,-1.214149 2.655951,-2.655951s-1.214149,-2.655951 -2.731835,-2.655951zm-15.556282,-2.807719c0,-0.455306 -0.151769,-0.834727 -0.303537,-1.138265l8.11962,-7.740199c0.379422,0.227653 0.834727,0.379422 1.290033,0.379422c0.075884,0 0.151769,0 0.227653,0l4.628942,11.989719c-0.227653,0.151769 -0.455306,0.379422 -0.607074,0.607074l-13.355637,-4.097752z"></path>
              </svg>
            </div>
            {mapLoad ? (
              <Skeleton width={180} height={15} />
            ) : (
              <span style={{ minWidth: "100px" }}>{locationName}</span>
            )}
          </div>
        )}
        {type === "rectangle" && (
          <div className="d-flex">
            <div style={{ marginRight: "4px" }}>
              <svg
                viewBox="0 0 24 24"
                className="text-primary"
                style={{
                  fontSize: "1.8rem",
                  width: "1em",
                  height: "1em",
                  fill: "currentcolor",
                }}
              >
                <path
                  fillOpacity="0.25"
                  d="m6.929785,3.777532a2.886682,2.896627 0 0 1 -1.966853,1.974867l0,12.496805a2.886682,2.896627 0 0 1 1.965251,1.973263l10.143635,0a2.886682,2.896627 0 0 1 1.965249,-1.973263l0,-12.496805a2.886682,2.896627 0 0 1 -1.965249,-1.974867l-10.142032,0z"
                ></path>
                <path d="m4.157437,0.075458a2.886682,2.896627 0 0 0 -2.886961,2.896578a2.886682,2.896627 0 0 0 2.080663,2.779561l0,12.495202a2.886682,2.896627 0 0 0 -2.080663,2.781163a2.886682,2.896627 0 0 0 2.886961,2.896579a2.886682,2.896627 0 0 0 2.771546,-2.091884l10.142032,0a2.886682,2.896627 0 0 0 2.771546,2.091884a2.886682,2.896627 0 0 0 2.886961,-2.896579a2.886682,2.896627 0 0 0 -2.082267,-2.779561l0,-12.496805a2.886682,2.896627 0 0 0 2.082267,-2.779561a2.886682,2.896627 0 0 0 -2.886961,-2.896578a2.886682,2.896627 0 0 0 -2.771546,2.090281l-10.143635,0a2.886682,2.896627 0 0 0 -2.769943,-2.090281zm2.771546,3.701272l10.142032,0a2.886682,2.896627 0 0 0 1.965249,1.974867l0,12.496805a2.886682,2.896627 0 0 0 -1.965249,1.973264l-10.143635,0a2.886682,2.896627 0 0 0 -1.96525,-1.973264l0,-12.496805a2.886682,2.896627 0 0 0 1.966853,-1.974867z"></path>
              </svg>
            </div>
            {mapLoad ? <Skeleton width={80} height={15} /> : locationName}
          </div>
        )}
        {type === "circle" && (
          <div className="d-flex">
            <div style={{ marginRight: "4px" }}>
              <svg
                viewBox="0 0 24 24"
                className="text-primary"
                style={{
                  fontSize: "1.8rem",
                  width: "1em",
                  height: "1em",
                  fill: "currentcolor",
                }}
              >
                <circle
                  r="9.183301"
                  cy="12"
                  cx="12"
                  fillOpacity="0.25"
                ></circle>
                <path d="m23.907162,12.000001c0,-1.323018 -1.01172,-2.490387 -2.334738,-2.646036c-0.933895,-3.346457 -3.579931,-5.992494 -6.926389,-6.926389c-0.233474,-1.323018 -1.323018,-2.334738 -2.646036,-2.334738s-2.490387,1.01172 -2.646036,2.334738c-3.346457,0.933895 -5.992494,3.579931 -6.926389,6.926389c-1.323018,0.155649 -2.334738,1.323018 -2.334738,2.646036c0,1.323018 1.01172,2.490387 2.334738,2.646036c0.933895,3.346457 3.579931,5.992494 6.926389,6.926389c0.233474,1.323018 1.323018,2.334738 2.646036,2.334738s2.490387,-1.01172 2.646036,-2.334738c3.346457,-0.933895 5.992494,-3.579931 6.926389,-6.926389c1.323018,-0.155649 2.334738,-1.323018 2.334738,-2.646036z"></path>
              </svg>
            </div>
            {mapLoad ? <Skeleton width={80} height={15} /> : locationName}
          </div>
        )}
      </div>
    );
  };

  const table = useReactTable({
    data: locationData, // Now an array of LocationData
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

  const updateLocationList = () => {
    fetchLocation(); // Refresh the location list
  };

  return (
    <>
      <ToastContainer />
      <div className="listItems">
        <div className="topBar">
          <div className="title">
            <h2>Locations List</h2>
            <div className="path">Dashboard Assets Location</div>
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
              {permissions &&
                permissions.length > 0 &&
                permissions.includes(4) && (
                  <div className="btnGroup">
                    <button
                      onClick={() => openModal("add")}
                      className="btn-primary"
                    >
                      <i
                        className="ki-outline ki-plus-square fs-3 mr-2"
                        style={{ marginRight: "8px" }}
                      ></i>
                      Add Location
                    </button>
                  </div>
                )}
            </div>
            <div className="dataTables_wrapper dt-bootstrap4 no-footer">
              <div className="table-responsive">
                {loading && !locationData.length ? (
                  <Shadow header={5} val={5} />
                ) : (
                  <table className="align-middle table-row-dashed fs-6 gy-5 mb-0 dataTable no-footer">
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
              </div>
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
        {showModal && (
          <AddLocationModal
            id={selectedLocationId}
            open={showModal}
            close={toggleModal}
            updatedLocationData={updateLocationList}
          />
        )}
      </div>
    </>
  );
};

export default LocationTable;
