"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import styles from "../styles/sidebar.module.css";
import { useRouter, usePathname } from "next/navigation";
import { getPermissions } from "@/Components/permission/page";
import Skeleton from "react-loading-skeleton";

interface User {
  token: string;
}

interface SessionData {
  user?: User;
}

type Message = {
  text: string;
  sender: any;
  sent_time: string;
};

const Sidebar = ({
  isCollapsed,
  mouseEnter,
  mouseLeave,
  setSidebarToggle,
  isMobile = false,
  onCloseMobileMenu,
}: {
  isCollapsed?: any;
  mouseEnter?: any;
  mouseLeave?: any;
  setSidebarToggle?: any;
  isMobile?: boolean;
  onCloseMobileMenu?: () => void;
}) => {
  const router = useRouter();
  const pathName = usePathname();
  const [ids, SetId] = useState();
  const [rid, setRId] = useState<any>();
  const [load, setLoad] = useState(false);
  const [permissn, setPermissn] = useState();
  const [parentId, setParentId] = useState("");
  const [subItemId, setSubItemId] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const [unRead, setUnRead] = useState<Message[]>([]);
  const [subChildItemId, setSubChildItemId] = useState("");
  const { data: session } = (useSession() as { data?: SessionData }) || {};

  const token = session && session.user && session?.user?.token;

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchPermissions = useCallback(
    debounce(async (token) => {
      try {
        const perms = await getPermissions(token);
        setPermissn(perms);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          setTimeout(() => fetchPermissions(token), 5000);
        } else {
          console.error("Error fetching permissions:", error);
        }
      }
    }, 1000),
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchPermissions(token);
    }
  }, [token]);

  useEffect(() => {
    if (permissn) {
      setLoad(true);
    }
  }, [permissn])

  interface MenuItem {
    id: string;
    title: string;
    icon: string;
    path: string;
    subitems?: MenuItem[]; // Make subitems optional
  }

  const fetchUserData = useCallback(
    debounce(async (token) => {
      try {
        const response = await axios.get(`${url}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const id = response.data.id;
        SetId(id);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          setTimeout(() => fetchUserData(token), 5000);
        } else {
          console.error("Error fetching user data:", error);
        }
      }
    }, 1000),
    [url]
  );

  useEffect(() => {
    if (token) {
      fetchUserData(token);
    }
  }, [token, fetchUserData]);

  useEffect(() => {
    if (ids == 98) {
      setRId(99);
    } else {
      setRId(98);
    }
  }, [ids]);

  const menuItems: MenuItem[] = [
    {
      id: "Driver Activity",
      title: "Driver Activity",
      icon: "shield-tick",
      path: "/drivers/driver-activity",
    },
    {
      id: "HOS",
      title: "HOS",
      icon: "user-square",
      path: "/drivers/hoursOfService",
    },
    {
      id: "message",
      title: "Message",
      icon: "message-text",
      path: "/drivers/chatbox",
    },
    {
      id: "document",
      title: "Document",
      icon: "document",
      path: "/drivers/documents",
    },
    {
      id: "safety",
      title: "Safety",
      icon: "graph-2",
      path: "/safety-driver/events",
    },
    {
      id: "Inspection",
      title: "Inspection",
      icon: "shield-tick",
      path: "/drivers/inspection",
    },
    {
      id: "Dot Inspection",
      title: "Dot Inspection",
      icon: "chart-line",
      path: "/drivers/dot-inspection",
    },
    {
      id: "settings",
      title: "Settings",
      icon: "gear",
      path: "",
      subitems: [
        {
          id: "account",
          title: "Account",
          path: "/drivers/settings/account",
          icon: "",
        },
        {
          id: "change password",
          title: "Change password",
          path: "/drivers/settings/change-password",
          icon: "",
        },
        {
          id: "general",
          title: "General",
          path: "/drivers/settings/general",
          icon: "",
        },
        {
          id: "carrer",
          title: "Carrer",
          path: "/drivers/settings/carrer",
          icon: "",
        },
        {
          id: "cycle rule",
          title: "Cycle rule",
          path: "/drivers/settings/cycle-rule",
          icon: "",
        },
      ],
    },
    // Example of an item with subitems
  ];

  const handleLinkClick = () => {
    if (setSidebarToggle) {
      setSidebarToggle(true);
    }
  };

  const toggleMenu = (menuId, path) => {
    if (menuItems.some((x) => x.id == menuId)) {
      let idx = menuItems.findIndex((x) => x.id == menuId);
      if (parentId === menuId && menuItems[idx].subitems != undefined) {
        setParentId("");
      } else {
        setParentId(menuId);
        if (menuItems[idx].path != "") {
          if (isMobile) {
            const sidebar = document.getElementById("sidebar-mobile");
            sidebar.classList.toggle("sidebar-mobile-open");
          }
          router.push(menuItems[idx].path);
        }
      }
      setSubItemId("");
      setSubChildItemId("");
    }
    if (parentId != "") {
      let idx = menuItems.findIndex((x) => x.id == parentId);
      if (idx > -1) {
        if (menuItems[idx]?.subitems?.some((x) => x.id == menuId)) {
          if (subItemId == menuId) {
            setSubItemId("");
          } else {
            setSubItemId(menuId);
            let subIdx = menuItems[idx]?.subitems?.findIndex(
              (x) => x.id == menuId
            );
            if (subIdx > -1 && menuItems[idx]?.subitems[subIdx].path != "") {
              if (isMobile) {
                const sidebar = document.getElementById("sidebar-mobile");
                sidebar.classList.toggle("sidebar-mobile-open");
              }

              router.push(menuItems[idx]?.subitems[subIdx].path);
            }
          }

          setSubChildItemId("");
        }
      }
      if (subItemId != "") {
        let cIdx = menuItems[idx]?.subitems?.findIndex(
          (x) => x.id == subItemId
        );
        if (
          cIdx > -1 &&
          menuItems[idx]?.subitems[cIdx]?.subitems?.some((x) => x.id == menuId)
        ) {
          setSubChildItemId(menuId);
          let subIdx = menuItems[idx]?.subitems[cIdx]?.subitems?.findIndex(
            (x) => x.id == menuId
          );
          if (
            subIdx > -1 &&
            menuItems[idx]?.subitems[cIdx]?.subitems[subIdx].path != ""
          ) {
            if (isMobile) {
              const sidebar = document.getElementById("sidebar-mobile");
              sidebar.classList.toggle("sidebar-mobile-open");
            }

            router.push(menuItems[idx]?.subitems[cIdx]?.subitems[subIdx].path);
          }
        }
      }
    }
  };

  function updateIds(path) {
    const segments = path.replace(/^\/+/, "").split("/");

    const parentId = segments[0];
    const subItemId = segments[1];
    const subSubItemId = segments[2];
    if (parentId === "dashboard" && segments.length === 1) {
      return;
    }

    const soloPages = ["documents", "compliance"];
    const foundIndex = soloPages.indexOf(subItemId);

    if (foundIndex !== -1) {
      setParentId(soloPages[foundIndex]);
      return;
    } else {
      setParentId(parentId);
    }

    setSubItemId(subItemId);
    if (subSubItemId) {
      setSubChildItemId(subSubItemId);
    } else {
      setSubChildItemId("");
    }
  }
  useEffect(() => {
    updateIds(pathName);
  }, [pathName]);

  if (!load) {
    return (
      <div className="container">
        {/* Skeleton for the parent menu item */}
        <div className="mb-3 p-3 border rounded bg-light">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="d-flex align-items-center mb-2">
              <Skeleton circle={true} height={40} width={40} />
              <Skeleton width={100} style={{ marginLeft: '10px' }} />
            </div>
          ))}
          {/* Skeleton for subitems */}
        </div>
      </div>
    );
  }

  const renderMenuItems = (items, parentId) => {
    return items.map((item) => (
      <div key={item.id} className={styles.menuItem}>
        <div
          className={`${styles.menuTitle}     
            ${item.subitems && item.subitems.length > 0 ? styles.hasSubitems : ""
            } 
           
  
              ${item.id == parentId && subItemId == ""
              ? item.subitems == undefined
                ? `${styles.active + " " + styles.selected}`
                : styles.active
              : ""
            }
          
              `}
          onClick={() => {
            toggleMenu(item.id, item.path);
          }}
        >
          {item.icon && <i className={`ki-outline ki-${item.icon} fs-1`}></i>}
          {!isCollapsed && <span onClick={handleLinkClick}>{item.title}</span>}
          {!isCollapsed && item.subitems && item.subitems.length > 0 && (
            <i
              className={`ki-duotone ${item.id == parentId ? "ki-up" : "ki-down"
                }`}
              style={{ marginLeft: "75px" }}
            ></i>
          )}
        </div>
        {item.subitems && (
          <div
            className={`${styles.subMenu}
    
              ${!isCollapsed && item.id == parentId ? styles.open : ""}`}
          >
            {item.subitems.map((subItem) => (
              <div key={subItem.id} className={styles.menuItem}>
                <div
                  className={`${styles.menuTitle}
                      ${subItem.subitems && subItem.subitems.length > 0
                      ? styles.hasSubitems
                      : ""
                    } ${subItem.id == subItemId && subChildItemId == ""
                      ? subItem.subitems == undefined
                        ? `${styles.active + " " + styles.selected}`
                        : styles.active
                      : ""
                    }`}
                  onClick={() => toggleMenu(subItem.id, subItem.path)}
                >
                  {subItem.icon && (
                    <i className={`ki-outline ki-${subItem.icon} fs-1`}></i>
                  )}
                  {!isCollapsed && (
                    <span onClick={handleLinkClick}>{subItem.title}</span>
                  )}
                  {!isCollapsed &&
                    subItem.subitems &&
                    subItem.subitems.length > 0 && (
                      <i
                        className={`ki-duotone ${subItem.id == subItemId ? "ki-up" : "ki-down"
                          }`}
                        style={{ marginLeft: "79px" }}
                      ></i>
                    )}
                </div>
                {subItem.subitems && (
                  <div
                    className={`${styles.subMenu}
              
                        ${!isCollapsed && subItem.id == subItemId
                        ? styles.open
                        : ""
                      }`}
                  >
                    {subItem.subitems.map((subChildItem) => (
                      <div key={subChildItem.id} className={styles.menuItem}>
                        <div
                          className={`${styles.menuTitle} ${subChildItem.subitems &&
                            subChildItem.subitems.length > 0
                            ? styles.hasSubitems
                            : ""
                            }
  
                            
                                
                            ${subChildItem.id == subChildItemId
                              ? styles.active + " " + styles.selected
                              : ""
                            }`}
                          onClick={() =>
                            toggleMenu(subChildItem.id, subChildItem.path)
                          }
                        >
                          {subChildItem.icon && (
                            <i
                              className={`ki-outline ki-${subChildItem.icon} fs-1`}
                            ></i>
                          )}
                          {!isCollapsed && (
                            <span onClick={handleLinkClick}>
                              {subChildItem.title}
                            </span>
                          )}
                          {subChildItem.subitems &&
                            subChildItem.subitems.length > 0 && (
                              <i
                                className={`ki-duotone ${subChildItem.id == subChildItemId
                                  ? "ki-up"
                                  : "ki-down"
                                  }`}
                                style={{ marginLeft: "auto" }}
                              ></i>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <div
        className={`${styles.sidebar}  ${isCollapsed ? styles.collapsed : ""
          }  `}
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
      >
        {renderMenuItems(menuItems, parentId)}
      </div>
    </>
  );
};

function isPathInArray(path, arr) {
  if (arr && arr.length) {
    return arr.some((item) => item.path === path);
  }
}

function hasPath(menuItems, pathName) {
  if (menuItems && menuItems.length) {
    for (const menuItem of menuItems) {
      if (menuItem.path === pathName) {
        return true;
      }

      if (menuItem.subitems) {
        if (hasPath(menuItem.subitems, pathName)) {
          return true;
        }
      }
    }
  }

  return false;
}

export default Sidebar;
