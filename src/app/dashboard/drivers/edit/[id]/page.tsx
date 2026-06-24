
"use client";
import React from "react";
import DriverForm from "@/Components/driver/DriverForm";

export default function DriverEdit({ params }) {
  return <DriverForm id={params.id} />;
}
