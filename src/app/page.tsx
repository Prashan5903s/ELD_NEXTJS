'use client'
import { DashboardProvider } from "@/context/DashboardContext";
import Authentication from "./Auth/page";

export default function Home() {
  return (
    <Authentication />
  );
}
