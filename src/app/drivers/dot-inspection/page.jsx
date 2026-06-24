'use client'
import axios from "axios";
import { toast } from 'react-toastify';
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import 'react-toastify/dist/ReactToastify.css';
import LoadingIcons from "react-loading-icons";
import { ShieldCheck, FileText } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import DriversDailyLog from "../../../driverComponent/daily-log-tables/daily-logs-intro-table";

const DotInspection = () => {
    const [datas, setData] = useState();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [dotData, setDOTData] = useState("");
    const [loading, setLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [beginInspection, setBeginInspection] = useState(false);

    const logRef = useRef();

    const handlePrint = () => {
        const printContent = logRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
        <html>
          <head>
            <title>Print Log</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const handleSendLogs = () => {
        setBeginInspection(false);
        setIsModalOpen(true);
    };

    const { data: session } = (useSession()) || {};

    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

    const token = session && session.user && session?.user?.token;

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const notify = (message) => toast.success(message, {
        position: "top-right",
        autoClose: 1000,  // Auto-dismiss after 3 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
    });

    const handleSendEmail = async () => {
        if (!email) {
            setError("Email is required.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError("");

        setLoading(true);

        // Handle sending the email
        try {
            const response = await axios.get(`${url}/driver/mail/dot/inspection/${email}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(response?.data?.message || []);
            setLoading(false);

        } catch (error) {

        } finally {
            setLoading(false);
        }
        setEmail("");
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (datas) {
            notify(datas);
        }
    }, [datas])

    const buttonStyle = {
        minWidth: "100px",
        height: "38px",
        borderRadius: "8px",
        transition: "all 0.2s ease-in-out",
        backgroundColor: "white",  // Default background
        color: "#333",  // Default text color
        border: "1px solid #c6e8ff",
    };

    const fetchDOTData = useCallback(
        debounce(async (token) => {
            if (!token) return; // Prevent unnecessary calls
            // setLoading(true); // Set loading before the fetch
            try {
                const response = await axios.get(`${url}/driver/mail/dot/inspections/document`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setDOTData(response?.data); // Assuming `response.data` contains the result
            } catch (err) {
                console.error("Error fetching documents:", err.message);
            } finally {
                setLoading(false); // Ensure loading is false after the fetch
            }
        }, 500), // Debounce time in milliseconds
        [url] // Only include `url` as dependency
    );

    useEffect(() => {
        if (token) {
            fetchDOTData(token);
        }
    }, [token]);

    const logData = {
        logDate: "November 26, 2024",
        printDate: "December 10, 2024",
        driver: "ASSDA",
        id: "ranjit543210",
        fleetId: "D6687235, CA",
        coDrivers: "",
        driverLicense: "D6687235, CA",
        exemptDriver: "0",
        distance: "1) 456 mi",
        vehicleLicense: "A051862",
        odometers: "1) 748,940 - 749,592",
        engineHours: "1) 26135.3 - 26151.4",
        currentLocation: "",
        shippingDocs: "Amazon",
        dataDiagIndicators: "Yes (1)",
        eldMalfnIndicators: "No",
        eldId: "MOTIVE",
        eldProvider: "Motive Technologies Inc.",
        createdAt: "2024-12-12",
        mobileNo: "+1 123 456 789",
        location: "RIETA, CA, 92563",
    };

    if (beginInspection && dotData) {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center">
                    <div onClick={() => setBeginInspection(false)} className="cursor-pointer">
                        <i className="ki-arrow-left ki-outline fs-2x"></i>
                    </div>

                    <div
                        className="position-relative"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className="p-2 bg-light rounded-circle">
                            <i className="ki-outline ki-dots-square fs-4 text-dark cursor-pointer"></i>
                        </div>

                        {isHovered && (
                            <div
                                className="dropdown-menu show position-absolute end-0 mt--1 shadow-sm"
                                style={{ display: 'block' }}
                            >
                                {/* <button className="dropdown-item" onClick={handlePrint}>
                                    Print
                                </button> */}
                                <button className="dropdown-item" onClick={handleSendLogs}>
                                    Send Logs
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add ref to this wrapper */}
                <div ref={logRef}>
                    <DriversDailyLog logData={logData} DOTData={dotData} />
                </div>
            </div>
        );
    }

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-start py-5 px-3"
            style={{ overflowY: "auto" }}
        >
            <div className="text-center mb-4">
                <h1 className="display-6 fw-bold text-dark">DOT Inspection Mode</h1>
                <p className="text-muted small">
                    Ensure compliance with Department of Transportation standards
                </p>
            </div>

            <div className="w-100" style={{ maxWidth: "500px" }}>
                {/* Begin Inspection Section */}
                <div className="card mb-4 shadow-sm">
                    <div className="card-body text-center">
                        <div className="d-flex flex-column align-items-center mb-3">
                            <ShieldCheck size={40} className="mb-2" />
                            <h5 className="card-title">Begin DOT Inspection</h5>
                        </div>
                        {dotData ?
                            (
                                <button
                                    className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                    onClick={() => setBeginInspection(true)}
                                    style={buttonStyle}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "#c6e8ff";
                                        e.target.style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "white";
                                        e.target.style.color = "#333";
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.backgroundColor = "#c6e8ff";
                                        e.target.style.color = "white";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.backgroundColor = "white";
                                        e.target.style.color = "#333";
                                    }}
                                    onMouseDown={(e) => {
                                        e.target.style.backgroundColor = "#c6e8ff";
                                        e.target.style.color = "white";
                                    }}
                                    onMouseUp={(e) => {
                                        e.target.style.backgroundColor = "#c6e8ff";
                                        e.target.style.color = "white";
                                    }}
                                >
                                    <ShieldCheck size={18} />
                                    Begin Inspection
                                </button>
                            )
                            :
                            <Skeleton height={"35px"} />
                        }

                        <p className="text-muted small mt-3">
                            Press and hold to set an access code
                        </p>
                    </div>
                </div>

                {/* Send Output File Section */}
                <div className="card shadow-sm">
                    <div className="card-body text-center">
                        <div className="d-flex flex-column align-items-center mb-3">
                            <FileText size={40} className="mb-2" />
                            <h5 className="card-title">Send ELD Output File</h5>
                        </div>
                        <p className="text-muted small mb-3">
                            Send your ELD Output File to the DOT if the officer requests it.
                        </p>
                        <button
                            className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                            onClick={() => setIsModalOpen(true)}  // Open modal on click
                            style={buttonStyle}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#c6e8ff";
                                e.target.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "white";
                                e.target.style.color = "#333";
                            }}
                            onFocus={(e) => {
                                e.target.style.backgroundColor = "#c6e8ff";
                                e.target.style.color = "white";
                            }}
                            onBlur={(e) => {
                                e.target.style.backgroundColor = "white";
                                e.target.style.color = "#333";
                            }}
                            onMouseDown={(e) => {
                                e.target.style.backgroundColor = "#c6e8ff";
                                e.target.style.color = "white";
                            }}
                            onMouseUp={(e) => {
                                e.target.style.backgroundColor = "#c6e8ff";
                                e.target.style.color = "white";
                            }}
                        >
                            <FileText size={18} />
                            Send Output File
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Email Input */}
            {isModalOpen && (
                <div className="modal show" tabIndex={-1} style={{ display: "block" }} onClick={() => {
                    setIsModalOpen(false)
                    setError("");
                    setEmail("");
                }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: '1.75rem', marginBottom: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ maxWidth: "400px" }}>
                            <div className="modal-header">
                                <h5 className="modal-title">Send Output File</h5>
                                <button type="button" className="btn-close" onClick={() => {
                                    setIsModalOpen(false);
                                    setError("");
                                    setEmail("");
                                }}></button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: "170px" }}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {error && <div className="invalid-feedbac" style={{ color: "red" }}>{error}</div>}
                                </div>
                            </div>
                            <div className="modal-footer d-flex justify-content-center">
                                <button type="button" className="btn btn-primary" onClick={handleSendEmail}>
                                    {loading ? <LoadingIcons.TailSpin height={18} /> : "Send"}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => {
                                    setIsModalOpen(false);
                                    setError("");
                                    setEmail("");
                                }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default DotInspection;
