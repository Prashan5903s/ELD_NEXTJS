"use client";

import React, { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingIcons from "react-loading-icons";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "react-loading-skeleton/dist/skeleton.css"; // Import Skeleton CSS
import axios from "axios";

type IFormInput = {
  driver_status: number;
  driver_id: number;
  vehicle_id: number;
  message_reason: string;
  start_time: string;
  end_time: string;
  location_name: string;
  notes: string;
};

function ActivityForm({ id }) {
  const router = useRouter();
  const [endTime, setEndTime] = useState(null);
  const [activity, setActivity] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [disables, setDisables] = useState(false);
  const [driveDisble, setDriveDisable] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [datass, setDatass] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [defaultEndTime, setDefaultEndTime] = useState(null);
  const [startDayDisable, setStartDayDisable] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [selectedDriverStatus, setSelectedDriverStatus] = useState<
    number | null
  >(null);
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

  const formValidations = {
    driver_status: {
      required: "Driver status is required",
    },
    driver_id: {
      required: "Driver Id is required",
    },
    vehicle_id: {
      required: "Vehicle ID is required",
    },
    message_reason: {
      required: "Message reason is required",
    },
    start_time: {
      required: "Start time is required",
      validate: async (value) => {
        if (!value) {
          return "Start time is required";
        }
        const datas = await checkTimeUniqueness(id, startTime, endTime);
        const isUnique = datas?.isUnique;
        const fors = datas?.for;
        if (!isUnique && (fors == "a" || fors == "b")) {
          return "The selected status, date and time are already linked to another status. Please verify.";
        }
      },
    },
    end_time: {
      required: "End time is required",
      validate: async (value) => {
        if (!value) {
          return "End time is required";
        }
        const datas = await checkTimeUniqueness(id, startTime, endTime);
        const isUnique = datas?.isUnique;
        const fors = datas?.for;
        if (!isUnique && (fors == "a" || fors == "c")) {
          return "The selected status, date and time are already linked to another status. Please verify.";
        }
      },
    },
    location_name: {
      // Add validation if needed
    },
    notes: {
      required: "Notes are required",
    },
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors },
    control,
  } = useForm<IFormInput>();

  async function checkTimeUniqueness(id = null, start = null, end = null) {
    if (!id) {
      return null;
    }

    try {
      if (!token) {
        console.error("No token available");
        return false; // Consider email not unique if no token
      }

      const response = await axios.get(
        `${url}/check/driver/time/${id}/${start}/${end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data; // If no users found, email is unique
    } catch (error) {
      console.error("Error fetching users:", error);
      return false; // Consider email not unique on error
    }
  }

  const notify = () =>
    toast.success(`Driver activity ${id ? "update" : "added"} successfully!`, {
      position: "top-right",
      autoClose: 4000, // Auto-dismiss after 1 second
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

  const watchedStartTime = watch("start_time");
  const watchedEndTime = watch("end_time");

  useEffect(() => {
    if (watchedStartTime && watchedEndTime) {
      const start = dayjs(watchedStartTime);
      const end = dayjs(watchedEndTime);

      if (start.isAfter(end)) {
        setError("start_time", {
          type: "manual",
          message: "Start time cannot be greater than end time",
        });
        setError("end_time", {
          type: "manual",
          message: "End time cannot be less than start time",
        });
      }
    }
  }, [watchedStartTime, watchedEndTime, setError]);

  const fetchEditActivity = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `${url}/driver/info/driver-activity/${id}/edit`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        setEditActivity(responseData);
        setSelectedDriverStatus(responseData.log.current_shift_status || null);
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
      router.push('/drivers/driver-activity')
    }
  }, [id, url, token]);

  // Debounced version of fetchEditActivity
  const debouncedFetchEditActivity = useCallback(
    debounce(fetchEditActivity, 1000),
    [fetchEditActivity, token]
  );

  useEffect(() => {
    if (token) {
      debouncedFetchEditActivity();
    }
  }, [debouncedFetchEditActivity, token]);

  const fetchActivity = useCallback(
    debounce(async () => {
      try {
        const response = await fetch(
          `${url}/driver/info/driver-activity/create`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          setActivity(responseData);
        } else {
          const errorData = await response.json();
          // toastr["error"]("Error fetching activity data: " + errorData.message);
        }
      } catch (error) {
        // toastr["error"]("Error fetching activity data: " + error.message);
      }
    }, 1000),
    [url, token]
  ); // Adjust debounce delay as needed

  useEffect(() => {
    if (token) {
      fetchActivity();
    }
  }, [fetchActivity, token]); // Depend on memoized fetchActivity

  useEffect(() => {
    if (editActivity?.log) {
      reset({
        driver_status: editActivity.log.current_shift_status || 0,
        driver_id: editActivity.log.driver_id || "",
        vehicle_id: editActivity.log.vehicle_id || "",
        message_reason: editActivity.log.message_reason || "",
        start_time: editActivity.log.start_log_time || "",
        end_time: editActivity.log.end_log_time || editActivity.current || "",
        location_name: editActivity.log.location_name || "",
        notes: editActivity.log.notes || "",
      });
    }
  }, [editActivity, reset]);

  useEffect(() => {
    if (editActivity) {
      if (editActivity?.log?.start_log_time) {
        const startLogTime = editActivity.log.start_log_time;
        const isStartOfDay = (dateTimeStr) => {
          const date = new Date(dateTimeStr);
          return (
            date.getHours() === 0 &&
            date.getMinutes() === 0 &&
            date.getSeconds() === 0
          );
        };

        // Set only default value when editActivity changes
        setDefaultStartTime(dayjs(startLogTime));
        setStartTime(startLogTime); // Set start time state

        if (isStartOfDay(startLogTime)) {
          setStartDayDisable(true);
        }
      }

      if (editActivity.log) {
        const { end_log_time } = editActivity.log;
        const currentEndTime = end_log_time || editActivity.current;
        setDefaultEndTime(dayjs(currentEndTime));
        setEndTime(currentEndTime); // Set end time state
        setDisables(!end_log_time);
      }
    }
  }, [editActivity]);

  useEffect(() => {
    if (editActivity?.log?.current_shift_status === 3) {
      setDriveDisable(true);
    }
  }, [editActivity]);

  const cancelChange = () => {
    setShowModal(false);
    setPendingStatus(null);
  };

  const debouncedSaveActivity = useCallback(
    debounce(async (data) => {
      if (token) {
        if (id) {
          await editActivitys(id, data);
        } else {
          await addActivity(data);
        }
        setShowModal(false);
      }
    }, 1000),
    [id, token]
  );

  const confirmChange = () => {
    debouncedSaveActivity(datass);
  };

  useEffect(() => {
    if (token) {
      if (selectedDriverStatus == 5) {
        setValue("message_reason", editActivity?.log?.message_reason || "");
      } else {
        setValue("message_reason", ""); // Optionally clear the field if status is not 5
      }
    }
  }, [selectedDriverStatus, setValue, editActivity, token]);

  const addActivity = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/driver/info/driver-activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setIsLoading(false);
        const errorData = await response.json();
        // toastr["error"]("Error adding driver: " + errorData.message);
      } else {
        setIsLoading(false);
        notify();
        router.push("/settings/organization/driver-activity");
      }
    } catch (error) {
      setIsLoading(false);
      // toastr["error"]("Error adding driver: " + error.message);
    }
  };

  const editActivitys = async (id, data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${url}/driver/info/driver-activity/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setIsLoading(false);
        const errorData = await response.json();
        if (errorData) {
          setError("end_time", {
            type: "manual",
            message: errorData.message,
          });
        }

        // toastr["error"]( errorData.message);
      } else {
        setIsLoading(false);
        notify();
        router.push("/settings/organization/driver-activity");
      }
    } catch (error) {
      setIsLoading(false);
      // toastr["error"]("Error updating driver: " + error.message);
    }
  };

  const submitData = () => {
  };

  // Use useCallback to memoize the onSubmit function
  const onSubmit = (data) => {
    setShowModal(true);
    setDatass(data);
  };

  useEffect(() => {
    if (token) {
      if (id) {
        if (activity && editActivity && selectedDriverStatus) {
          setIsDataLoading(true);
        }
      } else {
        if (activity) {
          setIsDataLoading(true);
        }
      }
    }
  }, [id, activity, editActivity, selectedDriverStatus, token]);

  if (!isDataLoading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar pt-6 pb-2 mb-5">
          <div
            id="kt_app_toolbar_container"
            className="app-container container-fluid d-flex align-items-stretch"
          >
            <div className="app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100">
              <div className="page-title d-flex flex-column justify-content-center gap-1 me-3">
                <h1 className="page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0">
                  <Skeleton width={180} />
                </h1>
                <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                  <li className="breadcrumb-item text-muted">
                    <Link href="#" className="text-muted text-hover-primary">
                      <Skeleton width={120} />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span className="bullet bg-gray-500 w-5px h-2px"></span>
                  </li>
                  <li className="breadcrumb-item text-muted">
                    <Link href="#" className="text-muted text-hover-primary">
                      <Skeleton width={150} />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span className="bullet bg-gray-500 w-5px h-2px"></span>
                  </li>
                  <li className="breadcrumb-item text-muted">
                    <Link href="#" className="text-muted text-hover-primary">
                      <Skeleton width={120} />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div id="kt_app_content" className="app-content flex-column-fluid">
          <div
            id="kt_app_content_container"
            className="app-container container-fluid"
          >
            <form
              className="form d-flex flex-column"
              onSubmit={handleSubmit(submitData)}
              id="form"
            >
              <input type="hidden" />

              <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
                <div className="tab-content">
                  <div
                    className="tab-pane fade show active"
                    id="kt_ecommerce_add_product_general"
                    role="tabpanel"
                  >
                    <div className="d-flex flex-column">
                      <div className="card overflow-visible card-flush py-4">
                        <div className="text-center">
                          <p className="fw-bolder fs-7">
                            <Skeleton width={280} />
                          </p>
                        </div>
                        <div className="separator my-0"></div>
                        <div className="card-body mt-4">
                          <>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Driver status
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Skeleton width={680} />
                              </div>
                            </div>
                            {!id && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Vehicle
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Skeleton width={680} />
                                </div>
                              </div>
                            )}
                            {id && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Start Time
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Skeleton width={680} />
                                </div>
                              </div>
                            )}
                            {id && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  End Time
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Skeleton width={680} />
                                </div>
                              </div>
                            )}
                            {!id && selectedDriverStatus == 5 && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Message reason
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Skeleton width={680} />
                                </div>
                              </div>
                            )}
                          </>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center">
                  <Skeleton width={100} />
                  <Skeleton width={100} />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar pt-6 pb-2 mb-5">
        <div
          id="kt_app_toolbar_container"
          className="app-container container-fluid d-flex align-items-stretch"
        >
          <div className="app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100">
            <div className="page-title d-flex flex-column justify-content-center gap-1 me-3">
              <h1 className="page-heading d-flex flex-column justify-content-center text-gray-900 fw-bold fs-3 m-0">
                Driver Activity
              </h1>
              <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                <li className="breadcrumb-item text-muted">
                  <Link href="#" className="text-muted text-hover-primary">
                    Home
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <span className="bullet bg-gray-500 w-5px h-2px"></span>
                </li>
                <li className="breadcrumb-item text-muted">
                  <Link href="#" className="text-muted text-hover-primary">
                    Driver Activity
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <span className="bullet bg-gray-500 w-5px h-2px"></span>
                </li>
                <li className="breadcrumb-item text-muted">
                  <Link href="#" className="text-muted text-hover-primary">
                    {id ? "Edit" : "Add"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div
          id="kt_app_content_container"
          className="app-container container-fluid"
        >
          <form
            className="form d-flex flex-column"
            onSubmit={handleSubmit(onSubmit)}
            id="form"
          >
            <input type="hidden" />

            <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
              <div className="tab-content">
                <div
                  className="tab-pane fade show active"
                  id="kt_ecommerce_add_product_general"
                  role="tabpanel"
                >
                  <div className="d-flex flex-column">
                    <div className="card overflow-visible card-flush py-4">
                      <div className="text-center">
                        <p className="fw-bolder fs-7">
                          {id
                            ? "Edit DRIVER & ACTIVITY"
                            : "Add DRIVER & ACTIVITY"}
                        </p>
                      </div>
                      <div className="separator my-0"></div>
                      <div className="card-body mt-4">
                        {activity && (
                          <>
                            <div className="mb-5 row">
                              <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                Driver Status
                              </label>
                              <div className="col-lg-10 col-md-12 col-sm-12">
                                <Controller
                                  name="driver_status"
                                  control={control}
                                  defaultValue={
                                    editActivity?.log?.current_shift_status
                                  }
                                  rules={formValidations.driver_status}
                                  render={({ field: { onChange } }) => (
                                    <div className="status-grid">
                                      {activity?.listOption?.map((data) => (
                                        <div
                                          key={data.option_id}
                                          role="button"
                                          onClick={() => {
                                            setSelectedDriverStatus(
                                              data.option_id
                                            );
                                            onChange(data.option_id);
                                          }}
                                          className={`status-option ${selectedDriverStatus ==
                                            data.option_id
                                            ? "selected-status"
                                            : "unselected-status"
                                            } ${driveDisble ? "disabled" : ""}`}
                                        >
                                          {data.title === "Off duty" ? (
                                            <div className="icon-container">
                                              <img
                                                src="/duty_logo/off.svg"
                                                alt="Off"
                                                width={20}
                                                className="icon mb-1"
                                              />
                                              <span>Off</span>
                                            </div>
                                          ) : data.title === "ON duty" ? (
                                            <div className="icon-container">
                                              <img
                                                src="/duty_logo/coffee.svg"
                                                alt="On"
                                                width={20}
                                                className="icon mb-1"
                                              />
                                              <span>On</span>
                                            </div>
                                          ) : data.title === "Driving" ? (
                                            <div className="icon-container">
                                              <img
                                                src="/duty_logo/drive.svg"
                                                alt="Drive"
                                                width={20}
                                                className="icon mb-1"
                                              />
                                              <span>D</span>
                                            </div>
                                          ) : data.title ===
                                            "Sleeping Birth" ? (
                                            <div className="icon-container">
                                              <img
                                                src="/duty_logo/sleeper.svg"
                                                alt="SB"
                                                width={20}
                                                className="icon mb-1"
                                              />
                                              <span>SB</span>
                                            </div>
                                          ) : data.title ===
                                            "Personal Conveyance" ? (
                                            <div className="icon-container">
                                              <img
                                                src="/duty_logo/pu.svg"
                                                alt="Personal Conveyance"
                                                width={20}
                                                className="icon mb-1"
                                              />
                                              <span>Personal Conveyance</span>
                                            </div>
                                          ) : (
                                            <div className="icon-container">
                                              <img
                                                src="/duty_logo/ym.svg"
                                                alt="Yard moves"
                                                width={20}
                                                className="icon mb-1"
                                              />
                                              <span>Yard moves</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                />
                                {errors.driver_status && (
                                  <p style={{ color: "red" }}>
                                    {errors.driver_status.message}
                                  </p>
                                )}

                                <style jsx>{`
                                  .status-grid {
                                    display: grid;
                                    grid-template-columns: repeat(3, 1fr);
                                    gap: 15px; /* Adjusts the gap between buttons */
                                  }

                                  .status-option {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    padding: 10px;
                                    cursor: pointer;
                                    border: 1px solid #ccc;
                                    border-radius: 5px;
                                    transition: background-color 0.3s ease,
                                      color 0.3s ease;
                                  }

                                  .icon-container {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                  }

                                  .unselected-status:hover {
                                    background-color: #d6d8db;
                                    color: #333;
                                  }

                                  .selected-status {
                                    background-color: #007bff;
                                    color: #fff;
                                    border: 2px solid #0056b3;
                                  }

                                  .disabled {
                                    pointer-events: none;
                                    opacity: 0.6;
                                  }
                                `}</style>
                              </div>
                            </div>

                            {!id && activity && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Vehicle
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <Controller
                                    name="vehicle_id"
                                    control={control}
                                    defaultValue={
                                      editActivity?.log?.vehicle_id || ""
                                    }
                                    rules={formValidations.vehicle_id}
                                    render={({
                                      field: { onChange, value },
                                    }) => {
                                      return (
                                        <div
                                          className="d-flex flex-wrap"
                                          style={{ gap: "10px" }}
                                        >
                                          {activity?.vehicle?.map((data) => {
                                            const isSelected =
                                              value === data.vehicle.id;
                                            return (
                                              <div
                                                key={data.vehicle.id}
                                                role="button"
                                                onClick={() =>
                                                  onChange(data.vehicle.id)
                                                }
                                                className={`vehicle-option col-6 col-md-3 col-lg-2 mb-2 ${isSelected
                                                  ? "selected-vehicle"
                                                  : "unselected-vehicle"
                                                  }`}
                                                style={{
                                                  padding: "10px",
                                                  border: "1px solid #ddd",
                                                  borderRadius: "5px",
                                                  textAlign: "center",
                                                  cursor: "pointer",
                                                  backgroundColor: isSelected
                                                    ? "#007bff"
                                                    : "#f8f9fa",
                                                  color: isSelected
                                                    ? "#fff"
                                                    : "#000",
                                                }}
                                              >
                                                {data.vehicle.name}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }}
                                  />
                                  {errors.vehicle_id && (
                                    <p style={{ color: "red" }}>
                                      {errors.vehicle_id.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {id && (
                              <div>
                                <div className="mb-5 row">
                                  <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                    Start Time
                                  </label>
                                  <div className="col-lg-10 col-md-12 col-sm-12">
                                    <LocalizationProvider
                                      dateAdapter={AdapterDayjs}
                                    >
                                      <DemoContainer
                                        components={[
                                          "TimePicker",
                                          "TimePicker",
                                          "TimePicker",
                                        ]}
                                      >
                                        <DemoItem>
                                          <TimePicker
                                            className={`form-control mb-2 ${errors.start_time
                                              ? "is-invalid"
                                              : ""
                                              }`}
                                            views={[
                                              "hours",
                                              "minutes",
                                              "seconds",
                                            ]}
                                            value={defaultStartTime} // Set default value here
                                            disabled={
                                              startDayDisable || driveDisble
                                            }
                                            {...register(
                                              "start_time",
                                              formValidations.start_time
                                            )}
                                            onChange={(newValue) => {
                                              const formattedTime = dayjs(newValue).format("YYYY-MM-DD HH:mm:ss");
                                              setValue("start_time", formattedTime, { shouldValidate: true });
                                            }}
                                          />
                                          {errors.start_time && (
                                            <p
                                              style={{ color: "red" }}
                                              className="invalid-feedback"
                                            >
                                              {errors.start_time.message}
                                            </p>
                                          )}
                                        </DemoItem>
                                      </DemoContainer>
                                    </LocalizationProvider>
                                  </div>
                                </div>
                                <div className="mb-5 row">
                                  <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                    End Time
                                  </label>
                                  <div className="col-lg-10 col-md-12 col-sm-12">
                                    <LocalizationProvider
                                      dateAdapter={AdapterDayjs}
                                    >
                                      <DemoContainer
                                        components={[
                                          "TimePicker",
                                          "TimePicker",
                                          "TimePicker",
                                        ]}
                                      >
                                        <DemoItem>
                                          <TimePicker
                                            className={`form-control mb-2 ${errors.end_time ? "is-invalid" : ""}`}
                                            views={["hours", "minutes", "seconds"]}
                                            value={defaultEndTime}
                                            disabled={disables || driveDisble}
                                            {...register("end_time", {
                                              required: "End time is required",
                                              validate: (value) => {
                                                if (editActivity?.checkCurrentDay && editActivity?.current) {
                                                  const inputTime = dayjs(value);
                                                  const currentTime = dayjs(editActivity.current);
                                                  if (inputTime.isAfter(currentTime)) {
                                                    return "End time cannot exceed the current time.";
                                                  }
                                                }
                                                return true;
                                              },
                                            })}
                                            onChange={(newValue) => {
                                              const formattedTime = dayjs(newValue).format("YYYY-MM-DD HH:mm:ss");
                                              setValue("end_time", formattedTime, { shouldValidate: true });
                                            }}
                                          />
                                          {errors.end_time && (
                                            <p className="invalid-feedback">
                                              {errors.end_time.message}
                                            </p>
                                          )}
                                        </DemoItem>
                                      </DemoContainer>
                                    </LocalizationProvider>
                                  </div>
                                </div>
                                <div className="mb-5 row">
                                  <label className="col-lg-2 col-md-12 col-sm-12 col-form-label">
                                    Location
                                  </label>
                                  <div className="col-lg-10 col-md-12 col-sm-12">
                                    <input
                                      type="text"
                                      name="location_name"
                                      className={`form-control mb-2 
                                                                                ${errors.location_name
                                          ? "is-invalid"
                                          : ""
                                        }
                                                                                `}
                                      placeholder="Location name"
                                      defaultValue={
                                        editActivity?.log?.location_name
                                      }
                                      {...register(
                                        "location_name",
                                        formValidations.location_name
                                      )}
                                    />
                                    {errors.location_name && (
                                      <p className="invalid-feedback">
                                        {errors.location_name.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="mb-5 row">
                                  <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                    Notes
                                  </label>
                                  <div className="col-lg-10 col-md-12 col-sm-12">
                                    <input
                                      type="text"
                                      name="notes"
                                      className={`form-control mb-2
                                                                                ${errors.notes
                                          ? "is-invalid"
                                          : ""
                                        }
                                                                                `}
                                      placeholder="Notes"
                                      defaultValue={editActivity?.log?.notes}
                                      {...register(
                                        "notes",
                                        formValidations.notes
                                      )}
                                    />
                                    {errors.notes && (
                                      <p className="invalid-feedback">
                                        {errors.notes.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            {selectedDriverStatus == 5 && (
                              <div className="mb-5 row">
                                <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                  Message reason
                                </label>
                                <div className="col-lg-10 col-md-12 col-sm-12">
                                  <textarea
                                    name="message_reason"
                                    className={`form-control mb-2 ${errors.message_reason ? "is-invalid" : ""
                                      }`}
                                    placeholder="Message reason"
                                    defaultValue={
                                      editActivity?.log?.message_reason
                                    }
                                    style={{ height: "200px" }} // Increased height
                                    {...register("message_reason", {
                                      validate: (value) => {
                                        if (
                                          selectedDriverStatus == 5 &&
                                          !value
                                        ) {
                                          return "Message reason is required";
                                        }
                                        return true;
                                      },
                                    })}
                                  />
                                  {errors.message_reason && (
                                    <p className="invalid-feedback">
                                      {errors.message_reason.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center">
                <Link href="/dashboard/drivers" className="btn btn-light me-5">
                  Cancel
                </Link>
                <button
                  id="kt_sign_in_submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <span className="indicator-progress d-flex justify-content-center">
                    {id ? "Update" : "Save"}
                  </span>
                </button>

                {showModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <p>
                        Do you want to {id ? "update " : "save"} the current
                        duty log?
                      </p>
                      <div className="modal-buttons">
                        <button
                          onClick={cancelChange}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmChange} // Corrected to invoke confirmChange
                          className="confirm-button"
                        >
                          {isLoading ? (
                            <LoadingIcons.TailSpin height={18} />
                          ) : id ? (
                            "Update"
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <style jsx>{`
                  .status-option {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px;
                    cursor: pointer;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    transition: background-color 0.3s ease, color 0.3s ease;
                  }

                  .unselected-status:hover {
                    background-color: #d6d8db;
                    color: #333;
                  }

                  .selected-status {
                    background-color: #007bff;
                    color: #fff;
                    border: 2px solid #0056b3;
                  }

                  .disabled {
                    pointer-events: none;
                    opacity: 0.6;
                  }

                  .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }

                  .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    width: auto;
                    max-width: 300px;
                    box-sizing: border-box;
                  }

                  .modal-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 20px;
                  }

                  .cancel-button {
                    background: #ccc;
                    color: #333;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  }

                  .confirm-button {
                    background: #007bff;
                    color: #fff;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  }

                  @media (max-width: 576px) {
                    .status-option {
                      flex: 1 1 100%;
                      text-align: center;
                    }
                  }
                `}</style>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ActivityForm;
