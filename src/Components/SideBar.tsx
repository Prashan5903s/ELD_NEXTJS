'use client'
import React, { useEffect, useState, useCallback } from 'react'
import styles from '../styles/sidebar.module.css'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { debounce } from 'lodash'
import { getPermissions } from '@/Components/permission/page'
import { useSession } from 'next-auth/react'
import { Icons } from 'react-toastify'
import Skeleton from 'react-loading-skeleton'
import { auto } from '@popperjs/core'

interface User {
  token: string
}

interface SessionData {
  user?: User
}

const Sidebar = ({
  isCollapsed,
  mouseEnter,
  mouseLeave,
  setSidebarToggle,
  isMobile = false,
  onCloseMobileMenu
}: {
  isCollapsed?: any
  mouseEnter?: any
  mouseLeave?: any
  setSidebarToggle?: any
  isMobile?: boolean
  onCloseMobileMenu?: () => void
}) => {
  const router = useRouter()
  const pathName = usePathname()
  const [load, setLoad] = useState(false)
  const [parentId, setParentId] = useState('')
  const [subItemId, setSubItemId] = useState('')
  const [subChildItemId, setSubChildItemId] = useState('')
  const [permissn, setPermissn] = useState<number[] | undefined>()
  const [currentPath, setCurrentPath] = useState(pathName ?? '')

  const { data: session } = (useSession() as { data?: SessionData }) || {}

  const token = session && session.user && session?.user?.token

  console.log('Token', token)

  useEffect(() => {
    if (permissn) {
      setLoad(true)
    }
  }, [permissn])

  const fetchPermissions = useCallback(
    debounce(async token => {
      try {
        const perms = await getPermissions(token)
        setPermissn(perms)
      } catch (error) {
        if (error.response && error.response.status === 429) {
          setTimeout(() => fetchPermissions(token), 5000)
        } else {
          console.error('Error fetching permissions:', error)
        }
      }
    }, 1000),
    [token]
  )

  useEffect(() => {
    if (token) {
      fetchPermissions(token)
    }
  }, [fetchPermissions, token])

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Overview',
      icon: 'shield-search',
      path: '',
      subitems: [
        {
          id: 'assets',
          title: 'Assets',
          path: '',
          subitems: [
            permissn &&
              permissn.length > 0 &&
              permissn.includes(3) && {
                id: 'vehicles',
                title: 'Vehicles',
                path: '/dashboard/assets/vehicles'
              },
            permissn &&
              permissn.length > 0 &&
              permissn.includes(6) && {
                id: 'locations',
                title: 'Locations',
                path: '/dashboard/assets/locations'
              }
          ].filter(Boolean)
        },
        permissn &&
          permissn.length > 0 &&
          permissn.includes(12) && {
            id: 'drivers',
            title: 'Drivers',
            path: '/dashboard/drivers'
          },
        {
          id: 'fleet-user',
          title: 'Fleet User',
          path: '/dashboard/fleet-user'
        },
        {
          id: 'environments',
          title: 'Environments',
          path: '/dashboard/environments'
        },
        {
          id: 'coverageMap',
          title: 'Coverage Map',
          path: '/dashboard/coverageMap'
        }
        // {
        //   id: "proximity",
        //   title: "Proximity",
        //   path: "",
        // },
      ].filter(Boolean)
    },
    {
      id: 'safety',
      title: 'Safety',
      icon: 'shield-tick',
      path: '',
      subitems: [
        {
          id: 'overview',
          title: 'Overview',
          path: '/safety/overview'
        },
        {
          id: 'events',
          title: 'Events',
          path: '/safety/events'
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance',
      icon: 'user-square',
      path: '/dashboard/compliance'
    },
    // {
    //   id: "maintenance",
    //   title: "Maintenance",
    //   icon: "wrench",
    //   path: "",
    // },
    {
      id: 'fuel-energy',
      title: 'Fuel & Energy',
      icon: 'flash-circle',
      path: ''
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: 'document',
      path: '/dashboard/documents'
    },
    {
      id: 'message',
      title: 'Message',
      icon: 'message-text',
      path: '/dashboard/chatbox'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'graph-2',
      path: '',
      subitems: [
        {
          id: 'HOS violation detail',
          title: 'HOS violation detail',
          path: '/reports/data'
        },
        {
          id: 'Mileage report',
          title: 'Mileage report',
          path: '/mileage/data'
        },
        {
          id: 'Idling event report',
          title: 'Idling event report',
          path: '/idling/data'
        },
        {
          id: 'Fuel performance report',
          title: 'Fuel performance report',
          path: '/fuel/performance'
        },
        {
          id: 'Inspection report',
          title: 'Inspection report',
          path: '/inspection/report'
        },
        {
          id: 'Driver safety score report',
          title: 'Driver safety score report',
          path: '/safety/score/report'
        },
        {
          id: 'Hours worked',
          title: 'Hours worked',
          path: '/hours/worked'
        }
      ]
    },
    {
      id: 'Alerts',
      title: 'Alerts',
      icon: 'notification-status',
      path: '/dashboard/alert'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'gear',
      path: '',
      subitems: [
        {
          id: 'organization',
          title: 'Organization',
          path: '',
          subitems: [
            // { id: "general", title: "General", path: "" },
            permissn &&
              permissn.length > 0 &&
              permissn.includes(26) && {
                id: 'user-roles',
                title: 'User & Roles',
                path: '/settings/organization/user-roles'
              },
            permissn &&
              permissn.length > 0 &&
              permissn.includes(29) && {
                id: 'vehicle-assign',
                title: 'Vehicle Assignment',
                path: '/settings/organization/vehicle-assign'
              },
            // { id: "tag-attribute", title: "Tag & Attribute", path: "" },
            // {
            //   id: "feature-management",
            //   title: "Feature & Management",
            //   path: "",
            // },
            permissn &&
              permissn.length > 0 &&
              permissn.includes(32) && {
                id: 'driver-activity',
                title: 'Driver Activity',
                path: '/settings/organization/driver-activity'
              },
            {
              id: 'unidentified-driving',
              title: 'Unidentified driving',
              path: '/dashboard/unidentified-driving'
            }
          ].filter(Boolean)
        },
        {
          id: 'devices',
          title: 'Devices',
          path: '',
          subitems: [
            permissn &&
              permissn.length > 0 &&
              permissn.includes(35) && {
                id: 'devices-list',
                title: 'Devices',
                path: '/settings/devices/devices-list'
              }
            // { id: "configuration", title: "Configuration", path: "" },
          ].filter(Boolean)
        }
      ]
    }
  ]

  const handleLinkClick = () => {
    if (setSidebarToggle) {
      setSidebarToggle(true)
    }
  }

  const toggleMenu = (menuId, path) => {
    if (menuItems.some(x => x.id == menuId)) {
      let idx = menuItems.findIndex(x => x.id == menuId)
      if (parentId === menuId && menuItems[idx].subitems != undefined) {
        setParentId('')
      } else {
        setParentId(menuId)
        if (menuItems[idx].path != '') {
          if (isMobile) {
            const sidebar = document.getElementById('sidebar-mobile')
            sidebar.classList.toggle('sidebar-mobile-open')
          }
          router.push(menuItems[idx].path)
        }
      }
      setSubItemId('')
      setSubChildItemId('')
    }
    if (parentId != '') {
      let idx = menuItems.findIndex(x => x.id == parentId)
      if (idx > -1) {
        if (menuItems[idx]?.subitems?.some(x => x.id == menuId)) {
          if (subItemId == menuId) {
            setSubItemId('')
          } else {
            setSubItemId(menuId)
            let subIdx = menuItems[idx]?.subitems?.findIndex(
              x => x.id == menuId
            )
            if (subIdx > -1 && menuItems[idx]?.subitems[subIdx].path != '') {
              if (isMobile) {
                const sidebar = document.getElementById('sidebar-mobile')
                sidebar.classList.toggle('sidebar-mobile-open')
              }

              router.push(menuItems[idx]?.subitems[subIdx].path)
            }
          }

          setSubChildItemId('')
        }
      }
      if (subItemId != '') {
        let cIdx = menuItems[idx]?.subitems?.findIndex(x => x.id == subItemId)
        if (
          cIdx > -1 &&
          menuItems[idx]?.subitems[cIdx]?.subitems?.some(x => x.id == menuId)
        ) {
          setSubChildItemId(menuId)
          let subIdx = menuItems[idx]?.subitems[cIdx]?.subitems?.findIndex(
            x => x.id == menuId
          )
          if (
            subIdx > -1 &&
            menuItems[idx]?.subitems[cIdx]?.subitems[subIdx].path != ''
          ) {
            if (isMobile) {
              const sidebar = document.getElementById('sidebar-mobile')
              sidebar.classList.toggle('sidebar-mobile-open')
            }

            router.push(menuItems[idx]?.subitems[cIdx]?.subitems[subIdx].path)
          }
        }
      }
    }
  }

  function updateIds (path) {
    const segments = path.replace(/^\/+/, '').split('/')

    const parentId = segments[0]
    const subItemId = segments[1]
    const subSubItemId = segments[2]
    if (parentId === 'dashboard' && segments.length === 1) {
      return
    }

    const soloPages = ['documents', 'compliance']
    const foundIndex = soloPages.indexOf(subItemId)

    if (foundIndex !== -1) {
      setParentId(soloPages[foundIndex])
      return
    } else {
      setParentId(parentId)
    }

    setSubItemId(subItemId)
    if (subSubItemId) {
      setSubChildItemId(subSubItemId)
    } else {
      setSubChildItemId('')
    }
  }
  useEffect(() => {
    updateIds(pathName)
  }, [pathName])

  if (!load) {
    return (
      <div className='container'>
        {/* Skeleton for the parent menu item */}
        <div className='mb-3 p-3 border rounded bg-light'>
          {[...Array(7)].map((_, index) => (
            <div key={index} className='d-flex align-items-center mb-2'>
              <Skeleton circle={true} height={40} width={40} />
              <Skeleton width={100} style={{ marginLeft: '10px' }} />
            </div>
          ))}
          {/* Skeleton for subitems */}
        </div>
      </div>
    )
  }

  const renderMenuItems = (items, parentId) => {
    return items.map(item => (
      <div key={item.id} className={styles.menuItem}>
        <div
          className={`${styles.menuTitle}     
          ${
            item.subitems && item.subitems.length > 0 ? styles.hasSubitems : ''
          } 
         

            ${
              item.id == parentId && subItemId == ''
                ? item.subitems == undefined
                  ? `${styles.active + ' ' + styles.selected}`
                  : styles.active
                : ''
            }
        
            `}
          onClick={() => {
            toggleMenu(item.id, item.path)
          }}
        >
          {item.icon && <i className={`ki-outline ki-${item.icon} fs-1`}></i>}
          {!isCollapsed && <span onClick={handleLinkClick}>{item.title}</span>}
          {!isCollapsed && item.subitems && item.subitems.length > 0 && (
            <i
              className={`ki-duotone ${
                item.id == parentId ? 'ki-up' : 'ki-down'
              }`}
              style={{ marginLeft: '75px' }}
            ></i>
          )}
        </div>
        {item.subitems && (
          <div
            className={`${styles.subMenu}
  
            ${!isCollapsed && item.id == parentId ? styles.open : ''}`}
          >
            {item.subitems.map(subItem => (
              <div key={subItem.id} className={styles.menuItem}>
                <div
                  className={`${styles.menuTitle}
                    ${
                      subItem.subitems && subItem.subitems.length > 0
                        ? styles.hasSubitems
                        : ''
                    } ${
                    subItem.id == subItemId && subChildItemId == ''
                      ? subItem.subitems == undefined
                        ? `${styles.active + ' ' + styles.selected}`
                        : styles.active
                      : ''
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
                        className={`ki-duotone ${
                          subItem.id == subItemId ? 'ki-up' : 'ki-down'
                        }`}
                        style={{ marginLeft: '79px' }}
                      ></i>
                    )}
                </div>
                {subItem.subitems && (
                  <div
                    className={`${styles.subMenu}
            
                      ${
                        !isCollapsed && subItem.id == subItemId
                          ? styles.open
                          : ''
                      }`}
                  >
                    {subItem.subitems.map(subChildItem => (
                      <div key={subChildItem.id} className={styles.menuItem}>
                        <div
                          className={`${styles.menuTitle} ${
                            subChildItem.subitems &&
                            subChildItem.subitems.length > 0
                              ? styles.hasSubitems
                              : ''
                          }

                          
                              
                          ${
                            subChildItem.id == subChildItemId
                              ? styles.active + ' ' + styles.selected
                              : ''
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
                                className={`ki-duotone ${
                                  subChildItem.id == subChildItemId
                                    ? 'ki-up'
                                    : 'ki-down'
                                }`}
                                style={{ marginLeft: 'auto' }}
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
    ))
  }

  return (
    <>
      <div
        className={`${styles.sidebar}  ${
          isCollapsed ? styles.collapsed : ''
        }  `}
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
      >
        {renderMenuItems(menuItems, parentId)}
      </div>
    </>
  )
}

function isPathInArray (path, arr) {
  if (arr && arr.length) {
    return arr.some(item => item.path === path)
  }
}

function hasPath (menuItems, pathName) {
  if (menuItems && menuItems.length) {
    for (const menuItem of menuItems) {
      if (menuItem.path === pathName) {
        return true
      }

      if (menuItem.subitems) {
        if (hasPath(menuItem.subitems, pathName)) {
          return true
        }
      }
    }
  }

  return false
}

export default Sidebar
