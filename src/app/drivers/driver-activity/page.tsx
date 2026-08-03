'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import axios from 'axios'
import Shadow from '@/app/Shadow/page'
import { ToastContainer, toast } from 'react-toastify'
import { useSession } from 'next-auth/react'
import Skeleton from 'react-loading-skeleton'

import 'react-toastify/dist/ReactToastify.css'
import 'react-loading-skeleton/dist/skeleton.css'

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel
} from '@tanstack/react-table'

const MAX_VISIBLE_PAGES = 7

const getPageNumbers = (
  currentPage: number,
  totalPages: number
): (number | string)[] => {
  const pages: (number | string)[] = []

  if (totalPages <= 0) {
    return []
  }

  if (totalPages <= MAX_VISIBLE_PAGES) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages)
  } else if (currentPage >= totalPages - 3) {
    pages.push(
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    )
  } else {
    pages.push(
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    )
  }

  return pages
}

type ActivityUser = {
  first_name?: string
  last_name?: string
}

type ActivityVehicle = {
  id?: number
  name?: string
}

type ActivityOption = {
  title?: string
}

type ActivityRow = {
  id: number
  user?: ActivityUser
  vehicle?: ActivityVehicle
  option?: ActivityOption
  current_shift_status?: string
  message_reason?: string
  created_at?: string
}

type DutyStatusData = {
  driverId: number
  vehicle?: {
    id?: number
    name?: string
  }
  shiftStatus?: string
  startLogTime?: string
  endLogTime?: string
  duration?: string
  locationName?: string
  odometer?: string | number
  shift_time?: string
  cycle_time?: string
  drive_time?: string
  break_time?: string
  engineHours?: string | number
}

interface User {
  id?: number | string
  userId?: number | string
  token: string
  [key: string]: any
}

interface SessionData {
  user?: User
}

