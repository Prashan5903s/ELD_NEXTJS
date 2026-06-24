"use client";
import React from "react";
import { useScreenWidth } from "./hooks/useScreenWidth";

function RightSidebar() {
  const { isSmallScreen } = useScreenWidth();
  return <div className="RightSidebar">RightSidebar</div>;
}

export default RightSidebar;
