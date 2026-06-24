'use client';

import axios from "axios";
import { DateTime } from 'luxon';
import { debounce } from 'lodash';
import Table from "./component/Table";
import Head from "../worked/component/Head";
import Authentication from "@/app/Auth/page";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import { usePDF, Margin } from "react-to-pdf";
import Filter from "../../../Components/filter";
import Event from "../../../Components/reports/page";
import RootLayout from "../../../Components/reports/layout";
import React, { useState, useEffect, useCallback } from "react";
import { DatePicker, formatDate } from "@/Components/date-picker";

const HoursWorkedReport = () => {
    const [type, setType] = useState();
    const [datas, setData] = useState();
    const [timeNow, setTimeNow] = useState();
    const [types, setTypes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState();
    const [dataLoad, setDataLoad] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);

    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;

    const docName = "Hours worked report";

    const today = new Date();
    const pastDate = new Date(today);

    const [date_start, setDateStart] = useState(formatDate(pastDate));
    const [date_end, setDateEnd] = useState(formatDate(today));

    const fetchReport = useCallback(
        debounce(async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${url}/event/data/set`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.status === 200) {
                    setData(response.data);
                    setLoading(false);
                } else {
                    console.error("Unexpected response status:", response.status);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            }
        }, 500),
        [token, url]
    );

    useEffect(() => {
        if (token) {
            fetchReport();
        }
    }, [token, fetchReport]);

    const hoursWorked = useCallback(
        debounce(
            async () => {
                setDataLoad(false);
                try {
                    const response = await axios.get(`${url}/hours/worked/data/${date_start}/${date_end}/${selectedDriver}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.status == 200) {
                        setDataLoad(true);
                        setReportData(response.data);
                    } else {
                        console.error("Unexpected response status:", response.status);
                    }
                } catch (error) {
                    console.error("Error fetching report:", error);
                }
            }, 500
        )
        , [token, url, date_start, date_end, selectedDriver]
    )

    useEffect(() => {
        if (url && token) {
            hoursWorked();
        }
    }, [url, token, date_start, date_end, selectedDriver]);

    const handleDownload = async () => {
        await toPDF(); // Wait for the PDF to be created and downloaded
    };

    const downloadCSV = (data, filename = "hours_worked_report.csv") => {
        const headers = ["driver", "time", "date", "distance", "time_tracking"];

        const rows =
            data && data.length > 0
                ? data.map((row) => Object.values(row).join(",")).join("\n")
                : "";

        const csvContent = `${headers.join(",")}\n${rows}`;

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);

        // Ensure we trigger the download before removing the element
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const keyData = reportData && Object.keys(reportData[0]);

    const formatDateTime = (dateString) => {
        return DateTime.fromISO(dateString).toFormat('MMM dd, yyyy');
    };

    const xlDatas =
        keyData && keyData.length > 0
            ? keyData.map((item) => ({
                name: `${item}`,
                hoursData: reportData[0][item]
                    .filter((dataItem) => dataItem[1] !== "00:00:00") // Filter out unwanted data
                    .map((dataItem) =>
                        dataItem[0].map((val) => ({
                            distance: `${val['total_distance'].toFixed(1)}`,
                            time: `${val['total_time']}`,
                            date: `"${formatDateTime(val['time_date'])}"`,
                            time_tracking: "Log"
                        }))
                    )
            }))
            : [];

    const csvData = xlDatas.flatMap((values) =>
        values.hoursData.length > 0 && values.hoursData[0].length > 0 && values.hoursData[0].map((item) => ({
            driver: values.name,
            time: item.time,
            date: item.date,
            distance: item.distance,
            time_tracking: item.time_tracking,
        }))
    );

    const { toPDF, targetRef } = usePDF({
        method: "save",
        filename: "hours_worked_report.pdf",
        page: { margin: Margin.MEDIUM },
    });

    useEffect(() => {
        if (type && timeNow && types) {
            if (type === "pdf") {
                handleDownload();
                setTypes(false);
            } else {
                downloadCSV(csvData);
                setTypes(false);
            }
        }
    }, [type, timeNow, types]);

    return (
        <RootLayout name={"Hours worked"}>
            <Event
                docName={docName}
                types={types}
                setType={setType}
                setTypes={setTypes}
                setTimeNow={setTimeNow}
                targetRef={targetRef}
                Table={() => <Table reportData={reportData} dataLoad={dataLoad} toPDF={toPDF} />}
                Head={() => <Head reportData={reportData} dataLoad={dataLoad} />}
                Filters={() => <FilterComponent setSelectedDriver={setSelectedDriver} selectedDriver={selectedDriver} datas={datas} loading={loading} />} // Ensure the function is passed as a prop
                dataLoad={dataLoad}
                setSelectedDriver={setSelectedDriver}
                setDateStart={setDateStart}
                setDateEnd={setDateEnd}
            />
        </RootLayout>
    );
};

export default HoursWorkedReport;

const FilterComponent = ({ setSelectedDriver, selectedDriver, datas, loading }) => {
    const [filterData, setFilterData] = useState(null);

    useEffect(() => {
        if (datas) {
            const driverData = datas["driver"];
            const vehicleData = datas["vehicle"];

            const drivers = driverData?.map((data) => ({
                id: data.id,
                name: `${data.first_name} ${data.last_name}`,
            }));

            const vehicles = vehicleData?.map((data) => ({
                id: data.id,
                name: `${data.name}`,
            }));

            setFilterData([drivers, vehicles]);
        }
    }, [datas]);

    const handleDriverFilterChange = (value) => {
        setSelectedDriver(value); // Update parent state
    };

    return (
        <div className="d-flex gap-4 justify-content-center align-items-center">
            <div>
                {loading ? (
                    <div className="d-flex gap-2 justify-content-center align-items-center">
                        <Skeleton width="110px" />
                    </div>
                ) : (
                    filterData && (
                        <div className="d-flex gap-2">
                            <div>
                                <Filter
                                    data={filterData?.[0] || []}
                                    label="Driver"
                                    placeholder="Search driver"
                                    value={selectedDriver} // Pass the selected driver as a value
                                    onFilterChange={handleDriverFilterChange}
                                />
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

