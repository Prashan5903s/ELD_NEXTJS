"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import LoadingIcons from "react-loading-icons";

function FleetUserForm({ id = null }) {
  const router = useRouter();
  const [datass, setDatas] = useState(null);
  const [edits, setEdits] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const { data: session } = useSession();
  const token = session?.user?.token;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      inspection_type: "",
      parts_type: {},
      vehicle: "",
      start_time: "",
    },
    mode: "onChange",
  });

  const notify = () =>
    toast.success(
      `Inspection report ${id ? "updated" : "added"} successfully!`,
      {
        position: "top-right",
        autoClose: 4000,
      }
    );

  const fetchEditData = async () => {
    try {
      const response = await axios.get(`${url}/dvir/driver/data/${id}/edit`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEdits(response.data);
    } catch (error) {
      console.error("Error fetching edit data:", error);
      // router.push("/dashboard/fleet-user");
    }
  };

  const fetchFormOptions = async () => {
    try {
      const response = await axios.get(`${url}/dvir/driver/data/create`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDatas(response.data.data);
    } catch (error) {
      console.error("Error fetching form options:", error);
      router.push("/dashboard/fleet-user");
    }
  };

  useEffect(() => {
    if (token) {
      fetchFormOptions();
      if (id) fetchEditData();
    }
  }, [token]);

  useEffect(() => {
    const fetchImageAsFile = async (url, fileName) => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], fileName, { type: blob.type });
    };

    const initForm = async () => {
      if (id && edits?.data) {
        const user = edits.data;
        setValue("inspection_type", user.inspection_type);
        setValue("vehicle", user.vehicle_id);

        const logInspection = user?.inspection_log;

        if (logInspection && logInspection.length > 0) {
          for (let i = 0; i <= logInspection.length; i++) {
            const part = logInspection[i];
            if (part) {
              const key = part?.parts_id;

              setValue(`parts_type.${key}.value`, String(part.is_ok));
              setValue(`parts_type.${key}.notes`, part.notes || "");
              setValue(`parts_type.${key}.defect_type`, part.defect_type || "");

              if (part.image_url) {
                const fileName = part.image_url.split("/").pop();
                try {
                  const file = await fetchImageAsFile(part.image_url, fileName);
                  setValue(`parts_type.${key}.image`, file);
                } catch (error) {
                  console.error("Failed to fetch image:", error);
                  setValue(`parts_type.${key}.image`, null);
                }
              } else {
                setValue(`parts_type.${key}.image`, null);
              }
            }
          }
        }
      }
    };

    initForm();
  }, [id, edits, setValue]);

  useEffect(() => {
    if (datass && !id) {
      setIsDataLoading(true);
    }
    if (id && edits && datass) {
      setIsDataLoading(true);
    }
  }, [datass, edits, id]);

  const onSubmit = async (formData) => {
    let hasError = false;

    datass?.parts_type?.forEach((item) => {
      const part = getValues(`parts_type.${item.option_id}`);
      if (!part?.value) {
        setError(`parts_type.${item.option_id}.value`, {
          type: "manual",
          message: `Please select OK or Not OK for ${item.title}`,
        });
        hasError = true;
      } else if (part.value === "2") {
        if (!part.defect_type) {
          setError(`parts_type.${item.option_id}.defect_type`, {
            type: "manual",
            message: "Defect type is required for Not OK",
          });
          hasError = true;
        }
        if (!part.notes) {
          setError(`parts_type.${item.option_id}.notes`, {
            type: "manual",
            message: "Note is required for Not OK",
          });
          hasError = true;
        }
        if (!part.image || part.image.length === 0) {
          setError(`parts_type.${item.option_id}.image`, {
            type: "manual",
            message: "Image is required for Not OK",
          });
          hasError = true;
        }
      }
    });

    if (hasError) return;

    const formPayload = new FormData();
    formPayload.append("inspection_type", formData.inspection_type);
    formPayload.append("vehicle", formData.vehicle);
    formPayload.append("start_time", watch("start_time"));

    datass?.parts_type?.forEach((item) => {
      const key = item.option_id;
      const part = formData.parts_type[key];
      if (part) {
        formPayload.append(`parts_type[${key}][value]`, part.value);
        if (part.value === "2") {
          formPayload.append(`parts_type[${key}][notes]`, part.notes || "");
          formPayload.append(
            `parts_type[${key}][defect_type]`,
            part.defect_type || ""
          );
          if (part.image?.[0]) {
            formPayload.append(`parts_type[${key}][image]`, part.image[0]);
          }
        }
      }
    });

    try {
      setIsLoading(true);
      const method = "POST";
      const endpoint = id
        ? `${url}/data/driver/imspection/${id}`
        : `${url}/dvir/driver/data`;

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Submit error:", errorData);
        return;
      }

      const result = await response.json(); // ✅ await this properly

      // notify();
      router.push("/drivers/inspection");
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datass) {
      setValue("start_time", datass.start_time);
    }
  }, [datass]);

  if (!isDataLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-10">
        <LoadingIcons.TailSpin stroke="#3699FF" height={50} />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div className="app-toolbar pt-6 pb-2 mb-5">
        <div className="app-container container-fluid d-flex align-items-stretch">
          <div className="app-toolbar-wrapper d-flex flex-stack flex-wrap gap-4 w-100">
            <div className="page-title d-flex flex-column justify-content-center gap-1 me-3">
              <h1 className="page-heading text-gray-900 fw-bold fs-3 m-0">
                Inspection report
              </h1>
              <ul className="breadcrumb fw-semibold fs-7 my-0">
                <li className="breadcrumb-item text-muted">
                  <Link
                    href="/drivers/inspection"
                    className="text-muted text-hover-primary"
                  >
                    Home
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">
                  <Link
                    href="/drivers/inspection"
                    className="text-muted text-hover-primary"
                  >
                    Inspection report
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">
                  {id ? "Edit" : "Add"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content flex-column-fluid">
        <div className="app-container container-fluid">
          <form
            className="form d-flex flex-column"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
              <div className="card card-flush py-4">
                <div className="card-body mt-4">
                  {/* Inspection Type */}
                  <div className="mb-5 row">
                    <label className="required form-label col-lg-2">
                      Inspection Type
                    </label>
                    <div className="col-lg-10">
                      <select
                        className={`form-control mb-2 ${
                          errors.inspection_type ? "is-invalid" : ""
                        }`}
                        {...register("inspection_type", {
                          required: "Inspection type is required",
                        })}
                      >
                        <option value="">Select Inspection Type</option>
                        {datass?.inspection_type?.map((item) => (
                          <option key={item.option_id} value={item.option_id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                      {errors.inspection_type && (
                        <p className="invalid-feedback">
                          {errors.inspection_type.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="mb-5 row">
                    <label className="required form-label col-lg-2">
                      Vehicle
                    </label>
                    <div className="col-lg-10">
                      <select
                        className={`form-control mb-2 ${
                          errors.vehicle ? "is-invalid" : ""
                        }`}
                        {...register("vehicle", {
                          required: "Vehicle is required",
                        })}
                      >
                        <option value="">Select Vehicle</option>
                        {datass?.vehicle?.map((item) => (
                          <option key={item.vechile_id} value={item.vechile_id}>
                            {item.vehicle.name}
                          </option>
                        ))}
                      </select>
                      {errors.vehicle && (
                        <p className="invalid-feedback">
                          {errors.vehicle.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Parts Check */}
                  {datass?.parts_type?.map((item) => {
                    const partKey = item.option_id;
                    const selectedValue = watch(`parts_type.${partKey}.value`);
                    const selectedDefect = watch(
                      `parts_type.${partKey}.defect_type`
                    );

                    return (
                      <div key={partKey} className="mb-5 row">
                        <label className="required col-lg-2 col-form-label">
                          {item.title}
                        </label>
                        <div className="col-lg-10 d-flex flex-column">
                          <div className="d-flex gap-3 flex-wrap">
                            {Object.entries(datass?.is_ok || {}).map(
                              ([label, value]) => (
                                <div
                                  key={value}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <input
                                    type="radio"
                                    {...register(
                                      `parts_type.${partKey}.value`,
                                      {
                                        required: `Please select OK or Not OK for ${item.title}`,
                                      }
                                    )}
                                    value={String(value)}
                                    checked={selectedValue === String(value)}
                                    onChange={() => {
                                      setValue(
                                        `parts_type.${partKey}.value`,
                                        String(value)
                                      );
                                      clearErrors(
                                        `parts_type.${partKey}.value`
                                      );
                                    }}
                                  />
                                  <label>{label}</label>
                                </div>
                              )
                            )}
                          </div>
                          {errors.parts_type?.[partKey]?.value && (
                            <p className="text-danger mt-1">
                              {errors.parts_type[partKey].value.message}
                            </p>
                          )}

                          {selectedValue === "2" && (
                            <>
                              {/* Defect Type Buttons */}
                              <div className="d-flex gap-2 flex-wrap mt-3">
                                {datass?.defect_type?.map((defect) => (
                                  <button
                                    key={defect.option_id}
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    style={{
                                      minWidth: "100px",
                                      height: "38px",
                                      borderRadius: "8px",
                                      transition: "all 0.2s ease-in-out",
                                      backgroundColor:
                                        selectedDefect == defect.option_id
                                          ? "#c6e8ff"
                                          : "white",
                                      color:
                                        selectedDefect == defect.option_id
                                          ? "black"
                                          : "#333",
                                      border: "1px solid #c6e8ff",
                                    }}
                                    onClick={() => {
                                      setValue(
                                        `parts_type.${partKey}.defect_type`,
                                        defect.option_id
                                      );
                                      clearErrors(
                                        `parts_type.${partKey}.defect_type`
                                      );
                                    }}
                                  >
                                    {defect.title}
                                  </button>
                                ))}
                              </div>
                              {errors.parts_type?.[partKey]?.defect_type && (
                                <p className="text-danger mt-1">
                                  {
                                    errors.parts_type[partKey].defect_type
                                      .message
                                  }
                                </p>
                              )}

                              <textarea
                                placeholder="Enter notes"
                                className="form-control mt-3"
                                {...register(`parts_type.${partKey}.notes`, {
                                  required: "Note is required when Not OK",
                                })}
                              />
                              {errors.parts_type?.[partKey]?.notes && (
                                <p className="text-danger mt-1">
                                  {errors.parts_type[partKey].notes.message}
                                </p>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  setValue(
                                    `parts_type.${partKey}.image`,
                                    file ? [file] : []
                                  );
                                  clearErrors(`parts_type.${partKey}.image`);
                                }}
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ccc",
                                  borderRadius: "6px",
                                  backgroundColor: "#f9f9f9",
                                  color: "#333",
                                  cursor: "pointer",
                                  width: "100%",
                                  maxWidth: "250px",
                                  fontSize: "14px",
                                }}
                              />

                              {errors.parts_type?.[partKey]?.image && (
                                <p className="text-danger mt-1">
                                  {errors.parts_type[partKey].image.message}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="d-flex justify-content-center">
                <Link
                  href="/drivers/inspection"
                  className="btn btn-light me-5"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <span className="d-flex align-items-center">
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
  );
}

export default FleetUserForm;
