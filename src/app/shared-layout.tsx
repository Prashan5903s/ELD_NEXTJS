"use client";
import React, { useEffect, useState } from "react";
import Header from "@/Components/Header";
import RightSidebar from "@/Components/RightSidebar";
import Sidebar from "@/Components/SideBar";
import { SessionProvider } from "next-auth/react";
import { useScreenWidth } from "@/Components/hooks/useScreenWidth";

export default function SharedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isToggled, setIsToggled] = useState(true);
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setIsToggled(!isToggled);
  };

  const setSidebarToggle = (state) => {
    setIsToggled(state);
  };

  const { isMobileDevice, isSmallScreen } = useScreenWidth();

  useEffect(() => {
    if (isSmallScreen) {
      setIsCollapsed(true);
      setIsToggled(true);
    }
  }, [isCollapsed, isSmallScreen, isToggled]);

  return (
    <>
      <SessionProvider>
        <div className="main" style={{ width: "100%", height: "100%" }}>
          <Header toggle={toggleSidebar} />
          <div className="dashboard sidebar">
            <div className={`${"custom-sidebar"}`}>
              <Sidebar
                isCollapsed={isCollapsed}
                mouseEnter={() => {
                  if (!isSmallScreen) {
                    return;
                  }
                  setIsCollapsed(false);
                }}
                mouseLeave={() => {
                  if (!isSmallScreen) {
                    return;
                  }
                  setIsCollapsed(true);
                }}
                setSidebarToggle={setSidebarToggle}
              />
            </div>

            <main className="mainContainer">{children}</main>
            <RightSidebar />
          </div>
        </div>
      </SessionProvider>
    </>
  );
}
