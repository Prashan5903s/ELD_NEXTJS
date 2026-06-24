
"use client";
import React from "react";
import ActivityForm from "@/Components/driveractivity/activityForm";

export default function DriverEdit({ params }) {
    return <ActivityForm id={params.slug} />;
}
