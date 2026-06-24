"use client";
import Sidebar from "../SideBar";
import Header from "@/Components/Header";
import RightSidebar from "../RightSidebar";
import { SessionProvider } from "next-auth/react";
import { useScreenWidth } from "../hooks/useScreenWidth";
import React, { useEffect, useRef, useState } from "react";

export default function RootLayout({
  children,
  name
}) {
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

  useEffect(() => {
    if (isSmallScreen) {
      setIsCollapsed(true);
      setIsToggled(true);
    } else {
      setIsCollapsed(false);
      setIsToggled(false);
    }
  }, [isSmallScreen]);

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
        <div className="main" style={{ width: "100%", height: "100%" }}>
          <Header toggle={toggleSidebar} />
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

            <main className="mainContainer">
              <h1 style={{ marginBottom: "25px" }}>{name}</h1>
              {children}
            </main>
            <RightSidebar />
          </div>
        </div>
      </SessionProvider>
    </>
  );
}
