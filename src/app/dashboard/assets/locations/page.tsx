'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import axios from 'axios'
import { debounce } from 'lodash'
import Shadow from '@/app/Shadow/page'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import 'react-toastify/dist/ReactToastify.css'

import { getPermissions } from '@/Components/permission/page'
import ToggleSwitchLocation from '@/Components/locationToggle'
import AddLocationModal from './locationForm/addLocationPopup'

import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef
} from '@tanstack/react-table'

import { ToastContainer } from 'react-toastify'

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type LocationData = {
  id: number
  name: string
  address: string
  address_types?: string
  shapeData?: string
  notes?: string
  note?: string
  status?: boolean
  created_at?: string
}

interface User {
  token: string
}

interface SessionData {
  user?: User
}

interface ShapeData {
  type: 'circle' | 'rectangle' | 'polygon'
  center?: {
    lat: number
    lng: number
  }
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  paths?: Array<{
    lat: number
    lng: number
  }>
}

/* -------------------------------------------------------------------------- */
/* Shape Data Cell                                                            */
/* -------------------------------------------------------------------------- */

interface ShapeDataCellProps {
  value?: string | null
}

const ShapeDataCell: React.FC<ShapeDataCellProps> = ({ value }) => {
  const [locationName, setLocationName] = useState<string>('')

  const [mapLoad, setMapLoad] = useState(true)

  const shapeData = useMemo<ShapeData | null>(() => {
    if (!value) {
      return null
    }

    try {
      return JSON.parse(value)
    } catch (error) {
      console.error('Invalid shapeData:', error)

      return null
    }
  }, [value])

  const type = shapeData?.type

  /* ------------------------------------------------------------------------ */
  /* Find location name                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false

    const findLocation = async () => {
      if (!value) {
        setLocationName('No location')
        setMapLoad(false)
        return
      }

      if (typeof window === 'undefined' || !window.google?.maps) {
        setLocationName('Google Maps unavailable')
        setMapLoad(false)
        return
      }

      try {
        const datas = JSON.parse(value) as ShapeData

        let latLng: google.maps.LatLng | null = null

        /* -------------------------------------------------------------- */
        /* Circle                                                          */
        /* -------------------------------------------------------------- */

        if (datas.type === 'circle' && datas.center) {
          latLng = new window.google.maps.LatLng(
            datas.center.lat,
            datas.center.lng
          )
        } else if (datas.type === 'rectangle' && datas.bounds) {

        /* -------------------------------------------------------------- */
        /* Rectangle                                                       */
        /* -------------------------------------------------------------- */
          latLng = new window.google.maps.LatLng(
            (datas.bounds.north + datas.bounds.south) / 2,
            (datas.bounds.east + datas.bounds.west) / 2
          )
        } else if (datas.type === 'polygon' && datas.paths?.length) {

        /* -------------------------------------------------------------- */
        /* Polygon                                                         */
        /* -------------------------------------------------------------- */
          const center = datas.paths.reduce(
            (acc, point) => ({
              lat: acc.lat + point.lat,
              lng: acc.lng + point.lng
            }),
            {
              lat: 0,
              lng: 0
            }
          )

          latLng = new window.google.maps.LatLng(
            center.lat / datas.paths.length,
            center.lng / datas.paths.length
          )
        }

        if (!latLng) {
          if (!cancelled) {
            setLocationName('Invalid shape data')
            setMapLoad(false)
          }

          return
        }

        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode(
          {
            location: latLng
          },
          (results, status) => {
            if (cancelled) {
              return
            }

            if (
              status === window.google.maps.GeocoderStatus.OK &&
              results?.[0]
            ) {
              setLocationName(results[0].formatted_address)
            } else {
              setLocationName('Location unavailable')
            }

            setMapLoad(false)
          }
        )
      } catch (error) {
        console.error('Error finding location:', error)

        if (!cancelled) {
          setLocationName('Location unavailable')

          setMapLoad(false)
        }
      }
    }

    setMapLoad(true)

    findLocation()

    return () => {
      cancelled = true
    }
  }, [value])

  /* ------------------------------------------------------------------------ */
  /* Polygon                                                                  */
  /* ------------------------------------------------------------------------ */

  if (type === 'polygon') {
    return (
      <div className='d-flex align-items-center'>
        <div
          style={{
            marginRight: '4px'
          }}
        >
          <svg
            viewBox='0 0 24 24'
            className='text-primary'
            style={{
              fontSize: '1.8rem',
              width: '1em',
              height: '1em',
              fill: 'currentcolor'
            }}
          >
            <polygon
              points='2.8559420108795166,14.883604288101196 14.618008613586426,3.6527273654937744 21.068174362182617,20.347273111343384'
              fillOpacity='0.25'
            />

            <path d='m21.068174,17.691323c-0.075884,0 -0.151769,0 -0.227653,0l-4.553058,-11.913835c0.607074,-0.455306 0.986496,-1.214149 0.986496,-2.12476c0,-1.441802 -1.214149,-2.655951 -2.655951,-2.655951s-2.655951,1.214149 -2.655951,2.655951c0,0.455306 0.075884,0.834727 0.303537,1.214149l-8.11962,7.740199c-0.379422,-0.227653 -0.834727,-0.303537 -1.290033,-0.303537c-1.441802,0 -2.655951,1.214149 -2.655951,2.655951c0,1.441802 1.214149,2.655951 2.655951,2.655951c0.910612,0 1.745339,-0.53119 2.276529,-1.290033l13.355637,4.021868c0,0 0,0 0,0c0,1.441802 1.214149,2.655951 2.655951,2.655951s2.655951,-1.214149 2.655951,-2.655951s-1.214149,-2.655951 -2.731835,-2.655951zm-15.556282,-2.807719c0,-0.455306 -0.151769,-0.834727 -0.303537,-1.138265l8.11962,-7.740199c0.379422,0.227653 0.834727,0.379422 1.290033,0.379422c0.075884,0 0.151769,0 0.227653,0l4.628942,11.989719c-0.227653,0.151769 -0.455306,0.379422 -0.607074,0.607074l-13.355637,-4.097752z' />
          </svg>
        </div>

        {mapLoad ? (
          <Skeleton width={180} height={15} />
        ) : (
          <span
            style={{
              minWidth: '100px'
            }}
          >
            {locationName}
          </span>
        )}
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Rectangle                                                                */
  /* ------------------------------------------------------------------------ */

  if (type === 'rectangle') {
    return (
      <div className='d-flex align-items-center'>
        <div
          style={{
            marginRight: '4px'
          }}
        >
          <svg
            viewBox='0 0 24 24'
            className='text-primary'
            style={{
              fontSize: '1.8rem',
              width: '1em',
              height: '1em',
              fill: 'currentcolor'
            }}
          >
            <path
              fillOpacity='0.25'
              d='m6.929785,3.777532a2.886682,2.896627 0 0 1 -1.966853,1.974867l0,12.496805a2.886682,2.896627 0 0 1 1.965251,1.973263l10.143635,0a2.886682,2.896627 0 0 1 1.965249,-1.973263l0,-12.496805a2.886682,2.896627 0 0 1 -1.965249,-1.974867l-10.142032,0z'
            />

            <path d='m4.157437,0.075458a2.886682,2.896627 0 0 0 -2.886961,2.896578a2.886682,2.896627 0 0 0 2.080663,2.779561l0,12.495202a2.886682,2.896627 0 0 0 -2.080663,2.781163a2.886682,2.896627 0 0 0 2.886961,2.896579a2.886682,2.896627 0 0 0 2.771546,-2.091884l10.142032,0a2.886682,2.896627 0 0 0 2.771546,2.091884a2.886682,2.896627 0 0 0 2.886961,-2.896579a2.886682,2.896627 0 0 0 -2.082267,-2.779561l0,-12.496805a2.886682,2.896627 0 0 0 2.082267,-2.779561a2.886682,2.896627 0 0 0 -2.886961,-2.896578a2.886682,2.896627 0 0 0 -2.771546,2.090281l-10.143635,0a2.886682,2.896627 0 0 0 -2.769943,-2.090281zm2.771546,3.701272l10.142032,0a2.886682,2.896627 0 0 0 1.965249,1.974867l0,12.496805a2.886682,2.896627 0 0 0 -1.965249,1.973264l-10.143635,0a2.886682,2.896627 0 0 0 -1.96525,-1.973264l0,-12.496805a2.886682,2.896627 0 0 0 1.966853,-1.974867z' />
          </svg>
        </div>

        {mapLoad ? <Skeleton width={80} height={15} /> : locationName}
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Circle                                                                   */
  /* ------------------------------------------------------------------------ */

  if (type === 'circle') {
    return (
      <div className='d-flex align-items-center'>
        <div
          style={{
            marginRight: '4px'
          }}
        >
          <svg
            viewBox='0 0 24 24'
            className='text-primary'
            style={{
              fontSize: '1.8rem',
              width: '1em',
              height: '1em',
              fill: 'currentcolor'
            }}
          >
            <circle r='9.183301' cy='12' cx='12' fillOpacity='0.25' />

            <path d='m23.907162,12.000001c0,-1.323018 -1.01172,-2.490387 -2.334738,-2.646036c-0.933895,-3.346457 -3.579931,-5.992494 -6.926389,-6.926389c-0.233474,-1.323018 -1.323018,-2.334738 -2.646036,-2.334738s-2.490387,1.01172 -2.646036,2.334738c-3.346457,0.933895 -5.992494,3.579931 -6.926389,6.926389c-1.323018,0.155649 -2.334738,1.323018 -2.334738,2.646036c0,1.323018 1.01172,2.490387 2.334738,2.646036c0.933895,3.346457 3.579931,5.992494 6.926389,6.926389c0.233474,1.323018 1.323018,2.334738 2.646036,2.334738s2.490387,-1.01172 2.646036,-2.334738c3.346457,0.933895 5.992494,3.579931 6.926389,-6.926389c1.323018,0.155649 2.334738,1.323018 2.334738,-2.646036z' />
          </svg>
        </div>

        {mapLoad ? <Skeleton width={80} height={15} /> : locationName}
      </div>
    )
  }

  return <span className='text-muted'>No map drawn</span>
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

const LocationTable = () => {
  const router = useRouter()

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL

  /* ------------------------------------------------------------------------ */
  /* Session                                                                  */
  /* ------------------------------------------------------------------------ */

  const { data: session, status: sessionStatus } =
    (useSession() as {
      data?: SessionData
      status?: string
    }) || {}

  const token = session?.user?.token

  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [showModal, setShowModal] = useState(false)

  const [locationData, setLocationData] = useState<LocationData[]>([])

  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')

  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  )

  const [loading, setLoading] = useState(true)

  const [globalFilter, setGlobalFilter] = useState('')

  const [permissions, setPermissions] = useState<number[]>([])

  /* ------------------------------------------------------------------------ */
  /* Fetch permissions                                                        */
  /* ------------------------------------------------------------------------ */

  const fetchPermissions = useCallback(async (authToken: string) => {
    if (!authToken) {
      return
    }

    try {
      const perms = await getPermissions(authToken)

      setPermissions(Array.isArray(perms) ? perms : [])
    } catch (error: any) {
      if (error?.response?.status === 429) {
        console.warn('Permission API rate limit reached.')

        return
      }

      console.error('Error fetching permissions:', error)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    fetchPermissions(token)
  }, [token, fetchPermissions])

  /* ------------------------------------------------------------------------ */
  /* Fetch locations                                                          */
  /* ------------------------------------------------------------------------ */

  const fetchLocation = useCallback(async () => {
    if (!token || !url) {
      return
    }

    setLoading(true)

    try {
      const response = await axios.get(`${url}/asset/location`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setLocationData(response?.data?.locations || [])
    } catch (error) {
      console.error('Error fetching location data:', error)
    } finally {
      setLoading(false)
    }
  }, [token, url])

  /* ------------------------------------------------------------------------ */
  /* Load locations                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!token) {
      return
    }

    fetchLocation()
  }, [token, fetchLocation])

  /* ------------------------------------------------------------------------ */
  /* Refresh list                                                             */
  /* ------------------------------------------------------------------------ */

  const updateLocationList = useCallback(() => {
    fetchLocation()
  }, [fetchLocation])

  /* ------------------------------------------------------------------------ */
  /* Modal                                                                    */
  /* ------------------------------------------------------------------------ */

  const openModal = useCallback(
    (mode: 'add' | 'edit', locationId: number | null = null) => {
      setModalMode(mode)
      setSelectedLocationId(locationId)
      setShowModal(true)
    },
    []
  )

  const closeModal = useCallback(() => {
    setShowModal(false)
    setSelectedLocationId(null)
    setModalMode('add')
  }, [])

  /* ------------------------------------------------------------------------ */
  /* Date formatter                                                           */
  /* ------------------------------------------------------------------------ */

  const formattedDate = useCallback((dateString?: string) => {
    if (!dateString) {
      return '-'
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }

    return date.toLocaleDateString('en-US', options)
  }, [])

  /* ------------------------------------------------------------------------ */
  /* Columns                                                                  */
  /* ------------------------------------------------------------------------ */

  const columns = useMemo<ColumnDef<LocationData>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name'
      },

      {
        header: 'Address',
        accessorKey: 'address'
      },

      {
        header: 'Map drawn',
        accessorKey: 'shapeData',
        cell: props => (
          <ShapeDataCell
            value={props.getValue() as string | null | undefined}
          />
        )
      },

      {
        header: 'Notes',
        accessorKey: 'notes',
        cell: info => {
          const value = info.getValue()

          return (
            <div>{value && value !== 'undefined' ? String(value) : ''}</div>
          )
        }
      },

      {
        header: 'Status',
        accessorKey: 'status',

        cell: info => {
          const status = Boolean(info.getValue())

          return (
            <div
              className={`badge badge-light-${status ? 'success' : 'danger'}`}
            >
              {status ? 'Active' : 'Inactive'}
            </div>
          )
        }
      },

      {
        header: 'Created At',
        accessorKey: 'created_at',

        cell: info => (
          <div>{formattedDate(info.getValue() as string | undefined)}</div>
        )
      },

      {
        header: 'Actions',

        cell: info => {
          const location = info.row.original

          return (
            <div className='d-flex align-items-center'>
              {permissions.includes(5) && (
                <button
                  type='button'
                  className='btn btn-icon btn-active-light-primary w-30px h-30px me-3'
                  onClick={() => openModal('edit', location.id)}
                  title='Edit'
                >
                  <i className='ki ki-outline ki-pencil fs-3' />
                </button>
              )}

              <ToggleSwitchLocation
                status={location.status}
                locationId={location.id}
                updateLocationsList={updateLocationList}
              />
            </div>
          )
        }
      }
    ],
    [permissions, formattedDate, openModal, updateLocationList]
  )

  /* ------------------------------------------------------------------------ */
  /* React Table                                                              */
  /* ------------------------------------------------------------------------ */

  const table = useReactTable({
    data: locationData,
    columns,

    getCoreRowModel: getCoreRowModel(),

    getFilteredRowModel: getFilteredRowModel(),

    getPaginationRowModel: getPaginationRowModel(),

    state: {
      globalFilter
    },

    onGlobalFilterChange: setGlobalFilter,

    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)

      return String(value ?? '')
        .toLowerCase()
        .includes(String(filterValue ?? '').toLowerCase())
    }
  })

  /* ------------------------------------------------------------------------ */
  /* Session loading                                                          */
  /* ------------------------------------------------------------------------ */

  if (sessionStatus === 'loading') {
    return (
      <div className='p-5'>
        <Shadow header={5} val={5} />
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Not authenticated                                                        */
  /* ------------------------------------------------------------------------ */

  if (!session || !token) {
    return <div className='p-5'>Please wait...</div>
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <ToastContainer />

      <div className='listItems'>
        {/* ================================================================ */}
        {/* Header                                                           */}
        {/* ================================================================ */}

        <div className='topBar'>
          <div className='title'>
            <h2>Locations List</h2>

            <div className='path'>Dashboard Assets Location</div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Main                                                             */}
        {/* ================================================================ */}

        <div className='mainList'>
          <div className='row mt-3 card card-flush card-body pt-0'>
            {/* ============================================================ */}
            {/* Search / Add                                                  */}
            {/* ============================================================ */}

            <div className='searchBar'>
              <div className='search' id='search-container'>
                <input
                  type='text'
                  value={globalFilter || ''}
                  onChange={e => setGlobalFilter(e.target.value)}
                  placeholder='Search...'
                  className='form-control'
                />
              </div>

              {permissions.includes(4) && (
                <div className='btnGroup'>
                  <button
                    type='button'
                    onClick={() => openModal('add')}
                    className='btn-primary'
                  >
                    <i
                      className='ki-outline ki-plus-square fs-3 mr-2'
                      style={{
                        marginRight: '8px'
                      }}
                    />
                    Add Location
                  </button>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Table                                                         */}
            {/* ============================================================ */}

            <div className='dataTables_wrapper dt-bootstrap4 no-footer'>
              <div className='table-responsive'>
                {loading && !locationData.length ? (
                  <Shadow header={5} val={5} />
                ) : (
                  <table className='align-middle table-row-dashed fs-6 gy-5 mb-0 dataTable no-footer'>
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

                    <tbody>
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
                )}
              </div>

              {/* ========================================================== */}
              {/* Pagination                                                  */}
              {/* ========================================================== */}

              <div className='pagination d-flex align-items-center justify-content-between'>
                <div className='d-flex align-items-center'>
                  <div className='d-flex py-4'>
                    <select
                      className='form-select bg-gray-100 border-0'
                      value={table.getState().pagination.pageSize}
                      onChange={e => table.setPageSize(Number(e.target.value))}
                      style={{
                        width: 'auto',
                        display: 'inline-block'
                      }}
                    >
                      {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='ms-4 py-4'>
                    {(() => {
                      const pageSize = table.getState().pagination.pageSize

                      const pageIndex = table.getState().pagination.pageIndex

                      const totalRows = table.getFilteredRowModel().rows.length

                      if (totalRows === 0) {
                        return 'Showing 0 to 0 of 0 records'
                      }

                      const startRow = pageIndex * pageSize + 1

                      const endRow = Math.min(
                        (pageIndex + 1) * pageSize,
                        totalRows
                      )

                      return `Showing ${startRow} to ${endRow} of ${totalRows} records`
                    })()}
                  </div>
                </div>

                <nav aria-label='Table pagination'>
                  <ul className='pagination mb-0'>
                    {/* Previous */}
                    <li
                      className={`page-item ${
                        !table.getCanPreviousPage() ? 'disabled' : ''
                      }`}
                    >
                      <button
                        type='button'
                        className='page-link'
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <i className='fs-1 ki-left ki-outline' />
                      </button>
                    </li>

                    {/* Page numbers */}
                    {Array.from({
                      length: table.getPageCount()
                    }).map((_, index) => (
                      <li
                        key={index}
                        className={`page-item ${
                          table.getState().pagination.pageIndex === index
                            ? 'active p-0 btn-primary'
                            : ''
                        }`}
                      >
                        <button
                          type='button'
                          className={`page-link ${
                            table.getState().pagination.pageIndex === index
                              ? 'p-0 btn-primary text-white'
                              : ''
                          }`}
                          onClick={() => table.setPageIndex(index)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}

                    {/* Next */}
                    <li
                      className={`page-item ${
                        !table.getCanNextPage() ? 'disabled' : ''
                      }`}
                    >
                      <button
                        type='button'
                        className='page-link'
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        <i className='fs-1 ki-right ki-outline' />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Add/Edit Modal                                                   */}
        {/* ================================================================ */}

        {showModal && (
          <AddLocationModal
            id={selectedLocationId}
            open={showModal}
            close={closeModal}
            updatedLocationData={updateLocationList}
          />
        )}
      </div>
    </>
  )
}

export default LocationTable
