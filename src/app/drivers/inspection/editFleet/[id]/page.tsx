"use client";
import React from "react";
import FleetUserForm from "../../../../../driverComponent/fleetUser/page";

export default function DriverAdd(params) {    
    return <FleetUserForm id={params.params.id} />;
}
