"use client";
import React from "react";
import DeviceForm from "@/Components/Settings/Devices/DeviceForm";

export default function DriverEdit({ params }) {
    return <DeviceForm id={params.slug} />;
}
