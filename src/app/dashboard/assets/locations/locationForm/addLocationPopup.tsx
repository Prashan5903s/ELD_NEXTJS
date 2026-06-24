"use client";
import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingIcons from "react-loading-icons";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "react-loading-skeleton/dist/skeleton.css"; // Import Skeleton CSS
import {
  useJsApiLoader,
  GoogleMap,
  DrawingManager,
} from "@react-google-maps/api";

const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

interface Location {
  address_types: {
    [key: number]: string;
  };
}

const AddLocationModal: React.FC<{
  id: number | null;
  close: any;
  open: boolean;
  updatedLocationData: () => void;
}> = ({ id, close, open, updatedLocationData }) => {
  const [locationField, setLocationField] = useState({
    shapeData: null, // To store shape data
    name: "",
    address: "",
    address_type: "",
    tags: "",
    note: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [loctn, setLoctn] = useState<Location | null>(null);
  const [selectedShape, setSelectedShape] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 36.7378,
    lng: -119.7871,
  });
  const [shapeDatas, setShapeData] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorVal>({});
  const [authenticated, setAuthenticated] = useState(false);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [currentShape, setCurrentShape] = useState(null); // To track the current shape

  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
    null
  );
  const mapRef = useRef<google.maps.Map | null>(null);

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = {
    lat: 36.7378,
    lng: -119.7871,
  };

  const router = useRouter();

  const notify = () =>
    toast.success(`Location ${id ? "update" : "added"} successfully!`, {
      position: "top-right",
      autoClose: 1000, // Auto-dismiss after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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

  const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = useMemo(
    () => ["places", "geometry", "drawing"],
    []
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries, // Make sure 'places' is included or adjust as needed
    id: "google-map-script",
    version: "weekly",
  });

  const formValidations = {
    shapeData: {
      required: "Location map is required",
    },
    name: {
      required: "Name is required",
      maxLength: {
        value: 60,
        message: "Name must be at most 60 characters long",
      },
      pattern: {
        value: /^[A-Za-z\s]+$/i,
        message: "Name should be only alphabetic characters and spaces",
      },
    },
    address: {
      required: "Address is required",
      maxLength: {
        value: 60,
        message: "Address must be at most 60 characters long",
      },
    },
    address_type: {
      required: "Address type is required",
    },
    tags: {},
    note: {},
  };

  const changeVehicleFieldHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setLocationField((prev) => ({
      ...prev,
      [name]: value,
      shapeData: shapeDatas,
    }));
  };

  interface ErrorVal {
    name?: string;
    address?: string;
    [key: string]: string | undefined;
  }

  const validateForm = () => {
    let isValid = true;
    let errors: ErrorVal = {};

    ["name", "address", "address_type", "shapeData"].forEach((key) => {
      if (
        formValidations[key]?.required &&
        !locationField[key as keyof typeof locationField]
      ) {
        errors[key] = formValidations[key].required;
        isValid = false;
      }
    });

    if (locationField.name && formValidations.name) {
      if (locationField.name.length > formValidations.name.maxLength.value) {
        errors.name = formValidations.name.maxLength.message;
        isValid = false;
      }
      if (!formValidations.name.pattern.value.test(locationField.name)) {
        errors.name = formValidations.name.pattern.message;
        isValid = false;
      }
    }

    if (locationField.address && formValidations.address) {
      if (
        locationField.address.length > formValidations.address.maxLength.value
      ) {
        errors.address = formValidations.address.maxLength.message;
        isValid = false;
      }
    }

    setErrors(errors);
    return isValid;
  };

  const handleFormSubmission = async () => {
    if (!token) {
      console.error("No token available");
      return;
    }

    setIsLoading(true);

    if (!id && shapeDatas == null) {
      setErrors({ shapeData: "Select location on map" });
      return null;
    }

    try {
      const apiUrl = id
        ? `${url}/asset/location/${id}`
        : `${url}/asset/location`;
      const method = id ? "put" : "post";

      const response = await axios({
        method,
        url: apiUrl,
        data: locationField,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setIsLoading(false);
        updatedLocationData();
        close(false);
        notify();
        router.push("/dashboard/assets/locations");
      } else {
        setIsLoading(false);
        console.error("Failed to save/update:", response.data);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("API error:", error.response?.data || error.message);
    }
  };

  const debouncedFormSubmission = debounce(handleFormSubmission, 1000);

  const onSubmitChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      debouncedFormSubmission();
    }
  };

  const fetchData = useCallback(
    debounce(async () => {
      if (!token) {
        console.error("No token available");
        return;
      }

      try {
        const response = await axios.get(`${url}/asset/location`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setLoctn(response?.data || {});
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }, 1000),
    [url, token]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchEditData = useCallback(
    debounce(async () => {
      if (!id) return;

      if (!token) {
        console.error("No token available");
        return;
      }

      try {
        const response = await axios.get(`${url}/asset/location/${id}/edit`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { location } = response.data;

        setEditData(location);

        setLocationField({
          name: location.name || "",
          address: location.address || "",
          address_type: location.type || "",
          tags: location.tags || "",
          note: location.note || "",
          shapeData: location.shapeData || "",
        });
      } catch (error) {
        console.error("Error fetching edit data:", error);
      }
    }, 1000),
    [url, token, id]
  );

  useEffect(() => {
    if (token) {
      fetchEditData();
    }
  }, [fetchEditData, token]);

  useEffect(() => {
    if (id) {
      if (editData && locationField && loctn && token) {
        setIsDataLoading(true);
      }
    }
  }, [id, editData, locationField, loctn, token]);

  useEffect(() => {
    if (!id) {
      if (loctn && token && Object.keys(loctn).length > 0) {
        setIsDataLoading(true);
      }
    }
  }, [loctn, token]);

  var ShapeData = JSON.parse(editData?.shapeData || "{}");

  const [shapeBool, setShapeBoolean] = useState(false);

  useEffect(() => {
    if (map && ShapeData && !shapeBool) {
      setShapeBoolean(true); // Ensure the effect runs only once

      let shape;
      let bounds = new google.maps.LatLngBounds();

      switch (ShapeData.type) {
        case "circle":
          shape = new google.maps.Circle({
            map,
            center: new google.maps.LatLng(
              ShapeData.center.lat,
              ShapeData.center.lng
            ),
            radius: ShapeData.radius,
            fillColor: "#1b84ff",
            fillOpacity: 1,
            strokeWeight: 1,
            clickable: false,
            editable: true,
            zIndex: 1,
          });
          bounds = shape.getBounds();
          break;

        case "rectangle":
          shape = new google.maps.Rectangle({
            map,
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(
                ShapeData.bounds.south,
                ShapeData.bounds.west
              ),
              new google.maps.LatLng(
                ShapeData.bounds.north,
                ShapeData.bounds.east
              )
            ),
            fillColor: "#1b84ff",
            fillOpacity: 0.25,
            strokeWeight: 1,
            clickable: false,
            editable: true,
            zIndex: 1,
          });
          bounds = shape.getBounds();
          break;

        case "polygon":
          shape = new google.maps.Polygon({
            map,
            paths: ShapeData.paths.map(
              (point) => new google.maps.LatLng(point.lat, point.lng)
            ),
            fillColor: "#1b84ff",
            fillOpacity: 0.25,
            strokeWeight: 1,
            clickable: false,
            editable: true,
            zIndex: 1,
          });
          // Extend bounds to include all polygon points
          ShapeData.paths.forEach((point) => {
            bounds.extend(new google.maps.LatLng(point.lat, point.lng));
          });
          break;

        default:
          console.error("Unknown shape type");
      }

      // Set the current shape
      setCurrentShape(shape);

      // Adjust the map bounds to fit the shape
      if (shape && bounds) {
        map.fitBounds(bounds);
      }
    }
  }, [map, ShapeData]);

  useEffect(() => {
    // setShapeBoolean(false); // Ensure the effect runs only once
  }, [shapeDatas]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  useEffect(() => {
    onLoad;
  }, [onLoad]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    mapRef.current = mapInstance;
    // Set default drawing mode to 'circle'
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(
        google.maps.drawing.OverlayType.CIRCLE
      );
    }
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager) => {
    drawingManagerRef.current = drawingManager;
    // Set default drawing mode to 'circle'
    drawingManager.setDrawingMode("circle");
  }, []);

  const clearShape = () => {
    if (currentShape) {
      currentShape.setMap(null); // Remove shape from map
    }
  };

  const handleShapeComplete = useCallback((shape) => {
    clearShape(); // Clear the previous shape
    setCurrentShape(shape); // Set the new shape
  }, []);

  const calculateShapeArea = (
    shape: google.maps.Rectangle | google.maps.Circle | google.maps.Polygon
  ): number => {
    if (shape instanceof google.maps.Rectangle) {
      const bounds = shape.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const area = google.maps.geometry.spherical.computeArea([
        { lat: ne.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: ne.lng() },
        { lat: ne.lat(), lng: ne.lng() },
      ]);
      return area;
    } else if (shape instanceof google.maps.Circle) {
      return Math.PI * Math.pow(shape.getRadius(), 2);
    } else if (shape instanceof google.maps.Polygon) {
      const path = shape.getPath().getArray();
      return google.maps.geometry.spherical.computeArea(path);
    }
    return 0;
  };

  const handleRectangleComplete = (rectangle: google.maps.Rectangle) => {
    clearShape(); // Clear any existing shape
    setCurrentShape(rectangle); // Set the newly completed rectangle as the current shape

    // Store the rectangle data
    const bounds = rectangle.getBounds();
    const shapeData = {
      type: "rectangle",
      bounds: {
        north: bounds.getNorthEast().lat(),
        east: bounds.getNorthEast().lng(),
        south: bounds.getSouthWest().lat(),
        west: bounds.getSouthWest().lng(),
      },
    };
    setShapeData(JSON.stringify(shapeData));
  };

  const handleCircleComplete = (circle: google.maps.Circle) => {
    clearShape(); // Clear any existing shape
    setCurrentShape(circle); // Set the newly completed rectangle as the current shape

    const shapeData = {
      type: "circle",
      center: {
        lat: circle.getCenter().lat(),
        lng: circle.getCenter().lng(),
      },
      radius: circle.getRadius(),
      area: calculateShapeArea(circle),
    };

    setShapeData(JSON.stringify(shapeData)); // Store shape data
    circle.setEditable(true);
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    clearShape(); // Clear any existing shape
    setCurrentShape(polygon); // Set the newly completed rectangle as the current shape

    const shapeData = {
      type: "polygon",
      paths: polygon
        .getPath()
        .getArray()
        .map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
        })),
      area: calculateShapeArea(polygon),
    };

    setShapeData(JSON.stringify(shapeData)); // Store shape data
    polygon.setEditable(true);
  };

  const onShapeComplete = useCallback((shape: google.maps.MVCObject) => {
    if (shape instanceof google.maps.Rectangle) {
      handleRectangleComplete(shape as google.maps.Rectangle);
    } else if (shape instanceof google.maps.Circle) {
      handleCircleComplete(shape as google.maps.Circle);
    } else if (shape instanceof google.maps.Polygon) {
      handlePolygonComplete(shape as google.maps.Polygon);
    }
  }, []);

  useEffect(() => {
    onShapeComplete;
  }, [onShapeComplete]);

  useEffect(() => {
    setLocationField({
      name: locationField.name,
      address: locationField.address,
      address_type: locationField.address_type,
      tags: locationField.tags,
      note: locationField.note,
      shapeData: shapeDatas,
    });
  }, [shapeDatas]);

  // skeleton form
  if (!isDataLoading) {
    return (
      <div
        className={`modal ${open ? "showpopup" : ""}`}
        style={{ display: open ? "block" : "none" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered w-95 h-90 mw-650px mh-350px">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="fw-bold">
                <Skeleton width={180} />
              </h2>
              <div
                className="btn btn-icon btn-sm btn-active-icon-primary"
                data-bs-dismiss="modal"
              >
                <i
                  onClick={() => close(false)}
                  className="ki ki-outline ki-cross fs-1"
                ></i>
              </div>
            </div>
            <div className="modal-body mx-5 mx-xl-15 my-7 mr-4">
              <form
                id="kt_modal_add_vehicle_form"
                className="form fv-plugins-bootstrap5 fv-plugins-framework"
                onSubmit={onSubmitChange}
              >
                {Object.keys(formValidations).map((field, index) => (
                  <div className="fv-row mb-7" key={index}>
                    {field != "shapeData" && (
                      <label className="fs-6 fw-semibold form-label mb-2">
                        <span
                          className={
                            formValidations[field]?.required ? "required" : ""
                          }
                        >
                          {field.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </label>
                    )}

                    {field === "address" || field === "note" ? (
                      <Skeleton width={480} height={100} />
                    ) : field === "address_type" ? (
                      <div className="d-flex flex-wrap gap-3 mt-3 mb-2">
                        <Skeleton width={480} />
                      </div>
                    ) : field === "name" ? (
                      <Skeleton width={480} />
                    ) : (
                      <Skeleton width={480} height={100} />
                    )}
                  </div>
                ))}

                <div className="form-btn-grp w-100 text-center pt-15">
                  <div className="form-btn-grp w-100 text-center pt-15">
                    <Skeleton width={100} />
                    <Skeleton width={100} />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`modal ${open ? "showpopup" : ""}`}
      style={{ display: open ? "block" : "none" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered w-95 h-90 mw-650px mh-350px">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="fw-bold">{id ? "Edit Location" : "Add Location"}</h2>
            <div
              className="btn btn-icon btn-sm btn-active-icon-primary"
              data-bs-dismiss="modal"
            >
              <i
                onClick={() => close(false)}
                className="ki ki-outline ki-cross fs-1"
              ></i>
            </div>
          </div>
          <div className="modal-body mx-5 mx-xl-15 my-7">
            <form
              id="kt_modal_add_vehicle_form"
              className="form fv-plugins-bootstrap5 fv-plugins-framework"
              onSubmit={onSubmitChange}
            >
              {Object.keys(formValidations).map((field, index) => (
                <div className="fv-row mb-7" key={index}>
                  {field != "shapeData" && (
                    <label className="fs-6 fw-semibold form-label mb-2">
                      <span
                        className={
                          formValidations[field]?.required ? "required" : ""
                        }
                      >
                        {field.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </label>
                  )}

                  {field == "shapeData" ? (
                    isLoaded && (
                      <div style={{ position: "relative" }}>
                        <GoogleMap
                          center={id ? mapCenter : mapCenter} // Use a default object when id is present
                          zoom={10}
                          mapContainerStyle={mapContainerStyle}
                          onLoad={onMapLoad}
                          options={{
                            mapTypeControl: false, // Remove the map type control
                            // No need for mapTypeControlOptions since we're hiding the map type control
                          }}
                        >
                          <DrawingManager
                            onLoad={onDrawingManagerLoad}
                            onRectangleComplete={handleRectangleComplete}
                            onCircleComplete={handleCircleComplete}
                            onPolygonComplete={handlePolygonComplete}
                            options={{
                              drawingControl: false, // Disable default drawing controls
                              circleOptions: {
                                fillColor: "#1b84ff",
                                fillOpacity: 0.25,
                                strokeWeight: 1,
                                clickable: true,
                                editable: true,
                                draggable: true,
                                zIndex: 1,
                              },
                              rectangleOptions: {
                                fillColor: "#1b84ff",
                                fillOpacity: 0.25,
                                strokeWeight: 1,
                                clickable: true,
                                editable: true,
                                draggable: true,
                                zIndex: 1,
                              },
                              polygonOptions: {
                                fillColor: "#1b84ff",
                                fillOpacity: 0.25,
                                strokeWeight: 1,
                                clickable: true,
                                editable: true,
                                draggable: true,
                                zIndex: 1,
                              },
                            }}
                          />
                        </GoogleMap>
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              drawingManagerRef.current &&
                              drawingManagerRef.current.setDrawingMode(
                                google.maps.drawing.OverlayType.RECTANGLE
                              )
                            }
                            className="btn btn-outline-primary btn-custom-bg btn-sm"
                          >
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
                            Box
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              drawingManagerRef.current &&
                              drawingManagerRef.current.setDrawingMode(
                                google.maps.drawing.OverlayType.CIRCLE
                              )
                            }
                            className="btn btn-outline-primary btn-custom-bg btn-sm"
                          >
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
                                <path d="m23.907162,12.000001c0,-1.323018 -1.01172,-2.490387 -2.334738,-2.646036c-0.933895,-3.346457 -3.579931,-5.992494 -6.926389,-6.926389c-0.233474,-1.323018 -1.323018,-2.334738 -2.646036,-2.334738s-2.490387,1.01172 -2.646036,2.334738c-3.346457,0.933895 -5.992494,3.579931 -6.926389,6.926389c-1.323018,0.233474 -2.334738,1.323018 -2.334738,2.646036s1.01172,2.490387 2.334738,2.646036c0.933895,3.346457 3.579931,5.992494 6.926389,6.926389c0.233474,1.323018 1.323018,2.334738 2.646036,2.334738s2.490387,-1.01172 2.646036,-2.334738c3.346457,-0.933895 5.992494,-3.579931 6.926389,-6.926389c1.323018,-0.155649 2.334738,-1.245193 2.334738,-2.646036zm-9.4946,8.093758c-0.466948,-0.933895 -1.400843,-1.556492 -2.490387,-1.556492s-2.023439,0.622597 -2.490387,1.556492c-2.646036,-0.856071 -4.825125,-2.957334 -5.603371,-5.603371c0.933895,-0.466948 1.556492,-1.400843 1.556492,-2.490387s-0.622597,-2.023439 -1.556492,-2.490387c0.933895,-2.646036 2.957334,-4.825125 5.603371,-5.603371c0.466948,0.933895 1.400843,1.556492 2.490387,1.556492s2.023439,-0.622597 2.490387,-1.556492c2.646036,0.933895 4.825125,2.957334 5.603371,5.603371c-0.933895,0.466948 -1.556492,1.400843 -1.556492,2.490387s0.622597,2.023439 1.556492,2.490387c-0.933895,2.646036 -2.957334,4.825125 -5.603371,5.603371z"></path>
                              </svg>
                            </div>
                            Circle
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              drawingManagerRef.current &&
                              drawingManagerRef.current.setDrawingMode(
                                google.maps.drawing.OverlayType.POLYGON
                              )
                            }
                            className="btn btn-outline-primary btn-custom-bg btn-sm"
                          >
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
                            Draw
                          </button>
                        </div>
                      </div>
                    )
                  ) : field === "address" ? (
                    <textarea
                      className="form-control form-control-solid"
                      placeholder={`Enter ${field.replace(/_/g, " ")}`}
                      name={field}
                      onChange={changeVehicleFieldHandler}
                      value={locationField[field]}
                    />
                  ) : field === "note" ? (
                    <textarea
                      className="form-control form-control-solid"
                      placeholder={`Enter ${field.replace(/_/g, " ")}`}
                      name={field}
                      onChange={changeVehicleFieldHandler}
                      value={locationField[field]}
                    />
                  ) : field === "address_type" ? (
                    <div className="d-flex flex-wrap gap-3 mt-3 mb-2">
                      {loctn?.address_types &&
                        Object.entries(loctn.address_types).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="align-items-center d-flex"
                            >
                              <input
                                className="form-check-input me-3 cursor-pointer"
                                name="address_type"
                                type="radio"
                                value={key}
                                id={key} // Ensure this ID is unique
                                onChange={changeVehicleFieldHandler}
                                checked={locationField.address_type == key}
                              />
                              <label
                                className="form-check-label fs-6"
                                htmlFor={key} // Use the same ID as in the input
                              >
                                {value}
                              </label>
                            </div>
                          )
                        )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-solid"
                      placeholder={`Enter ${field.replace(/_/g, " ")}`}
                      name={field}
                      onChange={changeVehicleFieldHandler}
                      value={locationField[field]}
                    />
                  )}
                  <div>
                    {errors && errors[field] && (
                      <div className="mt-2" style={{ color: "red" }}>
                        {errors[field]}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="form-btn-grp w-100 text-center pt-15">
                <div className="form-btn-grp w-100 text-center pt-15">
                  <button
                    type="reset"
                    className="btn-light me-3"
                    data-bs-dismiss="modal"
                    onClick={close}
                    aria-label="Close"
                  >
                    Discard
                  </button>
                  <button
                    id="kt_sign_in_submit"
                    className="justify-content-center btn-primary"
                  >
                    <span className="indicator-progress d-flex justify-content-center">
                      {isLoading ? (
                        <LoadingIcons.TailSpin height={18} />
                      ) : id ? (
                        "Update"
                      ) : (
                        "Save"
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLocationModal;