const ActivityTable = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  const { data: session, status } = useSession() as {
    data: SessionData | null
    status: 'loading' | 'authenticated' | 'unauthenticated'
  }

  const token = session?.user?.token

  const userId =
    session?.user?.id ||
    session?.user?.userId ||
    (session?.user as any)?.user?.id

  // ==========================================
  // WebSocket refs
  // ==========================================

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(true)

  // ==========================================
  // State
  // ==========================================

  const [dutyStatus, setDutyStatus] = useState<DutyStatusData | null>(null)

  const [activity, setActivity] = useState<ActivityRow[]>([])

  const [datass, setDatas] = useState<any[]>([])

  const [error, setError] = useState<string | null>(null)

  const [globalFilter, setGlobalFilter] = useState('')

  const [loading, setLoading] = useState(true)

  const [selectedDriverStatus, setSelectedDriverStatus] = useState<
    number | null
  >(null)

  const [pageNo, setPageNo] = useState(1)

  const [itemNo] = useState(10)

  const [totalRecords, setTotalRecords] = useState(0)

  const [showModal, setShowModal] = useState(false)

  const [pendingStatus, setPendingStatus] = useState<number | null>(null)

  // ==========================================
  // WebSocket Connection
  // ==========================================

  const fetchUsers = useCallback(async () => {
    if (!token || !url) {
      return
    }

    try {
      setLoading(true)

      const response = await axios.get(
        `${url}/driver/info/driver-activity/data/${pageNo}/${itemNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = response.data

      setActivity(data?.driverShift || [])
      setTotalRecords(Number(data?.total || 0))
    } catch (error) {
      console.error('Error fetching activity:', error)
      setActivity([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [token, url, pageNo, itemNo])

  const fetchDriverDetails = useCallback(async () => {
    if (!token || !BackEND) {
      return
    }

    try {
      const response = await fetch(`${BackEND}/driver/detail/hos/page`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch driver details: ${response.status}`)
      }

      const result = await response.json()

      setDatas(Array.isArray(result) ? result : [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching driver details:', err)

      setError(
        err?.message || 'Something went wrong while fetching driver details'
      )
    }
  }, [BackEND, token])

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      return
    }

    if (!userId || !token) {

      return
    }

    if (!websocketUrl) {
      console.error(
        'WebSocket ERROR: NEXT_PUBLIC_WEBSOCKET_URL is not configured'
      )

      return
    }

    shouldReconnectRef.current = true

    const connectWebSocket = () => {
      if (!shouldReconnectRef.current) {
       
        return
      }

      const ws = new WebSocket(websocketUrl)

      wsRef.current = ws

      ws.onopen = () => {

        // IMPORTANT:
        // Your WebSocket server requires an access token.
        // Do NOT send only senderId.

        const authMessage = {
          sendType: 'auth',
          senderId: Number(userId),
          token: token
        }

        ws.send(JSON.stringify(authMessage))
      }

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          // ==========================================
          // AUTH SUCCESS
          // ==========================================

          if (data.sendType === 'auth_success' && data.authenticated === true) {

            return
          }

          // ==========================================
          // AUTH FAILED
          // ==========================================

          if (data.sendType === 'auth_failed') {
            console.error('WebSocket authentication failed:', data.message)

            // IMPORTANT:
            // Do not reconnect if authentication failed.
            // Otherwise you will get an infinite reconnect loop.

            shouldReconnectRef.current = false

            if (wsRef.current === ws) {
              wsRef.current = null
            }

            ws.close(1008, data.message || 'Authentication failed')

            return
          }

          // ==========================================
          // DUTY STATUS UPDATE
          // ==========================================

          if (data.sendType === 'change-duty-status') {

            const shiftStatusData = {
              1: 'Off Duty',
              3: 'Driving'
            }

            setDutyStatus({
              driverId: Number(data.driverId),

              vehicle: data.vehicle,

              shiftStatus: shiftStatusData?.[data.shiftStatus],

              startLogTime: data.startLogTime,

              endLogTime: data.endLogTime,

              locationName: data.locationName,

              shift_time: data.shift_time,

              cycle_time: data.cycle_time,

              break_time: data.break_time,

              drive_time: data.drive_time,

              duration: data.duration,

              odometer: data.odometer,

              engineHours: data.engineHours
            })

            // Refresh activity table
            fetchUsers()

            // Refresh HOS data
            fetchDriverDetails()

            return
          }
        } catch (error) {
          console.error('WebSocket JSON parse error:', error)
        }
      }

      ws.onerror = error => {
        console.error('WebSocket ERROR:', error)
      }

      ws.onclose = event => {

        if (wsRef.current === ws) {
          wsRef.current = null
        }

        // Do NOT reconnect after authentication failure
        if (event.code === 1008) {
          console.error(
            'WebSocket closed due to authentication/policy error. Reconnection stopped.'
          )

          shouldReconnectRef.current = false

          return
        }

        // Reconnect only for normal network/server disconnects
        if (shouldReconnectRef.current) {

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }
    }

    connectWebSocket()

    return () => {

      shouldReconnectRef.current = false

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)

        reconnectTimeoutRef.current = null
      }

      if (wsRef.current) {
        wsRef.current.close()

        wsRef.current = null
      }
    }
  }, [userId, token, status, websocketUrl, fetchUsers, fetchDriverDetails])

  // ==========================================
  // Initial API Calls
  // ==========================================

  useEffect(() => {
    if (token) {
      fetchUsers()
    }
  }, [token, fetchUsers])

  useEffect(() => {
    if (token) {
      fetchDriverDetails()
    }
  }, [token, fetchDriverDetails])

  // ==========================================
  // Change Duty Status
  // ==========================================

  const ChangeDutyStatus = useCallback(
    async (id: number | null = null) => {
      if (!token || !url || id === null) {
        console.error('No token, API URL, or status ID available')

        return
      }

      try {
        const response = await axios.get(
          `${url}/driver/change/duty/status/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (response.status >= 200 && response.status < 300) {
          await fetchUsers()

          await fetchDriverDetails()
        } else {
          console.error('Unexpected response status:', response.status)
        }
      } catch (error: any) {
        if (error?.response) {
          if (error.response.status === 404) {
            toast.error(
              error.response.data?.message || 'Unable to change duty status',
              {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
              }
            )
          } else {
            console.error('Error changing duty status:', error.response.data)
          }
        } else {
          console.error('Error changing duty status:', error)
        }

        throw error
      }
    },
    [token, url, fetchUsers, fetchDriverDetails]
  )

  // ==========================================
  // Status Modal
  // ==========================================

  const handleStatusChange = (statusId: number) => {
    setPendingStatus(statusId)
    setShowModal(true)
  }

  const cancelChange = () => {
    setShowModal(false)
    setPendingStatus(null)
  }

  const confirmChange = async (statusId: number | null) => {
    if (statusId === null) {
      return
    }

    setSelectedDriverStatus(statusId)

    setShowModal(false)

    setLoading(true)

    try {
      await ChangeDutyStatus(statusId)
    } catch (error) {
      console.error('Error confirming status change:', error)
    } finally {
      setSelectedDriverStatus(null)

      setPendingStatus(null)

      setLoading(false)
    }
  }

  // ==========================================
  // Duty Status Options
  // ==========================================

  const logData = [
    {
      id: 1,
      label: 'Off',
      logo: '/duty_logo/off.svg'
    },
    {
      id: 4,
      label: 'On',
      logo: '/duty_logo/coffee.svg'
    },
    {
      id: 3,
      label: 'D',
      logo: '/duty_logo/drive.svg'
    },
    {
      id: 2,
      label: 'SB',
      logo: '/duty_logo/sleeper.svg'
    },
    {
      id: 5,
      label: 'Personal Conveyance',
      logo: '/duty_logo/pu.svg'
    },
    {
      id: 6,
      label: 'Yard moves',
      logo: '/duty_logo/ym.svg'
    }
  ]

  // ==========================================
  // Table Columns
  // ==========================================

  const columns = useMemo(
    () => [
      {
        header: 'Driver',
        accessorKey: 'driver',
        cell: (info: any) => {
          const { first_name, last_name } = info.row.original.user || {}

          return `${first_name || ''} ${last_name || ''}`.trim()
        }
      },

      {
        header: 'Vehicle',
        accessorKey: 'vehicle',
        cell: (info: any) => info.row.original.vehicle?.name || ''
      },

      {
        header: 'Current Shift Status',
        accessorKey: 'current_shift_status',
        cell: (info: any) => info.row.original.option?.title || ''
      },

      {
        header: 'Message Reason',
        accessorKey: 'message_reason',
        cell: (info: any) => info.getValue() || ''
      },

      {
        header: 'Created',
        accessorKey: 'created_at',
        cell: (info: any) => {
          const value = info.getValue()

          if (!value) {
            return ''
          }

          const date = new Date(value)

          if (isNaN(date.getTime())) {
            return ''
          }

          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'
          })
        }
      },

      {
        header: 'Actions',

        cell: (info: any) => (
          <Link
            href={`/drivers/driver-activity/${info.row.original.id}`}
            className='btn btn-light btn-active-light-primary btn-flex btn-center btn-sm'
          >
            Actions
            <i className='ki ki-outline ki-down fs-5 ms-1'></i>
          </Link>
        )
      }
    ],
    []
  )

  // ==========================================
  // React Table
  // ==========================================

  const table = useReactTable({
    data: activity,
    columns,

    getCoreRowModel: getCoreRowModel(),

    getFilteredRowModel: getFilteredRowModel(),

    state: {
      globalFilter
    },

    onGlobalFilterChange: setGlobalFilter,

    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)

      return value
        ? String(value)
            .toLowerCase()
            .includes(String(filterValue).toLowerCase())
        : false
    }
  })

  // ==========================================
  // Pagination
  // ==========================================

  const totalPages = Math.ceil(totalRecords / itemNo)

  const handlePreviousPage = () => {
    setPageNo(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setPageNo(prev => Math.min(totalPages, prev + 1))
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPageNo(page)
    }
  }

  // ==========================================
  // Current Duty Status
  // ==========================================

  const currentStatus = dutyStatus?.shiftStatus || datass?.[5] || 'Off duty'

  const currentVehicle = dutyStatus?.vehicle?.name || datass?.[1]?.name

  const currentDuration = dutyStatus?.duration || datass?.[2] || '00:00:00'

  const shiftLeft = dutyStatus?.shift_time || datass?.[4]

  const cycleLeft = dutyStatus?.cycle_time || datass?.[6]

  const breakLeft = dutyStatus?.break_time || datass?.[8]

  const driveLeft = dutyStatus?.drive_time || datass?.[7]

  return (
    <div>
      <ToastContainer />

      {/* ===================================== */}
      {/* PAGE HEADER */}
      {/* ===================================== */}

      <div className='listItems'>
        <div className='topBar'>
          <div className='title'>
            <h2>Driver Activity List</h2>

            <div className='path'>Dashboard Drivers</div>
          </div>
        </div>

        <div className='mainList'>
          <div className='row mt-3 card card-flush card-body pt-0'>
            {/* ===================================== */}
            {/* SEARCH + ADD BUTTON */}
            {/* ===================================== */}

            <div className='searchBar'>
              <div className='search'>
                <input
                  className='form-control form-control-solid w-250px ps-12'
                  type='text'
                  placeholder='Search Driver Activity'
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                />
              </div>

              <div className='btnGroup'>
                <Link
                  href='/drivers/driver-activity/add-activity'
                  className='btn-primary'
                >
                  <i
                    className='ki-outline ki-plus-square fs-3'
                    style={{
                      marginRight: '8px'
                    }}
                  ></i>
                  Add Driver Activity
                </Link>
              </div>
            </div>

            {/* ===================================== */}
            {/* CURRENT STATUS */}
            {/* ===================================== */}

            <div className='container mt-4'>
              <div className='row'>
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Current status</h5>

                      <div className='card-text'>
                        {currentStatus}

                        {currentVehicle && <> ({currentVehicle})</>}
                      </div>

                      <div className='card-text'>
                        {currentDuration ? currentDuration : <Skeleton />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================== */}
            {/* HOS STATUS CARDS */}
            {/* ===================================== */}

            <div className='container mt-4'>
              <div className='row'>
                {/* Shift Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Shift left</h5>

                      <p className='card-text'>{shiftLeft || <Skeleton />}</p>
                    </div>
                  </div>
                </div>

                {/* Cycle Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Cycle left</h5>

                      <p className='card-text'>{cycleLeft || <Skeleton />}</p>
                    </div>
                  </div>
                </div>

                {/* Break Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Break left</h5>

                      <p className='card-text'>{breakLeft || <Skeleton />}</p>
                    </div>
                  </div>
                </div>

                {/* Drive Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Drive left</h5>

                      <p className='card-text'>{driveLeft || <Skeleton />}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================== */}
            {/* CHANGE DUTY STATUS */}
            {/* ===================================== */}

            {!loading && (
              <div className='mt-4 mb-4'>
                <div className='mb-5 mt-4'>
                  <div className='d-flex flex-column'>
                    <label className='col-form-label'>
                      Change your duty Status
                    </label>

                    <div className='duty-status-container'>
                      {logData.map(statusItem => (
                        <div
                          key={statusItem.id}
                          className={`status-card ${
                            selectedDriverStatus === statusItem.id
                              ? 'selected-status'
                              : 'unselected-status'
                          }`}
                          onClick={() => handleStatusChange(statusItem.id)}
                        >
                          <div className='status-content'>
                            <img
                              src={statusItem.logo}
                              alt={statusItem.label}
                              className='status-icon'
                            />

                            <span>{statusItem.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ===================================== */}
                {/* CONFIRMATION MODAL */}
                {/* ===================================== */}

                {showModal && (
                  <div className='modal-overlay'>
                    <div className='modal-content'>
                      <p>Do you want to change the current duty log?</p>

                      <div className='modal-buttons'>
                        <button
                          onClick={cancelChange}
                          className='cancel-button'
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() => confirmChange(pendingStatus)}
                          className='confirm-button'
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===================================== */}
            {/* ACTIVITY TABLE */}
            {/* ===================================== */}

            <div className='dataTables_wrapper dt-bootstrap4 no-footer'>
              <div className='table-responsive'>
                {!loading ? (
                  <table
                    className='table-row-dashed fs-6 gy-5 dataTable no-footer'
                    id='kt_tr_u_table'
                  >
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>

                    <tbody className='text-gray-600 fw-semibold'>
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={table.getAllColumns().length}
                            style={{
                              textAlign: 'center',
                              padding: '20px'
                            }}
                          >
                            No data available
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <Shadow header={5} val={5} />
                )}

                {/* ===================================== */}
                {/* PAGINATION */}
                {/* ===================================== */}

                {totalPages > 0 && (
                  <nav aria-label='Page navigation' className='mt-4'>
                    <ul className='pagination mb-0'>
                      {/* Previous */}
                      <li
                        className={`page-item ${
                          pageNo === 1 ? 'disabled' : ''
                        }`}
                      >
                        <button
                          className='page-link'
                          onClick={handlePreviousPage}
                          disabled={pageNo === 1}
                        >
                          &laquo;
                        </button>
                      </li>

                      {/* Page Numbers */}
                      {getPageNumbers(pageNo, totalPages).map((page, idx) => (
                        <li
                          key={idx}
                          className={`page-item ${
                            page === pageNo ? 'active' : ''
                          } ${page === '...' ? 'disabled' : ''}`}
                        >
                          {page === '...' ? (
                            <span className='page-link'>...</span>
                          ) : (
                            <button
                              className='page-link'
                              onClick={() => handlePageChange(Number(page))}
                            >
                              {page}
                            </button>
                          )}
                        </li>
                      ))}

                      {/* Next */}
                      <li
                        className={`page-item ${
                          pageNo >= totalPages ? 'disabled' : ''
                        }`}
                      >
                        <button
                          className='page-link'
                          onClick={handleNextPage}
                          disabled={pageNo >= totalPages}
                        >
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================== */}
      {/* STYLES */}
      {/* ===================================== */}

      <style jsx>{`
        .duty-status-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .status-card {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border: 1px solid #000;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, background-color 0.2s ease;
          user-select: none;
        }

        .status-card:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
        }

        .selected-status {
          background-color: #007bff;
          color: white;
          border-color: #0056b3;
        }

        .selected-status:hover {
          background-color: #0069d9;
        }

        .status-icon {
          width: 30px;
          height: 30px;
          object-fit: contain;
          margin-bottom: 5px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          max-width: 350px;
          width: 90%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .modal-content p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }

        .modal-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
        }

        .cancel-button,
        .confirm-button {
          border: none;
          border-radius: 5px;
          padding: 10px 20px;
          cursor: pointer;
          font-weight: bold;
        }

        .cancel-button {
          background: #ced4da;
          color: #495057;
        }

        .cancel-button:hover {
          background: #adb5bd;
        }

        .confirm-button {
          background: #007bff;
          color: #ffffff;
        }

        .confirm-button:hover {
          background: #0069d9;
        }

        @media (max-width: 768px) {
          .duty-status-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
        }

        @media (max-width: 576px) {
          .duty-status-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .status-card {
            padding: 15px 10px;
          }

          .status-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  )
}

export default ActivityTable
