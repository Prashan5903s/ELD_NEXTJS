"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { debounce } from "lodash";
import axios from "axios";
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
        carrer_name: {
            required: "Carrer name is required",
        },
        main_office_address: {
            required: "Main office address is required",
        },
        home_terminal_address: {
            required: "Home terminal address is required",
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
                    `${url}/driver/carrer/data`,
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
            const response = await fetch(`${url}/driver/carrer/data`, {
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
                toastr["error"]("Error adding driver: " + errorData.message);
            } else {
                setIsLoading(false);
                fetchAccountData();
                notify();
            }
        } catch (error) {
            setIsLoading(false);
            // toastr["error"]("Error adding driver: " + error.message);
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
                                                                Carrer Name
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Main Office Address
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12">
                                                                <Skeleton width={680} />
                                                            </div>
                                                        </div>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Home Terminal Address
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
                                Carrer
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
                                        Carrer
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
                                                    Carrer
                                                </p>
                                            </div>
                                            <div className="separator my-0"></div>
                                            <div className="card-body mt-4">
                                                {datas && (
                                                    <>
                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Carrer Name
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="carrer_name"
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        defaultValue={datas.userInfo.career_name}
                                                                        rules={formValidations.carrer_name}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text"
                                                                                className={`form-control ${errors.carrer_name ? "is-invalid" : ""}`}
                                                                                placeholder="Carrer Name"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.carrer_name && (
                                                                        <p style={{ color: "red" }}>{errors.carrer_name.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Main Office Address
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="main_office_address"
                                                                        defaultValue={datas.userInfo.main_office_address}
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        rules={formValidations.main_office_address}
                                                                        render={({ field }) => (
                                                                            <input
                                                                                type="text"
                                                                                className={`form-control ${errors.main_office_address ? "is-invalid" : ""}`}
                                                                                placeholder="Main Office Address"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                    {errors.main_office_address && (
                                                                        <p style={{ color: "red" }}>{errors.main_office_address.message}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-5 row">
                                                            <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                                Home Terminal Address
                                                            </label>
                                                            <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                                <div className="flex-grow-1">
                                                                    <Controller
                                                                        name="home_terminal_address"
                                                                        control={control}
                                                                        autoComplete="off"
                                                                        defaultValue={datas?.userInfo?.home_terminal?.id}
                                                                        rules={formValidations.home_terminal_address}
                                                                        render={({ field: { onChange, onBlur, value, ref } }) => {
                                                                            const selectedAddress = datas?.location?.find((data) => data.id == value);
                                                                            const formattedValue = selectedAddress
                                                                                ? { value: selectedAddress.id, label: selectedAddress.address }
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
                                                                                    options={datas?.location?.map((data) => ({
                                                                                        value: data.id,
                                                                                        label: data.address,
                                                                                    }))}
                                                                                    placeholder="Select State"
                                                                                    className={`react-select-styled react-select-lg ${errors.home_terminal_address ? "is-invalid" : ""}`}
                                                                                    classNamePrefix="react-select"
                                                                                    isSearchable
                                                                                />
                                                                            );
                                                                        }}
                                                                    />
                                                                    {errors.home_terminal_address && (
                                                                        <p style={{ color: "red" }}>{errors.home_terminal_address.message}</p>
                                                                    )}
                                                                </div>
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
