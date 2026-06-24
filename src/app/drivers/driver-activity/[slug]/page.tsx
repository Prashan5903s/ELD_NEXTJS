
"use client";
import React from "react";
import ActivityForm from "@/driverComponent/driveractivity/activityForm";

export default function DriverEdit({ params }) {
    return <ActivityForm id={params.slug} />;
}
