"use client";
import React, { useEffect, useState } from "react";
import VehicleTable from "./assets/vehicles/page";
import { DashboardProvider } from "@/context/DashboardContext";
import { useRouter } from "next/navigation";
import axios from "axios";

function Dashboard() {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  return <VehicleTable />;
}

export default Dashboard;
