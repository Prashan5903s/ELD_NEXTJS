"use client";
import React from "react";
import Skeleton from "react-loading-skeleton";

const Head = ({ reportData, dataLoad }) => {

    if (!dataLoad) {
        return <Skeleton height={"70px"} />;
    }

    return (
        <div className="border border-2 rounded mt-5">
            <div className="d-flex justify-content-around flex-wrap">
                <div className="p-5 text-center">
                    <div className="fs-5 fw-semibold">{reportData[1]}</div>
                    <p>Total hours</p>
                </div>
                <div className="p-5 text-center">
                    <div className="fs-5 fw-semibold">{reportData[2].toFixed(1) + " mil"}</div>
                    <p>Distance driven</p>
                </div>
            </div>
        </div>
    );
};

export default Head;
