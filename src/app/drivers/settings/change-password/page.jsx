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
    const [isLoading, setIsLoading] = useState(false);
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const { data: session } = (useSession()) || {};

    const token = session && session.user && session?.user?.token;

    const formValidations = {
        password: {
            required: "Password is required",
            minLength: {
                value: 8,
                message: "Password must have at least 8 characters",
            },
            maxLength: {
                value: 100,
                message: "Password must be at most 100 characters long",
            },
        },
        confirm_password: {
            required: "Confirm password is required",
            minLength: {
                value: 8,
                message: "Password must have at least 8 characters",
            },
            maxLength: {
                value: 100,
                message: "Password must be at most 100 characters long",
            },
            validate: (value, context) =>
                value === context.password || "Passwords do not match",
        },
        current_password: {
            required: "Current password is required",
            minLength: {
                value: 8,
                message: "Password must have at least 8 characters",
            },
            maxLength: {
                value: 100,
                message: "Password must be at most 100 characters long",
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

    const AddChangePassword = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${url}/driver/change/password/data/update`, {
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
                window.location.reload();
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
            await AddChangePassword(data);
        }, 1000), // Adjust debounce delay as needed
        [token]
    );

    const onSubmit = async (data) => {
        handleSubmits(data);
    };

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
                                Change password
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
                                        Change password
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
                                                    Change password
                                                </p>
                                            </div>
                                            <div className="separator my-0"></div>
                                            <div className="card-body mt-4">
                                                <>
                                                    <div className="mb-5 row">
                                                        <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                            Password
                                                        </label>
                                                        <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                            <div className="flex-grow-1">
                                                                <Controller
                                                                    name="password"
                                                                    control={control}
                                                                    rules={formValidations.password}
                                                                    render={({ field }) => (
                                                                        <input
                                                                            type="password"
                                                                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                                                            placeholder="Password"
                                                                            {...field}
                                                                        />
                                                                    )}
                                                                />
                                                                {errors.password && (
                                                                    <p style={{ color: "red" }}>{errors.password.message}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mb-5 row">
                                                        <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                            Confirm password
                                                        </label>
                                                        <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                            <div className="flex-grow-1">
                                                                <Controller
                                                                    name="confirm_password"
                                                                    control={control}
                                                                    autoComplete="off"
                                                                    rules={formValidations.confirm_password}
                                                                    render={({ field }) => (
                                                                        <input
                                                                            type="password"
                                                                            className={`form-control ${errors.confirm_password ? "is-invalid" : ""}`}
                                                                            placeholder="Confirm password"
                                                                            {...field}
                                                                        />
                                                                    )}
                                                                />
                                                                {errors.confirm_password && (
                                                                    <p style={{ color: "red" }}>{errors.confirm_password.message}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mb-5 row">
                                                        <label className="required col-lg-2 col-md-12 col-sm-12 col-form-label">
                                                            Current Password
                                                        </label>
                                                        <div className="col-lg-10 col-md-12 col-sm-12 d-flex gap-3 flex-wrap">
                                                            <div className="flex-grow-1">
                                                                <Controller
                                                                    name="current_password"
                                                                    control={control}
                                                                    autoComplete="off"
                                                                    rules={formValidations.current_password}
                                                                    render={({ field }) => (
                                                                        <input
                                                                            type="password"
                                                                            className={`form-control ${errors.current_password ? "is-invalid" : ""}`}
                                                                            placeholder="Current password"
                                                                            {...field}
                                                                        />
                                                                    )}
                                                                />
                                                                {errors.current_password && (
                                                                    <p style={{ color: "red" }}>{errors.current_password.message}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>

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
