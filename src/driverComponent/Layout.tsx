"use client";
import { Inter } from "next/font/google";
import Header from "../driverComponent/Header";
import Sidebar from "../driverComponent/SideBar";
import { SessionProvider } from "next-auth/react";
import RightSidebar from "../driverComponent/RightSidebar";
import { ToastContainer } from "react-toastify";
import { useScreenWidth } from "./hooks/useScreenWidth";
import { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isToggled, setIsToggled] = useState(true);

  const { isSmallScreen } = useScreenWidth();

  const sidebarRef = useRef(null);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setIsToggled(!isToggled);
  };

  const setSidebarToggle = (state) => {
    setIsToggled(state);
  };

  useEffect(() => {
    if (isSmallScreen) {
      setIsCollapsed(true);
      setIsToggled(true);
    } else {
      setIsCollapsed(false);
      setIsToggled(false);
    }
  }, [isSmallScreen]);

  const onCloseMobileMenu = () => {
    if (typeof window !== "undefined") {
      if (
        window.innerWidth < 1024 &&
        sidebarRef.current.classList.contains("sidebar-mobile-open")
      ) {
        const sidebar = document.getElementById("sidebar-mobile");
        sidebar.classList.toggle("sidebar-mobile-open");
      }
    }
  };
  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      onCloseMobileMenu();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <SessionProvider>
        <ToastContainer />
        <div className="main" style={{ width: "100%", height: "100%" }}>
          <Header />
          <div
            style={{ background: "white" }}
            className="sidebar-mobile"
            id="sidebar-mobile"
            ref={sidebarRef}
          >
            <Sidebar isMobile={true} onCloseMobileMenu={onCloseMobileMenu} />
          </div>
          <div className="dashboard">
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
            <Analytics />
          </div>
        </div>
      </SessionProvider>
    </>
  );
}
