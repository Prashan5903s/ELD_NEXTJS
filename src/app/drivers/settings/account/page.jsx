"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Select from "react-select";
import { debounce } from "lodash";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { useSession } from "next-auth/react";
import LoadingIcons from "react-loading-icons";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "react-toastify/dist/ReactToastify.css";
import "react-loading-skeleton/dist/skeleton.css"; // Import Skeleton CSS

function Account() {
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [datas, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const { data: session } = (useSession()) || {};

    const token = session && session.user && session?.user?.token;

    const formValidations = {
        first_name: {
            required: "First name is required",
        },
        last_name: {
            required: "Last name is required",
        },
        state_id: {
            required: "License State is required",
        },
        licenseNumber: {
            required: "License no is required",
        },
        driverId: {
            required: "Driver id is required",
            pattern: {
                value: /^[0-9]+$/,  // This ensures the value is numeric (only digits allowed)
                message: "Driver id must be numeric",  // Custom error message
            },
        },
        email: {
            required: "Email is required",
            pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,  // Email format validation
                message: "Invalid email address",
            },
        },
        language_id: {
            required: "Language selection is required",
        },
        mobile_no: {
            required: "Mobile no is required",
            pattern: {
                value: /^[0-9]+$/,  // Ensures that the value is numeric (only digits allowed)
                message: "Mobile no must be numeric",  // Custom error message
            },
            minLength: {
                value: 10,  // Minimum length of 10 characters
                message: "Mobile no must be at least 10 digits",  // Custom error message for min length
            },
            maxLength: {
                value: 15,  // Maximum length of 15 characters
                message: "Mobile no must be at most 15 digits",  // Custom error message for max length
            },
        },
    };

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        control,
    } = useForm();

    const notify = () =>
        toast.success(
            `Account data updated successfully!`,
            {
                position: "top-right",
                autoClose: 4000, // Auto-dismiss after 1 second
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            }
        );

    const fetchAccountData = useCallback(
        debounce(async () => {
            try {
                const response = await fetch(
                    `${url}/driver/setting/account/data`,
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
                    setIsDataLoading(true);
                    setData(responseData?.data);
                }
            } catch (error) {

            } finally {
                setIsDataLoading(true);
            }
        }, 1000),
        [url, token]
    );

    useEffect(() => {
        if (token) {
            fetchAccountData();
        }
    }, [token]);

    const AddAccountDetail = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/driver/setting/account/data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {

                toast.error(responseData.message || "Something went wrong.", {
                    position: "top-right",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            } else {
                notify(); // Your custom success toast?
                fetchAccountData(); // Refresh data
            }
        } catch (error) {

            toast.error(error.message || "An unexpected error occurred.", {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Create a debounced version of the onSubmit function
    const handleSubmits = useCallback(
        debounce(async (data) => {
            await AddAccountDetail(data);
        }, 1000), // Adjust debounce delay as needed
        [token]
    );

    const onSubmit = async (data) => {
        handleSubmits(data);
    };

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
                                    <Skeleton width={15} />
                                </h1>
                                <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0">
                                    <li className="breadcrumb-item text-muted">
                                        <Link href="#" className="text-muted text-hover-primary">
                                            <Skeleton width={12} />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <span className="bullet bg-gray-500 w-5px h-2px"></span>
                                    </li>
                                    <li className="breadcrumb-item text-muted">
                                        <Link href="#" className="text-muted text-hover-primary">
                                            <Skeleton width={15} />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <span className="bullet bg-gray-500 w-5px h-2px"></span>
                                    </li>
                                    <li className="breadcrumb-item text-muted">
                                        <Link href="#" className="text-muted text-hover-primary">
                                            <Skeleton width={15} />
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
                                                        <Skeleton width={120} />
                                                    </p>
                                                </div>
                                                <div className="separator my-0"></div>
                                                <div className="card-body mt-4">
                                                    <>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Name
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Driver Id
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                License
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Mobile
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Email
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Username
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
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
                                Account
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
                                        Account
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
                        autoComplete="off"
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
                                                    Account
                                                </p>
                                            </div>
                                            <div className="separator my-0"></div>
                                            <div className="card-body mt-4">
                                                {datas && (
                                                    <>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Name
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="first_name"
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        defaultValue={datas.user.first_name}
                                                                        rules={formValidations.first_name}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text"
                                                                                className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                                                                                placeholder="First Name"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.first_name && (
                                                                        <p style={{ color: "red" }}>{errors.first_name.message}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="last_name"
                                                                        defaultValue={datas.user.last_name}
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        rules={formValidations.last_name}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text"
                                                                                className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                                                                                placeholder="Last Name"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.last_name && (
                                                                        <p style={{ color: "red" }}>{errors.last_name.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                License
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="licenseNumber"
                                                                        defaultValue={datas.userInfo.licenseNumber}
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        rules={formValidations.licenseNumber}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text"
                                                                                className={`form-control ${errors.licenseNumber ? "is-invalid" : ""}`}
                                                                                placeholder="License Number"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.licenseNumber && (
                                                                        <p style={{ color: "red" }}>{errors.licenseNumber.message}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="state_id"
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        defaultValue={datas.userInfo.driver_license_state}
                                                                        rules={formValidations.state_id}
                                                                        render={({ field: { onChange, onBlur, value, ref } }) => {
                                                                            const selectedState = datas?.state?.find((data) => data.state_id == value);
                                                                            const formattedValue = selectedState
                                                                                ? { value: selectedState.state_id, label: selectedState.state_name }
                                                                                : null;

                                                                            return (
                                                                                <Select
                                                                                    ref={ref}
                                                                                    value={formattedValue}
                                                                                    onChange={(selectedOption) => {
                                                                                        const newValue = selectedOption ? selectedOption.value : "";
                                                                                        onChange(newValue);
                                                                                    }}
                                                                                    onBlur={onBlur}
                                                                                    options={datas?.state?.map((data) => ({
                                                                                        value: data.state_id,
                                                                                        label: data.state_name,
                                                                                    }))}
                                                                                    placeholder="Select State"
                                                                                    className={`react-select-styled react-select-lg ${errors.state_id ? "is-invalid" : ""}`}
                                                                                    classNamePrefix="react-select"
                                                                                    isSearchable
                                                                                />
                                                                            );
                                                                        }}
                                                                    />
                                                                    {errors.state_id && (
                                                                        <p style={{ color: "red" }}>{errors.state_id.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                DriverId
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="driverId"
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        rules={formValidations.driverId}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text"
                                                                                className={`form-control ${errors.driverId ? "is-invalid" : ""}`}
                                                                                placeholder="DriverId"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.driverId && (
                                                                        <p style={{ color: "red" }}>{errors.driverId.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Mobile no
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="mobile_no"
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        rules={formValidations.mobile_no}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text" // Changed from 'email' to 'text'
                                                                                className={`form-control ${errors.mobile_no ? "is-invalid" : ""}`}
                                                                                placeholder="Mobile no"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.mobile_no && (
                                                                        <p style={{ color: "red" }}>{errors.mobile_no.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Email
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="email"
                                                                        control={control}
                                                                        rules={formValidations.email}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="email"
                                                                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                                                                placeholder="Email"
                                                                                {...field}
                                                                                autoComplete="off"
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.email && (
                                                                        <p style={{ color: "red" }}>{errors.email.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Language
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Controller
                                                                    name="language_id"
                                                                    control={control}
                                                                    defaultValue={datas.user.language_id}
                                                                    autoComplete="off"
                                                                    rules={formValidations.language_id}
                                                                    render={({ field: { onChange, onBlur, value, ref } }) => {
                                                                        const selectedLanguage =
                                                                            datas?.language?.find((data) => data.id == value);

                                                                        const formattedValue = selectedLanguage
                                                                            ? {
                                                                                value: selectedLanguage.id,
                                                                                label: `${selectedLanguage.language_name}`,
                                                                            }
                                                                            : null;

                                                                        return (
                                                                            <Select
                                                                                ref={ref}
                                                                                value={formattedValue}
                                                                                onChange={(selectedOption) => {
                                                                                    const newValue = selectedOption
                                                                                        ? selectedOption.value
                                                                                        : "";
                                                                                    onChange(newValue);
                                                                                }}
                                                                                onBlur={onBlur}
                                                                                options={datas?.language?.map((data) => ({
                                                                                    value: data.id,
                                                                                    label: `${data.language_name}`,
                                                                                }))}
                                                                                placeholder="Select Language"
                                                                                className={`react-select-styled react-select-lg ${errors.language_id ? "is-invalid" : ""}`}
                                                                                classNamePrefix="react-select"
                                                                                isSearchable
                                                                            />
                                                                        );
                                                                    }}
                                                                />
                                                                {errors.language_id && (
                                                                    <p style={{ color: "red" }}>
                                                                        {errors.language_id.message}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center">
                                <Link
                                    href="/settings/organization/vehicle-assign"
                                    className="btn-light me-5"
                                >
                                    Cancel
                                </Link>
                                <button
                                    id="kt_sign_in_submit"
                                    className="justify-content-center btn-primary"
                                    disabled={isLoading}
                                >
                                    <span className="indicator-progress d-flex justify-content-center">
                                        {isLoading ? (
                                            <LoadingIcons.TailSpin height={18} />
                                        ) : (
                                            "Update"
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

export default Account;
