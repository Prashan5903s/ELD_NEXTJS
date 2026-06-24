'use client'
import Select from 'react-select';
import debounce from 'lodash.debounce';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import React, { useState, useEffect, useCallback } from 'react';
import Skeleton from 'react-loading-skeleton';

function ReAssignDriverModal({ activeModal, closeModal, date, driverId, assignDriverId, id }) {

    const [apiError, setApiError] = useState(""); // State for holding API error messages
    const [indexcodrivers, setIndex] = useState();
    const [showSuccessModal, setShowSuccessModal] = useState(false); // State for showing success modal

    const { control, handleSubmit, formState: { errors } } = useForm();
    const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const { data: session } = useSession() || {};
    const token = session?.user?.token || null;

    const onSubmit = async (data) => {
        setApiError(""); // Clear previous errors
        try {
            await saveCodriver(data.coDriver); // Pass selected co-drivers' IDs
        } catch (error) {
            console.error("Error adding co-driver:", error);
            // Set error message if submission fails
            setApiError("Failed to add co-driver. Please try again.");
        }
    };

    const saveCodriver = useCallback(
        debounce(async (id_codriver) => {
            try {
                const response = await fetch(`${BackEND}/reassign/api/${driverId}/${date}/codriver`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id: id, driver_id: id_codriver.value }), // Correct placement of `body`
                });

                if (!response.ok) {
                    console.error("Failed to save codriver", response.statusText);
                } else {
                    setShowSuccessModal(true);
                }

            } catch (error) {
                console.error("Error saving codriver:", error);
            }
        }),
        [BackEND, token, date, driverId]
    );

    const indexCodriver = useCallback(
        debounce(
            async () => {
                try {
                    const response = await fetch(`${BackEND}/reassign/api/${driverId}/${date}/codriver`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        console.error(response.ok)
                    } else {

                        const jsonData = await response.json();

                        setIndex(jsonData);
                    }

                } catch (error) {
                    console.error(error);
                }
            }
        ),
        [BackEND, token, date, driverId]
    );

    useEffect(() => {
        if (BackEND && token && driverId && activeModal) {
            indexCodriver();
        }
    }, [BackEND, token, driverId, activeModal, date]);

    const coDriverOptions = indexcodrivers?.map((item) => ({
        value: item.id,
        label: `${item.name}`,
    })) || [];

    const defaultCoDriver = coDriverOptions.find(option => option.value == assignDriverId) || null;

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
            {showSuccessModal ? (
                <SuccessModal
                    message="Co-driver added successfully!"
                    onClose={() => closeModal()}
                />
            )
                :
                (
                    <div className={`modal ${activeModal ? "show d-block" : "d-none"} model-head`} tabIndex={-1} role="dialog">
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">ReAssign Co-driver</h5>
                                    <button type="button" className="btn-close" onClick={(e) => {
                                        e.stopPropagation();
                                        closeModal();
                                    }}></button>
                                </div>
                                {indexcodrivers ? (
                                    (indexcodrivers).length == 0 ?
                                        (
                                            <div className="modal-content p-4">
                                                <div className="modal-body text-center">
                                                    <div className="mb-4">No CoDriver allotted to this date</div>
                                                    <div className='d-flex align-items-center justify-content-center'>
                                                        <button
                                                            className="btn btn-primary model-codriver-btn"
                                                            onClick={closeModal}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                        :
                                        (
                                            <div className="modal-body">
                                                <label htmlFor="co-driver-select" className="form-label">Assign Co-driver(s)</label>
                                                <Controller
                                                    name="coDriver"
                                                    control={control}
                                                    defaultValue={defaultCoDriver} // Set default values here
                                                    rules={{ required: "Please select a co-driver" }}
                                                    render={({ field }) => (
                                                        <Select
                                                            {...field}
                                                            id="co-driver-select"
                                                            options={coDriverOptions}
                                                            placeholder="Select Co-driver"
                                                            className="basic-single-select"
                                                            classNamePrefix="select"
                                                        />
                                                    )}
                                                />
                                                {errors.coDriver && <div className="text-danger mt-0 mb-2">{errors.coDriver.message}</div>}
                                                {apiError && <div className="text-danger mt-0 mb-2">{apiError}</div>} {/* Show API error message */}
                                                <button className='mt-2 btn btn-primary model_codriver_btn' onClick={handleSubmit(onSubmit)}>Save</button>
                                            </div>
                                        )
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
                )}
        </div>
    );
}

export default ReAssignDriverModal;
