'use client'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Shadow from '@/app/Shadow/page'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css' // Import the styles
import { signOut, useSession } from 'next-auth/react'
import { debounce } from 'lodash'
import { getPermissions } from '@/Components/permission/page'
import Skeleton from 'react-loading-skeleton' // Import Skeleton
import 'react-loading-skeleton/dist/skeleton.css' // Import Skeleton CSS

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel
} from '@tanstack/react-table'
import { set } from 'date-fns'

const MAX_VISIBLE_PAGES = 7

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages = []

  if (totalPages <= MAX_VISIBLE_PAGES) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 4) {
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
  }

  return pages
}

const ActivityTable = () => {
  type Vehicle = {
    id: number
    name: string
    vehicle: any
  }

  type Activity = {
    vehicle: Vehicle[]
  }

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [activity, setActivity] = useState()
  const [activitys, setActivitys] = useState<Activity | undefined>(undefined)
  const [permissn, setPermissn] = useState([])
  const [datass, setDatas] = useState([])
  const [error, setError] = useState(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(true) // Add loading state
  const [selectedDriverStatus, setSelectedDriverStatus] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehModel, setVehModel] = useState(false)

  const [pageNo, setPageNo] = useState(1)
  const [itemNo, setItemNo] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)

  const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL

  interface User {
    token: string
    // Add other properties you expect in the user object
  }

  interface SessionData {
    user?: User
    // Add other properties you expect in the session data
  }

  const { data: session } = (useSession() as { data?: SessionData }) || {}

  const token = session && session.user && session?.user?.token

  const fetchPermissions = useCallback(
    debounce(async token => {
      try {
        const perms = await getPermissions(token)
        setPermissn(perms)
      } catch (error) {
        if (error.response && error.response.status === 429) {
          setTimeout(() => fetchPermissions(token), 5000) // Retry after 5 seconds
        } else {

          console.error('Error fetching permissions:', error)
        }
      }
    }, 1000), // Increase debounce to 2 seconds
    [token]
  )

  useEffect(() => {
    if (token) {
      fetchPermissions(token)
    }
  }, [fetchPermissions, token])

  const fetchUsers = async () => {
    if (!token) return

    setLoading(true)
    try {
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
      setTotalRecords(data?.total || 0)
    } catch (error) {
      console.error('Error', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUsers()
    }
  }, [pageNo, itemNo, token])

  // Debounced fetch function
  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 1000), [
    url,
    token
  ])

  useEffect(() => {
    if (token) {
      debouncedFetchUsers()
    }
  }, [debouncedFetchUsers, token])

  const formattedDate = dateString => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '' // Return an empty string for invalid dates
    }
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', // Corrected to use string literals "numeric"
      month: 'short', // Corrected to use string literals "short"
      day: '2-digit', // Corrected to use string literals "2-digit"
      hour: '2-digit', // Corrected to use string literals "2-digit"
      minute: '2-digit', // Corrected to use string literals "2-digit"
      hour12: true, // Corrected, no change needed here
      timeZone: 'UTC' // Can modify or remove this if local time is needed
    }
    return date.toLocaleString('en-US', options)
  }

  const columns = React.useMemo(
    () => [
      {
        header: 'Driver',
        accessorKey: 'driver',
        cell: info => {
          const { first_name, last_name } = info.row.original.user || {}
          return `${first_name || ''} ${last_name || ''}`
        }
      },
      {
        header: 'Vehicle',
        accessorKey: 'vehicle',
        cell: info => info.row.original.vehicle?.name || ''
      },
      {
        header: 'Current Shift Status',
        accessorKey: 'current_shift_status',
        cell: info => info.row.original.option?.title || ''
      },
      {
        header: 'Message Reason',
        accessorKey: 'message_reason'
      },
      {
        header: 'Created',
        accessorKey: 'created_at',
        cell: info => {
          const date = new Date(info.getValue())
          return isNaN(date.getTime())
            ? ''
            : date.toLocaleString('en-US', {
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
        cell: info => (
          <Link
            href={`/drivers/driver-activity/${info.row.original.id}`}
            className='btn btn-light btn-active-light-primary btn-flex btn-center btn-sm'
          >
            Actions <i className='ki ki-outline ki-down fs-5 ms-1'></i>
          </Link>
        )
      }
    ],
    [permissn]
  )

  const table = useReactTable({
    data: activity,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      pagination: {
        pageIndex: pageNo - 1,
        pageSize: itemNo
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: updater => {
      const newPageIndex =
        typeof updater === 'function'
          ? updater({ pageIndex: pageNo - 1, pageSize: itemNo }).pageIndex
          : updater.pageIndex

      setPageNo(newPageIndex + 1)
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      return value
        ? String(value).toLowerCase().includes(filterValue.toLowerCase())
        : false
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRecords / itemNo)
  })

  const ChangeDutyStatus = async (id = null) => {
    if (!token) {
      console.error('No token available')
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
        // Success logic (if any)
        setLoading(false)
      } else {
        console.error('Unexpected response status:', response.status)
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          toast.error(error.response.data?.message, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
          })
        } else {
          console.error('Error changing duty status:', error.response.data)
        }
      } else {
        console.error('Error changing duty status:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityFn = async (
    url: string,
    token: string,
    setActivitys: Function
  ) => {
    try {
      const response = await fetch(
        `${url}/driver/info/driver-activity/create`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const responseData = await response.json()
        setActivitys(responseData)
      } else {
        const errorData = await response.json()
        console.error('Error fetching activity data:', errorData.message)
        // toastr["error"]("Error fetching activity data: " + errorData.message);
      }
    } catch (error: any) {
      console.error('Error fetching activity data:', error.message)
      // toastr["error"]("Error fetching activity data: " + error.message);
    }
  }

  const debouncedFetch = useMemo(
    () =>
      debounce(() => {
        if (token) {
          fetchActivityFn(url, token, setActivitys)
        }
      }, 1000),
    [url, token] // will recreate only if url or token changes
  )

  useEffect(() => {
    debouncedFetch()

    return () => {
      debouncedFetch.cancel() // cancel any pending debounce on unmount
    }
  }, [debouncedFetch])

  const [showModal, setShowModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

  const handleStatusChange = statusId => {
    setPendingStatus(statusId)
    setShowModal(true)
  }

  const handleVehicleChange = statusId => {
    setSelectedVehicle(statusId)
    setVehModel(true)
  }

  const cancelChange = () => {
    setShowModal(false)
    setPendingStatus(null)
  }

  const cancelVehicleChange = () => {
    setVehModel(false)
    setPendingStatus(null)
  }

  const confirmVehicleChange = async statusId => {
    setSelectedVehicle(statusId)
    setVehModel(false)

    try {
      // Change the duty status
      await ChangeDutyStatus(statusId)

      // Fetch the updated data
      fetchUsers()
    } catch (error) {
      console.error('Error confirming status change:', error)
    } finally {
      setSelectedDriverStatus(null)
    }
  }

  const confirmChange = async statusId => {
    setSelectedDriverStatus(statusId)
    setShowModal(false)
    setLoading(true)

    try {
      // Change the duty status
      await ChangeDutyStatus(statusId)

      // Fetch the updated data
      fetchUsers()
      fetchDriverDetails()
    } catch (error) {
      console.error('Error confirming status change:', error)
    } finally {
      setSelectedDriverStatus(null)
    }
  }

  const fetchDriverDetails = useCallback(
    debounce(async () => {
      try {
        const response = await fetch(`${BackEND}/driver/detail/hos/page`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const result = await response.json()

        setDatas(result)
      } catch (err) {
        setError(err.message)
      }
    }, 300), // Debounce time in milliseconds
    [BackEND, token]
  )

  // Use useEffect to call the debounced fetch function
  useEffect(() => {
    if (token) {
      fetchDriverDetails()
    }
  }, [fetchDriverDetails, token])

  const logData = [
    { id: 1, label: 'Off', logo: '/duty_logo/off.svg' },
    { id: 4, label: 'On', logo: '/duty_logo/coffee.svg' },
    { id: 3, label: 'D', logo: '/duty_logo/drive.svg' },
    { id: 2, label: 'SB', logo: '/duty_logo/sleeper.svg' },
    { id: 5, label: 'Personal Conveyance', logo: '/duty_logo/pu.svg' },
    { id: 6, label: 'Yard moves', logo: '/duty_logo/ym.svg' }
  ]

  // Once loading is complete, render the table
  return (
    <div>
      {/* <ToastContainer /> */}
      <div className='listItems'>
        <div className='topBar'>
          <div className='title'>
            <h2>Driver Activity List</h2>
            <div className='path'>Dashboard Drivers</div>
          </div>
        </div>
        <div className='mainList'>
          <div className='row mt-3 card card-flush card-body pt-0'>
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
                    style={{ marginRight: '8px' }}
                  ></i>
                  Add Driver Activity
                </Link>
              </div>
            </div>

            <div className='container mt-4'>
              <div className='row'>
                {/* Shift Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Current status</h5>
                      <div className='card-text'>
                        {datass && datass && datass[5]
                          ? datass[5] +
                            ' ' +
                            '(' +
                            (datass[1]?.name + ')' || '')
                          : 'Off duty'}
                      </div>
                      <div className='card-text'>
                        {datass ? (
                          datass && datass[2] ? (
                            datass[2]
                          ) : (
                            '00:00:00'
                          )
                        ) : (
                          <Skeleton />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='container mt-4'>
              <div className='row'>
                {/* Shift Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Shift left</h5>
                      <p className='card-text'>
                        {datass && datass && datass[4] ? (
                          datass[4]
                        ) : (
                          <Skeleton />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cycle Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Cycle left</h5>
                      <p className='card-text'>
                        {datass && datass && datass[6] ? (
                          datass[6]
                        ) : (
                          <Skeleton />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Break Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Break left</h5>
                      <p className='card-text'>
                        {datass && datass && datass[8] ? (
                          datass[8]
                        ) : (
                          <Skeleton />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Drive Left */}
                <div className='col-12 col-sm-6 col-md-3 mb-3'>
                  <div className='card text-center shadow-sm'>
                    <div className='card-body'>
                      <h5 className='card-title'>Drive left</h5>
                      <p className='card-text'>
                        {datass && datass && datass[7] ? (
                          datass[7]
                        ) : (
                          <Skeleton />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!loading && (
              <div className='mt-4 mb-4'>
                <div className='mb-5 mt-4'>
                  <div className='d-flex flex-column'>
                    <label className='col-form-label'>
                      Change your duty Status
                    </label>
                    <div className='duty-status-container'>
                      {logData.map(status => (
                        <div
                          className={`status-card ${
                            selectedDriverStatus === status.id
                              ? 'selected-status'
                              : 'unselected-status'
                          }`}
                          onClick={() => handleStatusChange(status.id)}
                          key={status.id}
                        >
                          <div className='status-content'>
                            <img
                              src={status.logo}
                              alt={status.label}
                              className='status-icon'
                            />
                            <span>{status.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional Modal (for confirmation) */}
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

                <style jsx>{`
                  /* Container Styles */
                  .duty-status-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                  }

                  /* Card Styles */
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
                  }

                  .status-card:hover {
                    background-color: #f8f9fa;
                  }

                  .selected-status {
                    background-color: #007bff;
                    color: white;
                    border-color: #0056b3;
                  }

                  .status-icon {
                    width: 30px;
                    margin-bottom: 5px;
                  }

                  /* Modal Styles */
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

                  .confirm-button {
                    background: #007bff;
                    color: #ffffff;
                  }

                  /* Mobile-Specific Layout */
                  @media (max-width: 576px) {
                    .duty-status-container {
                      grid-template-columns: repeat(2, 1fr);
                      gap: 15px;
                    }

                    .status-card {
                      padding: 15px;
                    }

                    .status-icon {
                      width: 40px;
                    }
                  }
                `}</style>
              </div>
            )}

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
                      {table && table?.getRowModel()?.rows?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={table.getAllColumns().length}
                            style={{ textAlign: 'center', padding: '20px' }}
                          >
                            No data available
                          </td>
                        </tr>
                      ) : (
                        table &&
                        table?.getRowModel()?.rows?.map(row => (
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

                <nav aria-label='Page navigation'>
                  <ul className='pagination mb-0'>
                    <li
                      className={`page-item ${pageNo === 1 ? 'disabled' : ''}`}
                    >
                      <button
                        className='page-link'
                        onClick={() => setPageNo(pageNo - 1)}
                        disabled={pageNo === 1}
                      >
                        &laquo;
                      </button>
                    </li>

                    {getPageNumbers(
                      pageNo,
                      Math.ceil(totalRecords / itemNo)
                    ).map((page, idx) => (
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
                            onClick={() => setPageNo(Number(page))}
                          >
                            {page}
                          </button>
                        )}
                      </li>
                    ))}

                    <li
                      className={`page-item ${
                        pageNo >= Math.ceil(totalRecords / itemNo)
                          ? 'disabled'
                          : ''
                      }`}
                    >
                      <button
                        className='page-link'
                        onClick={() => setPageNo(pageNo + 1)}
                        disabled={pageNo >= Math.ceil(totalRecords / itemNo)}
                      >
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityTable
