"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { debounce } from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import LoadingIcons from "react-loading-icons";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

type Driver = {
  id: string;
  first_name: string;
  last_name: string;
};

type UnidentifiedDriving = {
  id: Number,
  vehicle_assign: { driver: Driver }[];
};

type AddUnidentifiedDrivingModalProps = {
  unidentifiedDriving: UnidentifiedDriving | null;
  close: (state: boolean) => void;
  open: boolean;
  updateVehiclesList: () => void;
};

const AddUnidentifiedDrivingModal = ({
  unidentifiedDriving,
  close,
  open,
  updateVehiclesList,
}: AddUnidentifiedDrivingModalProps) => {
  const [unidentifiedDriveField, setUnidentifiedDriveField] = useState({
    driver_id: "",
  });

  interface User {
    token: string;
  }

  interface SessionData {
    user?: User;
  }

  const { data: session } = useSession() as { data?: SessionData };
  const token = session?.user?.token;
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const notify = () =>
    toast.success("Unidentified driving updated successfully!", {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

  const changeUnidentifiedDriveFieldHandler = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setUnidentifiedDriveField({
      ...unidentifiedDriveField,
      [e.target.name]: e.target.value,
    });
  };

  const useDebouncedSubmit = (callback: () => void, delay: number) => {
    return useCallback(debounce(callback, delay), [callback, delay]);
  };

  const formValidations = {
    driver_id: {
      required: "Driver Id is required",
    },
  };

  type ValidationRule = {
    required?: string;
  };

  const validateForm = async () => {
    let isValid = true;
    let errors: { [key: string]: string } = {};

    for (const [key, validation] of Object.entries(formValidations)) {
      if (
        (validation as ValidationRule).required &&
        !unidentifiedDriveField[key as keyof typeof unidentifiedDriveField]
      ) {
        errors[key] = `Driver id is required`;
        isValid = false;
      }
    }

    setErrors(errors);
    return isValid;
  };

  const handleFormSubmit = async () => {

    setIsLoading(true);
    try {
      const apiUrl = `${url}/transport/unidentified/driving/data/${unidentifiedDriving?.id}`; // Replace with actual endpoint
      const response = await axios.put(apiUrl, unidentifiedDriveField, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        close(false);
        updateVehiclesList();
        notify();
      } else {
        console.error("Failed to save:", response.data);
      }
    } catch (error: any) {
      let errorDriver = {};
      errorDriver['driver_id'] = `${error.response?.data?.message}`;
      setErrors(errorDriver);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSubmit = useDebouncedSubmit(handleFormSubmit, 1000);

  const onSubmitChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;
    debouncedSubmit();
  };

  return (
    <div
      className={`modal ${open ? "showpopup" : ""}`}
      style={{ display: "block" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered w-100 mw-650px">
        <div className="modal-content">
          <div className="modal-header">
            {unidentifiedDriving && (
              <h2 className="fw-bold">Unidentified driving</h2>
            )}
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
              <div className="fv-row mb-7">
                <label className="fs-6 fw-semibold form-label mb-2">
                  <span className="required">DRIVER ID</span>
                </label>
                <select
                  className="form-select form-select-solid"
                  name="driver_id"
                  aria-label="Select driver"
                  onChange={changeUnidentifiedDriveFieldHandler}
                  value={unidentifiedDriveField.driver_id || ""}
                >
                  <option value="">Select an option</option>
                  {unidentifiedDriving?.vehicle_assign.map((item) => (
                    <option key={item.driver.id} value={item.driver.id}>
                      {item.driver.first_name} {item.driver.last_name}
                    </option>
                  ))}
                </select>
                {errors.driver_id && (
                  <div style={{ color: "red", marginTop: "5px" }}>
                    {errors.driver_id}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn-light me-5"
                  onClick={() => close(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="kt_sign_in_submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <span className="indicator-progress d-flex justify-content-center">
                    {isLoading ? (
                      <LoadingIcons.TailSpin height={18} />
                    ) : unidentifiedDriving ? (
                      "Update"
                    ) : (
                      "Save"
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUnidentifiedDrivingModal;
