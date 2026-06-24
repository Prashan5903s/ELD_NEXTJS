"use client";
import React, { useEffect, useState } from "react";
import ActivityTable from "../drivers/driver-activity/page";
import { useRouter } from "next/navigation";
import axios from "axios";

function Dashboard() {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  return <ActivityTable />;
}

export default Dashboard;
