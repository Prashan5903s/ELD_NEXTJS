'use client'

import { DateTime } from 'luxon';
import React, { useState, useEffect } from "react";
import Shadow from "@/app/Shadow/page";

const Table = ({ reportData, dataLoad }) => {

    if (!dataLoad) {
        return <Shadow header={4} val={5} />;
    }

    const keyData = Object.keys(reportData[0]);

    const formatDate = (dateString) => {
        return DateTime.fromISO(dateString).toFormat('MMM dd, yyyy');
    };

    const datas =
        keyData && keyData.length > 0
            ? keyData.map((item) => ({
                name: `${item}`,
                hoursData: reportData[0][item]
                    .filter((dataItem) => dataItem[1] !== "00:00:00") // Filter out unwanted data
                    .map((dataItem) =>
                        dataItem[0].map((val) => ({
                            distance: `${val['total_distance'].toFixed(1)}`,
                            time: `${val['total_time']}`,
                            date: `${formatDate(val['time_date'])}`,
                            time_tracking: "Log"
                        }))
                    )
            }))
            : [];


    const csvData = datas.flatMap((values) =>
        values.hoursData.map((item) => ({
            driver: values.name,
            time: item.time,
            date: item.date,
            distance: item.distance,
            time_tracking: item.time_tracking,
        }))
    );

    return (
        <div className="table-responsive">
            <table className="border table-striped table-bordered table-hover table-sm">
                <thead className="thead-light">
                    <tr>
                        <th>Driver</th>
                        <th>Date</th>
                        <th>Total Hours</th>
                        <th>Distance Driven (mi)</th>
                        <th>Time Tracking Mode</th>
                    </tr>
                </thead>
                <tbody>
                    {datas && datas.length > 0 ? (
                        datas.every(
                            (mileageData) => mileageData['hoursData'].length === 0
                        ) ? (
                            <tr className="text-center text-muted">
                                <td colSpan={7} className="text-center text-muted">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            datas.map((mileageData, mileageDataIndex) => (
                                <React.Fragment key={mileageDataIndex}>
                                    {mileageData['hoursData'].length > 0 && mileageData['hoursData'][0].length > 0
                                        ? mileageData['hoursData'][0].map(
                                            (mileage, mileageIndex) => (
                                                <tr key={mileageIndex}>
                                                    {mileageIndex === 0 && (
                                                        <td
                                                            rowSpan={mileageData['hoursData'][0].length}
                                                            className="align-middle font-weight-bold"
                                                        >
                                                            {mileageData['name']}
                                                        </td>
                                                    )}
                                                    <td>{mileage['date']}</td>
                                                    <td>
                                                        {
                                                            (mileage['time'])
                                                        }
                                                    </td>
                                                    <td>{mileage['distance']}</td>
                                                    <td>{mileage['time_tracking']}</td>
                                                </tr>
                                            )
                                        )
                                        : null}
                                </React.Fragment>
                            ))
                        )
                    ) : (
                        <tr>
                            <td colSpan={7} className="text-center text-muted">
                                No data available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Table;