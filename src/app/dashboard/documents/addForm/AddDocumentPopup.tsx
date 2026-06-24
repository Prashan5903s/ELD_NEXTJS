import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { debounce } from 'lodash';
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import LoadingIcons from 'react-loading-icons';
import Skeleton from 'react-loading-skeleton'; // Import Skeleton
import 'react-loading-skeleton/dist/skeleton.css'; // Import Skeleton CSS

const AddDocumentModal = ({ id, close, open, updateDocumentList }) => {

    interface Driver {
        id: string;
        first_name: string;
        last_name: string;
        mobile_no: string;
    }

    interface DocumentType {
        option_id: string;
        title: string;
    }

    type Docs = {
        drivers: Driver[];
        document_types: DocumentType[];
    }

    type DocumentFieldKey = {
        driver_id?: string;
        document_type?: string;
        file?: string;
        notes?: string;
        status?: string;
    }

    const [docs, setDocs] = useState<Docs | undefined>();

    type ErrorValidation = {
        driver_id: string;
        document_type: string;
        file: string;
        notes: string;
        status: string;
    };

    const [errors, setErrors] = useState<ErrorValidation>();
    const router = useRouter();
    const [editData, setEditData] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const assertURL = process.env.NEXT_PUBLIC_ASSERT_URL;
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    interface User {
        token: string;
        // Add other properties you expect in the user object
    }

    interface SessionData {
        user?: User;
        // Add other properties you expect in the session data
    }

    const { data: session } = useSession() as { data?: SessionData };

    const token = session && session.user && session?.user?.token;

    const changeVehicleFieldHandler = (e) => {
        const { name, value, files } = e.target;
        setDocumentField((prevState) => ({
            ...prevState,
            [name]: files ? files[0] : value,
        }));
    };

    // Type definitions
    interface FileValidation {
        required?: string;
        maxSize?: { value: number; message: string };
        validFormat?: { message: string };
    }

    interface BasicValidation {
        required?: string;
        minLength?: { value: number; message: string };
        maxLength?: { value: number; message: string };
        pattern?: { value: RegExp; message: string };
    }

    type ValidationRule = FileValidation | BasicValidation;

    interface FormValidations {
        [key: string]: ValidationRule;
    }

    const getFileValidations = (id: string | undefined): FileValidation => ({
        required: !id ? "File is required" : undefined,
        maxSize: {
            value: 2 * 1024 * 1024, // 2MB in bytes
            message: "File size must be less than 2MB",
        },
        validFormat: {
            message: "Invalid file format. Only JPEG, PNG, and PDF are allowed.",
        },
    });

    const formValidations: FormValidations = {
        driver_id: {
            required: "Driver id is required",
            maxLength: {
                value: 60,
                message: "Name must be at most 60 characters long",
            },
        },
        document_type: {
            required: "Document type is required",
        },
        file: getFileValidations(id),
        status: {
            required: "Status is required",
        },
        notes: {},
    };

    type DocumentField = {
        driver_id?: string;
        document_type?: string;
        file?: File | null;
        notes?: string;
        status?: string;
    };

    const [documentField, setDocumentField] = useState<DocumentField>({
        driver_id: '',
        document_type: '',
        file: null,
        notes: '',
        status: '',
    });

    const validateForm = () => {
        let isValid = true;

        let errors: ErrorValidation = {
            driver_id: "",
            document_type: "",
            file: "",
            notes: "",
            status: ""
        };

        for (const [key, value] of Object.entries(formValidations)) {
            if (key === "file") {
                const fileValidation = value as FileValidation;
                const file = documentField.file;

                if (file) {
                    if (fileValidation.maxSize && file.size > fileValidation.maxSize.value) {
                        errors.file = fileValidation.maxSize.message;
                        isValid = false;
                    }

                    const allowedFormats = ["image/jpeg", "image/png", "application/pdf"];
                    if (fileValidation.validFormat && !allowedFormats.includes(file.type)) {
                        errors.file = fileValidation.validFormat.message;
                        isValid = false;
                    }
                } else {
                    if (fileValidation.required) {
                        errors.file = fileValidation.required;
                        isValid = false;
                    }
                }
            } else {
                const basicValidation = value as BasicValidation;
                const fieldValue = documentField[key as keyof DocumentField];

                if (typeof fieldValue === "string") {
                    if (basicValidation.required && !fieldValue) {
                        errors[key as keyof ErrorValidation] = basicValidation.required;
                        isValid = false;
                    } else if (basicValidation.minLength && fieldValue.length < basicValidation.minLength.value) {
                        errors[key as keyof ErrorValidation] = basicValidation.minLength.message;
                        isValid = false;
                    } else if (basicValidation.maxLength && fieldValue.length > basicValidation.maxLength.value) {
                        errors[key as keyof ErrorValidation] = basicValidation.maxLength.message;
                        isValid = false;
                    } else if (basicValidation.pattern && !basicValidation.pattern.value.test(fieldValue)) {
                        errors[key as keyof ErrorValidation] = basicValidation.pattern.message;
                        isValid = false;
                    }
                }
            }
        }

        setErrors(errors);
        return isValid;
    };

    const notify = () => toast.success(`Document ${id ? 'update' : 'added'} successfully!`, {
        position: "top-right",
        autoClose: 1000,  // Auto-dismiss after 3 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
    });

    const debouncedSubmit = useCallback(
        debounce(async (formData, id) => {
            try {
                const urlEndpoint = id ? `${url}/dashboard/document/post/${id}` : `${url}/dashboard/documents`;
                const response = await axios.post(urlEndpoint, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200) {
                    updateDocumentList();
                    close(false);
                    notify();
                    router.push('documents');
                } else {
                    console.error("Failed to save:", response.data);
                }
            } catch (error) {
                console.error("API error:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300), // 1000ms debounce delay, adjust as needed
        [url, updateDocumentList, router, close, token] // Ensure only `url` is included as dependency
    );

    const onSubmitChange = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = new FormData();

        for (const key in documentField) {
            if (documentField.hasOwnProperty(key)) {
                if (key === 'file' && documentField[key]) {
                    formData.append(key, documentField[key]);
                } else if (key !== 'file') {
                    formData.append(key, documentField[key]);
                }
            }
        }

        setIsLoading(true);
        debouncedSubmit(formData, id);
    };

    const fetchData = useCallback(
        debounce(async () => {
            if (!token) {
                console.error("No token available");
                return;
            }

            try {
                const response = await axios.get(`${url}/dashboard/documents`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDocs(response?.data || {});
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }, 300), // Debounce delay in milliseconds
        [url, token] // Dependencies for useCallback
    );

    // Use useEffect to call the debounced fetchData function
    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [fetchData, token]); // Dependency on fetchData

    const fetchEditData = useCallback(
        debounce(async (id) => {
            if (!token) {
                console.error("No token available");
                return;
            }

            try {
                const response = await axios.get(`${url}/dashboard/documents/${id}/edit`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data && response.data.doc) {
                    setEditData(response.data.doc);
                    setDocumentField({
                        driver_id: response.data.doc.driver_id,
                        document_type: response.data.doc.document_type,
                        file: null,
                        notes: response.data.doc.notes,
                        status: response.data.doc.status,
                    });
                    setImagePreview(`${assertURL}/${response.data.doc.file_path}`);
                }
            } catch (error) {
                console.error("Error fetching edit data:", error);
            }
        }, 300),
        [url, assertURL, token] // Dependencies for useCallback
    );

    useEffect(() => {
        if (id && token) {
            fetchEditData(id);
        }
    }, [id, fetchEditData, token]);

    useEffect(() => {
        if (token) {
            if (id) {
                if (editData && documentField && docs) {
                    setIsDataLoading(true);
                }
            } else {
                if (docs) {
                    setIsDataLoading(true);
                }
            }
        }
    }, [id, editData, documentField, docs, token])

    if (!isDataLoading) {
        return (
            <div className={`modal ${open ? 'showpopup' : ''}`} style={{ display: 'block' }} aria-modal="true" role="dialog">
                <div className="modal-dialog modal-dialog-centered w-100 mw-650px">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="fw-bold"><Skeleton width={300} /></h2>
                            <div className="btn btn-icon btn-sm btn-active-icon-primary" data-bs-dismiss="modal">
                                <i onClick={() => close(false)} className="ki ki-outline ki-cross fs-1"></i>
                            </div>
                        </div>
                        <div className="modal-body mx-5 mx-xl-15 my-7">
                            <form id="kt_modal_add_vehicle_form" className="form fv-plugins-bootstrap5 fv-plugins-framework" encType="multipart/form-data" onSubmit={onSubmitChange}>
                                <div className="d-flex flex-column scroll-y me-n7 pe-7" id="kt_modal_add_vehicle_scroll" data-kt-scroll="true" data-kt-scroll-activate="{default: true, lg: false}" data-kt-scroll-max-height="auto" data-kt-scroll-dependencies="#kt_modal_add_vehicle_header" data-kt-scroll-wrappers="#kt_modal_add_vehicle_scroll" data-kt-scroll-offset="300px">
                                    <div className="mb-7">
                                        <label className="form-label required">Driver</label>
                                        <Skeleton width={460} />
                                    </div>
                                    <div className="mb-7">
                                        <label className="form-label required">Document type</label>
                                        <Skeleton width={460} />
                                    </div>
                                    <div className="mb-7">
                                        <label className="form-label required">File</label>
                                        <Skeleton width={460} />
                                    </div>
                                    <div className="mb-7">
                                        <label className="form-label">Notes</label>
                                        <Skeleton width={460} height={120} />
                                    </div>
                                    <div className="mb-7">
                                        <label className="form-label required">Status</label>
                                        <Skeleton width={460} />
                                    </div>
                                </div>
                                <div className="form-btn-grp w-100 text-center pt-15">
                                    <Skeleton width={100} />
                                    <Skeleton width={100} />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`modal ${open ? 'showpopup' : ''}`} style={{ display: 'block' }} aria-modal="true" role="dialog">
            <div className="modal-dialog modal-dialog-centered w-100 mw-650px">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="fw-bold">{id ? "Edit a Document" : "Add a Document"}</h2>
                        <div className="btn btn-icon btn-sm btn-active-icon-primary" data-bs-dismiss="modal">
                            <i onClick={() => close(false)} className="ki ki-outline ki-cross fs-1"></i>
                        </div>
                    </div>
                    <div className="modal-body mx-5 mx-xl-15 my-7">
                        <form id="kt_modal_add_vehicle_form" className="form fv-plugins-bootstrap5 fv-plugins-framework" encType="multipart/form-data" onSubmit={onSubmitChange}>
                            <div className="d-flex flex-column scroll-y me-n7 pe-7" id="kt_modal_add_vehicle_scroll" data-kt-scroll="true" data-kt-scroll-activate="{default: true, lg: false}" data-kt-scroll-max-height="auto" data-kt-scroll-dependencies="#kt_modal_add_vehicle_header" data-kt-scroll-wrappers="#kt_modal_add_vehicle_scroll" data-kt-scroll-offset="300px">
                                <div className="mb-7">
                                    <label className="form-label required">Driver</label>
                                    <select
                                        name="driver_id"
                                        className={`form-control ${errors && errors.driver_id ? 'is-invalid' : ''}`}
                                        value={documentField.driver_id}
                                        onChange={changeVehicleFieldHandler}
                                    >
                                        <option value="">Select Driver</option>
                                        {docs && docs.drivers && docs.drivers.map((data) => (
                                            <option key={data.id} value={data.id}>
                                                {data.first_name} {data.last_name} ({data.mobile_no})
                                            </option>
                                        ))}
                                    </select>
                                    {errors && errors.driver_id && (
                                        <div className="invalid-feedback">{errors.driver_id}</div>
                                    )}
                                </div>
                                <div className="mb-7">
                                    <label className="form-label required">Document type</label>
                                    <select
                                        name="document_type"
                                        className={`form-control ${errors && errors.document_type ? 'is-invalid' : ''}`}
                                        value={documentField.document_type}
                                        onChange={changeVehicleFieldHandler}
                                    >
                                        <option value="">Select Document type</option>
                                        {docs && docs.document_types && docs.document_types.map((data) => (
                                            <option key={data.option_id} value={data.option_id}>
                                                {data.title}
                                            </option>
                                        ))}
                                    </select>
                                    {errors && errors.document_type && (
                                        <div className="invalid-feedback">{errors.document_type}</div>
                                    )}
                                </div>
                                <div className="mb-7">
                                    <label className="form-label required">File</label>
                                    <input
                                        type="file"
                                        name="file"
                                        className={`form-control ${errors && errors.file ? 'is-invalid' : ''}`}
                                        onChange={changeVehicleFieldHandler}
                                    />
                                    {errors && errors.file && <div className="invalid-feedback">{errors.file}</div>}
                                </div>
                                <div className="mb-7">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        className={`form-control ${errors && errors.notes ? 'is-invalid' : ''}`}
                                        value={documentField.notes}
                                        onChange={changeVehicleFieldHandler}
                                    />
                                    {errors && errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
                                </div>
                                <div className="mb-7">
                                    <label className="form-label required">Status</label>
                                    <select
                                        name="status"
                                        className={`form-control ${errors && errors.status ? 'is-invalid' : ''}`}
                                        value={documentField.status}
                                        onChange={changeVehicleFieldHandler}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="1">Active</option>
                                        <option value="2">Inactive</option>
                                    </select>
                                    {errors && errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                </div>
                            </div>
                            <div className="form-btn-grp w-100 text-center pt-15">
                                <button type="reset" onClick={close} className="btn-light me-3" data-bs-dismiss="modal" aria-label="Close">
                                    Discard
                                </button>
                                <button id='kt_sign_in_submit' className='justify-content-center btn-primary' disabled={isLoading}>
                                    <span className='indicator-progress d-flex justify-content-center'>
                                        {isLoading ? (
                                            <LoadingIcons.TailSpin height={18} />
                                        ) : id ? 'Update' : 'Save'}
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

export default AddDocumentModal;
