'use client'
import Select from 'react-select';
import debounce from 'lodash.debounce';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import React, { useState, useEffect, useCallback } from 'react';
import Skeleton from 'react-loading-skeleton';

function CoDriverModal({ activeModal, closeModal, date, driverId }) {

    const [datass, setData] = useState();
    const [apiError, setApiError] = useState(""); // State for holding API error messages
    const [indexcodriver, setIndex] = useState();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // State for showing success modal

    const { control, handleSubmit, formState: { errors } } = useForm();
    const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const { data: session } = useSession() || {};
    const token = session?.user?.token || null;

    const onSubmit = async (data) => {
        setApiError(""); // Clear previous errors

        try {
            await addCoDriver(data.coDriver); // Pass selected co-drivers' IDs
        } catch (error) {
            console.error("Error adding co-driver:", error);
            // Set error message if submission fails
            setApiError("Failed to add co-driver. Please try again.");
        }
    };

    const indexCodriver = useCallback(
        debounce(
            async () => {
                try {
                    const response = await fetch(`${BackEND}/data/${date}/${driverId}/codriver`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        console.error(response.ok)
                    }

                    const jsonData = await response.json();
                    setIndex(jsonData);

                } catch (error) {
                    console.error(error);
                }
            }
        ),
        [BackEND, token, date, driverId]
    );

    const addCoDriver = useCallback(
        debounce(
            async (coDrivers) => {
                try {
                    const coDriverValues = coDrivers.map(driver => driver.value);

                    const response = await fetch(
                        `${BackEND}/data/${date}/${driverId}/codriver`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ co_drivers: coDriverValues }),
                        }
                    );

                    if (!response.ok) {
                        const errorMessage = await response.text();
                        setApiError(JSON.parse(errorMessage));
                    } else {
                        const result = await response.json();
                        setShowSuccessModal(true); // Show success modal
                        closeModal(); // Close the current modal
                    }
                } catch (error) {
                    console.error("Error adding co-driver:", error);
                    throw error; // Rethrow error to handle in onSubmit
                }
            },
            300
        ),
        [BackEND, token, date, driverId]
    );

    const fetchLogs = useCallback(
        debounce(async () => {
            if (!driverId) return;
            setLoading(true);
            try {
                const response = await fetch(
                    `${BackEND}/codriver/list/${driverId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300),
        [driverId, BackEND, token]
    );

    useEffect(() => {
        if (BackEND && token && driverId && (activeModal === date)) {
            fetchLogs();
            indexCodriver();
        }
    }, [BackEND, token, driverId, activeModal, date]);

    const coDriverOptions = datass?.map((item) => ({
        value: item.id,
        label: `${item.first_name} ${item.last_name}`,
    })) || [];

    const defaultCoDriver = coDriverOptions.filter(option =>
        indexcodriver?.codriver_id?.includes(option.value)
    );

    // Success Modal
    const SuccessModal = ({ message, onClose }) => (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-sm modal-dialog-centered">
                <div className="modal-content text-center p-4">
                    {/* Green Check Icon */}
                    <div className="d-flex justify-content-center mb-3">
                        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "80px", height: "80px", fontSize: "40px" }}>
                            ✔
                        </div>
                    </div>

                    <h5 className="fw-bold">Thank you!</h5>
                    <p className="text-muted">{message}</p>

                    <button className="btn btn-primary mt-2 model_codriver_btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Success Modal */}
            {showSuccessModal && (
                <SuccessModal
                    message="Co-driver added successfully!"
                    onClose={() => setShowSuccessModal(false)}
                />
            )}

            <div className={`modal ${activeModal === date ? "show d-block" : "d-none"} model-head`} tabIndex={-1} role="dialog">
                <div className="modal-dialog modal-sm modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add Co-driver</h5>
                            <button type="button" className="btn-close" onClick={(e) => {
                                e.stopPropagation();
                                closeModal();
                            }}></button>
                        </div>
                        {datass ? (
                            <div className="modal-body">
                                <label htmlFor="co-driver-select" className="form-label">Select Co-driver(s)</label>
                                <Controller
                                    name="coDriver"
                                    control={control}
                                    defaultValue={defaultCoDriver} // Set default values here
                                    rules={{ required: "Please select at least one co-driver" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="co-driver-select"
                                            options={coDriverOptions}
                                            isMulti
                                            placeholder="Select Co-driver(s)"
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                />
                                {errors.coDriver && <div className="text-danger mt-0 mb-2">{errors.coDriver.message}</div>}
                                {apiError && <div className="text-danger mt-0 mb-2">{apiError}</div>} {/* Show API error message */}
                                <button className='btn btn-primary model_codriver_btn' onClick={handleSubmit(onSubmit)}>Save</button>
                            </div>
                        ) : (
                            <div className="modal-body">
                                <div className="mb-3">
                                    <Skeleton height={38} width="100%" />
                                </div>
                                <div className="mb-3">
                                    <Skeleton height={38} width="100%" />
                                </div>
                                <div className="mb-3">
                                    <Skeleton height={38} width="100%" />
                                </div>
                                <div className="mb-3">
                                    <Skeleton height={38} width={120} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CoDriverModal;
