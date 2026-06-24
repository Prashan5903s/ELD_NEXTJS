'use client'

import React, {
  useMemo,
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  memo
} from 'react'

import Link from 'next/link'
import { debounce } from 'lodash'
import { DateTime } from 'luxon'
import { subDays } from 'date-fns' // Correctly import subDays from date-fns

import 'react-date-range/dist/styles.css' // main style file

import { useSession } from 'next-auth/react'
import Skeleton from 'react-loading-skeleton' // Import Skeleton

import 'react-date-range/dist/theme/default.css'

import { format, toZonedTime } from 'date-fns-tz'
import CoDriverModal from '@/Components/codriver'

import 'react-loading-skeleton/dist/skeleton.css' // Import Skeleton CSS
import 'react-loading-skeleton/dist/skeleton.css'

import { DateRangePicker } from 'react-date-range'
import { useJsApiLoader } from '@react-google-maps/api'

const LineChart = lazy(() => import('@/Components/GraphComponents/LineChart'))

export default function HoursOfService ({ params }) {

  const MemoizedLineChart = memo(LineChart)

  const [isDateOpen, setIsDateOpen] = useState(new Set())
  const [isDateKeyLoading, setDateKeyLoading] = useState(false)
  const [isAllOpen, setIsAllOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isGraphLoading, setGraphLoading] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const [isViolation, setIsViolation] = useState(false) // Example initialization
  const BackEND = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [datas, setData] = useState(null)
  const [graphDataMap, setGraphDataMap] = useState({}) // Store graph data by date key
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isHourOpen, setIsHourOpen] = useState(false)

  // Function to format a date as yyyy-mm-dd
  function formatDate (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const timeZone = 'America/Denver'

  const formatDates = date => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  }

  function formatTimes (todays) {
    const today = new Date(todays)

    const pastDate_range = new Date(today)
    pastDate_range.setDate(today.getDate() - 7)

    return pastDate_range
  }

  const getTodayInUSTimezone = () => {
    return DateTime.now().setZone(timeZone).startOf('day').toJSDate()
  }

  const today = getTodayInUSTimezone()

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(today),
      endDate: new Date(today),
      key: 'selection'
    }
  ])

  // Convert current UTC time to Salt Lake City time
  const todayInSaltLakeCity = toZonedTime(today, timeZone)

  // Subtract 7 days to get the past date in Salt Lake City timezone
  const pastDate = subDays(todayInSaltLakeCity, 7)

  // Get formatted dates for use in state
  const [date_start, setDateStart] = useState(formatDate(pastDate))
  const [date_end, setDateEnd] = useState(formatDate(todayInSaltLakeCity)) // Use `todayInSaltLakeCity` instead of `saltLakeCityTime`

  const startDateFormatted = formatDates(dateRange[0].startDate)
  const endDateFormatted = formatDates(dateRange[0].endDate)

  const MapKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY

  const libraries: ('places' | 'geometry' | 'drawing' | 'visualization')[] =
    useMemo(() => ['places', 'geometry', 'drawing'], [])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries, // Make sure 'places' is included or adjust as needed
    id: 'google-map-script',
    version: 'weekly'
  })

  interface User {

    token: string
    // Add other properties you expect in the user object
  }

  interface SessionData {

    user?: User
    // Add other properties you expect in the session data
  }

  const { data } = useSession() as { data?: SessionData }
  const token = data?.user?.token

  const driverId = datas && datas[0]['id']

  const findLocationFromLatLng = (lat, lng, index) => {
    // Check if lat and lng are valid numbers
    if (isNaN(lat) || isNaN(lng)) {
      // console.error(`Invalid latlng: (${lat}, ${lng})`);
      return
    }

    const geocoder = new google.maps.Geocoder()
    const latLng = new google.maps.LatLng(lat, lng)

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddresses(prev => ({
          ...prev,
          [index]: results[0].formatted_address
        }))
      } else {
        console.error(
          'Geocode was not successful for the following reason: ' + status
        )
      }
    })
  }

  const fetchDriverDetails = useCallback(
    debounce(async () => {
      setLoading(true)

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
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
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

  const fetchLogs = useCallback(
    debounce(async () => {
      if (!date_start || !date_end) return

      setLoading(true) // Ensure loading state is true when fetching logs
      setDateKeyLoading(false)
      try {
        const response = await fetch(
          `${BackEND}/driver/hos/details/${date_start}/${date_end}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        setDateKeyLoading(true)

        const result = await response.json()
        setLog(result)
        setIsAllOpen(false)
        setIsDateOpen(new Set())
      } catch (err) {
        setError(err.message)
      }
    }, 300), // Debounce time in milliseconds
    [date_start, date_end, BackEND, token]
  )

  // Use useEffect to call the debounced fetch function
  useEffect(() => {
    
    if (token) {

      fetchLogs()
    }
  }, [fetchLogs, token])

  const handleDropdown = () => {
    setDropdown(!dropdown)
  }

  const handleCollapseAll = () => {
    setIsAllOpen(false)
    setIsDateOpen(new Set())
  }

  const handleExpandAll = () => {

    const allIndexes = new Set(finalData.map((_, index) => index))
    setIsDateOpen(allIndexes)
    setIsAllOpen(true)
  }

  const [graphDatas, setGraphData] = useState({}) // Object to store data for each row

  const GraphData = useCallback(
    
    debounce(async (date, index) => {
      setLoading(true)
      try {
        const response = await fetch(`${BackEND}/chart/graph/data/${date}`, {
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

        if (result) {
          const logResult = result[0]
          const vehResult = result[1]

          if (result && result[0] && result[0].length > 0) {
            const stime = logResult[0][3]
            const etime = logResult[0][4]
            const vName = vehResult[0]['name']

            if (stime != '00:00') {
              logResult.unshift([
                1,
                1,
                'Off duty',
                '00:00',
                `${stime}`,
                `${vName}`
              ])
            }
          } else {
            logResult.push([1, 1, 'Off duty', '00:00', '24:00', 'abc'])
            vehResult.push({
              id: 1,
              name: 'abc',
              master_company_id: 22,
              master_id: 22,
              vin: ''
            })
          }
        }

        console.log({ [date]: result })

        // Use functional update to avoid overwriting existing data
        setGraphData(prev => ({ ...prev, [date]: result }))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 300), // Adjust the debounce delay as needed
    [token]
  )

  const handleToggleDate = async (index, date = null) => {
    const newExpandedRows = new Set(isDateOpen)

    if (newExpandedRows.has(index)) {
      // Remove index from expanded rows
      newExpandedRows.delete(index)
    } else {
      // Add index to expanded rows
      newExpandedRows.add(index)
    }

    setIsDateOpen(newExpandedRows)

    setIsAllOpen(newExpandedRows.size === finalData.length)

    if (newExpandedRows.has(index)) {
      if (date && !graphDatas[date]) {
        await GraphData(date, index)
      }
    }
  }

  const handleSelect = ranges => {
    const startDate = ranges.selection.startDate
    let endDate = ranges.selection.endDate

    // Get today's date to ensure no future date selection
    const today = new Date()

    // Limit the range to a maximum of 30 days from the start date
    const maxEndDate = new Date(startDate)
    maxEndDate.setDate(startDate.getDate() + 30)

    // Ensure the end date is not more than 30 days after the start date
    // and not after today's date
    if (endDate > maxEndDate) {
      endDate = maxEndDate
    }
    if (endDate > today) {
      endDate = today
    }

    // Update the date range state
    setDateRange([{ startDate, endDate, key: 'selection' }])

    // Update the displayed start and end dates
    setDateStart(formatDate(startDate))
    setDateEnd(formatDate(endDate))
    setDateKeyLoading(false)
    setOpen(false) // Close the date picker after selection
  }

  const toggleDatePicker = () => {
    setOpen(!open)
  }

  const [addresses, setAddresses] = useState({})

  useEffect(() => {
    if (isLoaded && window.google && Array.isArray(log)) {
      const geocoder = new window.google.maps.Geocoder()

      log.forEach(logEntry => {
        const dateKey = Object.keys(logEntry)[0]
        const startLoc = logEntry[dateKey][3]
        const endLoc = logEntry[dateKey][4]

        // Initialize address state for the current dateKey if not already present
        setAddresses(prevAddresses => ({
          ...prevAddresses,
          [dateKey]: {
            start: prevAddresses[dateKey]?.start || null,
            end: prevAddresses[dateKey]?.end || null
          }
        }))

        // Validate startLoc coordinates before geocoding
        if (
          Array.isArray(startLoc) &&
          startLoc.length === 2 &&
          typeof startLoc[0] === 'number' &&
          typeof startLoc[1] === 'number' &&
          !isNaN(startLoc[0]) &&
          !isNaN(startLoc[1])
        ) {
          const latLng = new window.google.maps.LatLng(startLoc[0], startLoc[1])
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
              setAddresses(prevAddresses => ({
                ...prevAddresses,
                [dateKey]: {
                  ...prevAddresses[dateKey],
                  start: results[0].formatted_address
                }
              }))
            } else {
              console.error('Geocoder failed for start location: ' + status)
            }
          })
        } else {
          // console.error("Invalid start location coordinates:", startLoc);
        }

        // Validate endLoc coordinates before geocoding
        if (
          Array.isArray(endLoc) &&
          endLoc.length === 2 &&
          typeof endLoc[0] === 'number' &&
          typeof endLoc[1] === 'number' &&
          !isNaN(endLoc[0]) &&
          !isNaN(endLoc[1])
        ) {
          const latLng = new window.google.maps.LatLng(endLoc[0], endLoc[1])
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
              setAddresses(prevAddresses => ({
                ...prevAddresses,
                [dateKey]: {
                  ...prevAddresses[dateKey],
                  end: results[0].formatted_address
                }
              }))
            } else {
              console.error('Geocoder failed for end location: ' + status)
            }
          })
        } else {
          // console.error("Invalid end location coordinates:", endLoc);
        }
      })
    }
  }, [isLoaded, log])

  const timeToSeconds = time => {
    if (!time) return 0 // Return 0 if time is undefined or null
    let parts = time.split(':')
    return +parts[0] * 3600 + +parts[1] * 60 + +parts[2]
  }

  const secondsToTime = seconds => {
    let hours = Math.floor(seconds / 3600)
    let minutes = Math.floor((seconds % 3600) / 60)
    let secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeDate = timestamp => {
    const date = new Date(timestamp)

    let hours = date.getUTCHours()
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = String(date.getUTCMonth() + 1).padStart(2, '0') // Months are zero-indexed
    const year = date.getUTCFullYear()

    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0')

    return `${formattedHours}:${minutes} ${ampm}`
  }

  var tableData =
    Array.isArray(log) && log.length > 0
      ? log.map(logEntry => {
          const dateKey = Object.keys(logEntry)[0]
          const entryData = logEntry[dateKey][0]
          const entryDatas = logEntry[dateKey]
          const startLoc = logEntry[dateKey][3]
          const endLoc = logEntry[dateKey][4]
          var dataEntry = logEntry[dateKey][2]

          function convertTo24HourFormat (time12h) {
            const [time, modifier] = time12h.split(' ')

            let [hours, minutes] = time.split(':')
            if (hours === '12') {
              hours = '00'
            }

            if (modifier === 'PM') {
              hours = (parseInt(hours, 10) + 12).toString() // Convert to string here
            }

            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
          }

          function calculateTimeDifference (startTime, endTime) {
            const start = new Date(`01/01/2000 ${startTime}`)
            const end = new Date(`01/01/2000 ${endTime}`)

            let diff = end.getTime() - start.getTime()

            if (diff < 0) {
              diff += 24 * 60 * 60 * 1000 // Handle crossing over midnight
            }

            const hours = Math.floor(diff / 1000 / 60 / 60)
            const minutes = Math.floor((diff / 1000 / 60) % 60)
            const seconds = Math.floor((diff / 1000) % 60)

            return `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          }

          if (dataEntry.length > 0) {
            var stime = dataEntry[0][4]
            var etime = '12:00 AM'
            const start24h = convertTo24HourFormat(stime)
            const end24h = convertTo24HourFormat(etime)

            const result = calculateTimeDifference(end24h, start24h)
            if (stime != '12:00 AM') {
              dataEntry.unshift([
                `${result}`,
                'Off duty',
                null,
                '......',
                '12:00 AM',
                `${stime}`,
                [],
                '....'
              ])
            }
          } else {
            dataEntry.push([
              '24:00:00',
              'Off duty',
              null,
              '......',
              '12:00 AM',
              '12:00 PM',
              [],
              '....'
            ])
          }

          var data_shift = []
          var data_cycle = []
          var data_break = []
          var data_drive = []

          var startAddress = addresses[dateKey]?.start || ''
          var endAddress = addresses[dateKey]?.end || ''

          let total_viol = '00:00:00'
          let shiftViol = '00:00:00'
          let cycViol = '00:00:00'
          let breakViol = '00:00:00'
          let driveViol = '00:00:00'

          let shiftData = entryData.Shift_data
          let cycleData = entryData.cycle_data
          let breakData = entryData.eight_hour_break_violation
          let driveData = entryData.driver_eleven_viol_data

          let totalSeconds = 0

          if (shiftData) {
            if (shiftData.length === 0) {
              shiftViol = '00:00:00'
            } else {
              shiftData.forEach(shft => {
                var time_start = formatTimeDate(shft.violation_startTime)
                var time_end = formatTimeDate(shft.violation_endTime)
                var reason = 'Shift Duty Limit'
                shiftViol = shft.violation_duration
                var shftTime = timeToSeconds(shiftViol)
                totalSeconds += shftTime
                data_shift.push([time_start, time_end, reason, shiftViol])
              })
            }
          } else {
            shiftViol = '00:00:00'
          }

          if (cycleData) {
            if (cycleData.length === 0) {
              cycViol = '00:00:00'
            } else {
              cycleData.forEach(cycl => {
                var start_times = formatTimeDate(cycl.violation_startTime)
                var end_times = formatTimeDate(cycl.violation_endTime)
                var reason = 'Cycle duty limit'
                cycViol = cycl.violation_duration
                var cyclTime = timeToSeconds(cycViol)
                totalSeconds += cyclTime
                data_cycle.push([start_times, end_times, reason, cycViol])
              })
            }
          } else {
            cycViol = '00:00:00'
          }

          if (breakData) {
            if (breakData.length === 0) {
              breakViol = '00:00:00'
            } else {
              breakData.forEach(breaks => {
                var start_times = formatTimeDate(breaks.violation_start_time)
                var end_times = formatTimeDate(breaks.violation_end_date)
                var reason = 'Eight hours break limit'
                breakViol = breaks.break_violation
                var breakTime = timeToSeconds(breakViol)
                totalSeconds += breakTime
                data_break.push([start_times, end_times, reason, breakViol])
              })
            }
          } else {
            breakViol = '00:00:00'
          }

          if (driveData) {
            if (driveData.length === 0) {
              driveViol = '00:00:00'
            } else {
              driveData.forEach(drives => {
                var start_timess = formatTimeDate(drives.drive_start_time)
                var end_timess = formatTimeDate(drives.drive_end_time)
                var reason = 'Drive shift limit'
                driveViol = drives.drive_violate
                var elevenTime = timeToSeconds(driveViol)
                totalSeconds += elevenTime
                data_drive.push([start_timess, end_timess, reason, driveViol])
              })
            }
          } else {
            driveViol = '00:00:00'
          }

          var data_total = [data_shift, data_cycle, data_break, data_drive]

          total_viol = secondsToTime(totalSeconds)

          return {
            logs: entryDatas,
            datas: dataEntry,
            total: data_total,
            date: dateKey,
            shift: entryData.total_shift_time || '00:00:00',
            driving: entryData.total_drive_time || '00:00:00',
            inViolation: total_viol || '00:00:00',
            from: startAddress,
            to: endAddress,
            details: entryData.details || '',
            Icon: entryData.Icon || '',
            path1: entryData.path1 || '',
            path2: entryData.path2 || '',
            path3: entryData.path3 || '',
            graphDatas: graphDataMap[dateKey] || ''
          }
        })
      : []

  const filteredData = tableData.filter(row => {
    const currentYear = new Date().getFullYear()
    const rowDate = new Date(`${row.date}, ${currentYear}`)
    return rowDate >= dateRange[0].startDate && rowDate <= dateRange[0].endDate
  })

  var finalData = filteredData.length > 0 ? filteredData : tableData

  const todays = new Date() // Current date
  const sixtyDaysAgo = new Date(todays)
  sixtyDaysAgo.setDate(todays.getDate() - 60) // 60 days ago

  useEffect(() => {
    if (log && graphDataMap && datas) {
      setIsDataLoading(true)
    }
  }, [log, graphDataMap, datas])

  const [activeModal, setActiveModal] = useState(null)

  const openModal = index => {
    setActiveModal(index)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  if (!isDataLoading) {
    return (
      <div className='container-fluid'>
        <Link
          href={`/dashboard/drivers/detail`}
          className='align-items-start flex-column btn btn-outline btn-outline btn-outline-muted btn-active-light-secondary'
        >
          <i className='ki-duotone ki-left'></i> Back
        </Link>
        <div className='d-flex justify-content-between'>
          <h3 className='align-items-start flex-column fs-2 fw-bold text-gray-800 mt-5'>
            Hours of Service Report -<Skeleton width={40} />
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              role='button'
              fill='currentColor'
              className='bi bi-star mb-2'
              viewBox='0 0 16 16'
              style={{ color: 'rgb(199 150 29)' }}
            >
              <path d='M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z' />
            </svg>
          </h3>
          <button
            className='btn btn-sm btn-icon btn-active-color-primary'
            data-kt-menu-trigger='click'
            data-kt-menu-placement='bottom-end'
          >
            <i className='ki-outline ki-dots-square fs-2'></i>
          </button>
        </div>

        <div className='border border-2 rounded mt-5'>
          <div
            style={{ flexWrap: 'wrap' }}
            className='d-flex justify-content-around'
          >
            <div className='p-5'>
              <p>Duty status</p>
              <Skeleton width={100} />
            </div>
            <div className='p-5'>
              <p>Time in current status</p>
              <Skeleton width={100} />
            </div>
            <div className='p-5'>
              <p>Vehicle Name</p>
              <Skeleton width={100} />
            </div>
            <div className='p-5'>
              <p>Time until break</p>
              <Skeleton width={100} />
            </div>
            <div className='p-5'>
              <p>Drive remaining</p>
              <Skeleton width={100} />
            </div>
            <div className='p-5'>
              <p>Shift remaining</p>
              <Skeleton width={100} />
            </div>
            <div className='p-5'>
              <p>Cycle remaining</p>
              <Skeleton width={100} />
            </div>
          </div>
        </div>

        <div className='border border-end-0 border-start-0 border-2 mt-5'>
          <div
            style={{ flexWrap: 'wrap' }}
            className='d-flex justify-content-between'
          >
            <div className='p-4'>
              <Skeleton width={200} />
            </div>

            <div className='text-end p-4 position-relative d-flex flex-row'>
              <Skeleton width={100} />
              <Skeleton width={100} />
            </div>
          </div>
        </div>

        <table className='mt-6 table gs-7 gy-7 gx-7 d-table'>
          <thead>
            <tr className='fs-7'>
              <th className='text-start'>DATE(PDT)</th>
              <th className='text-start'>SHIFT</th>
              <th className='text-start'>DRIVING</th>
              <th className='text-start'>IN VIOLATION</th>
              <th className='text-start'>FROM</th>
              <th className='text-start'>TO</th>
              <th className='text-start'>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(7)].map((_, index) => (
              <tr key={index}>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className='container-fluid'>
      <Link
        href={`/dashboard/drivers/detail`}
        className='align-items-start flex-column btn btn-outline btn-outline btn-outline-muted btn-active-light-secondary'
      >
        <i className='ki-duotone ki-left'></i> Back
      </Link>
      <div className='d-flex justify-content-between'>
        <h3 className='align-items-start flex-column fs-2 fw-bold text-gray-800 mt-5'>
          Hours of Service Report -{' '}
          <span className='border-bottom border-3 border-dark'>
            {datas && datas[0] && datas[0] ? datas[0].first_name : 'N/A'}{' '}
            {datas && datas[0] && datas[0] ? datas[0].last_name : 'N/A'}
          </span>{' '}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            role='button'
            fill='currentColor'
            className='bi bi-star mb-2'
            viewBox='0 0 16 16'
            style={{ color: 'rgb(199 150 29)' }}
          >
            <path d='M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z' />
          </svg>
        </h3>
        <button
          className='btn btn-sm btn-icon btn-active-color-primary'
          data-kt-menu-trigger='click'
          data-kt-menu-placement='bottom-end'
        >
          <i className='ki-outline ki-dots-square fs-2'></i>
        </button>
      </div>

      <div className='border border-2 rounded mt-5'>
        <div
          style={{ flexWrap: 'wrap' }}
          className='d-flex justify-content-around'
        >
          <div className='p-5'>
            <p>Duty status</p>
            <span className='badge text-bg-dark fs-5'>
              {datas && datas[5] && datas[5] ? datas[5] : 'Off duty'}
            </span>
          </div>
          <div className='p-5'>
            <p>Time in current status</p>
            <span className='fs-5 fw-semibold'>
              {datas && datas[2] && datas[2] ? datas[2] : '00:00:00'}
            </span>
          </div>
          <div className='p-5'>
            <p>Vehicle Name</p>
            <span className='fs-5 fw-semibold'>
              {datas && datas[1] && datas[1] ? datas[1].name : '.....'}
            </span>
          </div>
          <div className='p-5'>
            <p>Time until break</p>
            <span className='fs-5 fw-semibold'>
              {datas && datas[8] && datas[8] ? datas[8] : '00:00:00'}
            </span>
          </div>
          <div className='p-5'>
            <p>Drive remaining</p>
            <span className='fs-5 fw-semibold'>
              {datas && datas && datas[7] ? datas[7] : '00:00:00'}
            </span>
          </div>
          <div className='p-5'>
            <p>Shift remaining</p>
            <span className='fs-5 fw-semibold'>
              {datas && datas && datas[4] ? datas[4] : '00:00:00'}
            </span>
          </div>
          <div className='p-5'>
            <p>Cycle remaining</p>
            <span className='fs-5 fw-semibold'>
              {datas && datas && datas[6] ? datas[6] : '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      <div className='border border-end-0 border-start-0 border-2 mt-5'>
        <div
          style={{ flexWrap: 'wrap' }}
          className='d-flex justify-content-between'
        >
          <div className='p-4'>
            <input
              type='text'
              role='button'
              readOnly
              onClick={toggleDatePicker}
              value={`${startDateFormatted} - ${endDateFormatted}`}
              style={{
                padding: '10px',
                textAlign: 'center',
                border: '2px solid #ccc',
                borderRadius: '4px',
                width: '200px'
              }}
            />

            {open && (
              <div style={{ position: 'absolute', zIndex: 1000 }}>
                <DateRangePicker
                  ranges={dateRange}
                  onChange={handleSelect}
                  showSelectionPreview={true}
                  moveRangeOnFirstSelection={false}
                  maxDate={today}
                />
              </div>
            )}
          </div>

          <div className='d-flex align-items-center justify-content-center p-4'>
            {/* <div
              className="form-check form-switch form-check-reverse me-4"
              style={{ paddingRight: "16rem" }}
            >
              <label className="form-check-label">Show status details</label>
              <input
                className="form-check-input mt-1"
                type="checkbox"
                role="switch"
                id="flexSwitchCheckChecked"
              />
            </div> */}
            {/* <button
              className="btn btn-outline btn-outline-muted btn-active-light-secondary me-4"
              onClick={handleExpandAll}
            >
              Expand All
            </button> */}
            <button
              className='btn btn-outline btn-outline-muted btn-active-light-secondary'
              onClick={handleCollapseAll}
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>
      {isDateKeyLoading ? (
        <div className='table-responsive'>
          <table
            className='mt-6 table gs-7 gy-7 gx-7 d-table hoverable-table'
            style={{ verticalAlign: 'middle' }}
          >
            <thead>
              <tr className='fs-7'>
                <th className='text-center'>DATE</th>
                <th className='text-center'>SHIFT</th>
                <th className='text-center'>DRIVING</th>
                <th className='text-center'>IN VIOLATION</th>
                <th className='text-center'>FROM</th>
                <th className='text-center'>TO</th>
                <th className='text-center'>DETAILS</th>
                <th className='text-center align-middle'>Co Driver</th>
              </tr>
            </thead>

            <tbody>
              {finalData?.map((row, index) => (
                <React.Fragment key={index}>
                  <tr
                    className='custom-hover-bg-secondary'
                    role='button'
                    onClick={() => handleToggleDate(index, row.date)}
                  >
                    <td className='text-start fw-bolder'>
                      <i
                        className={`ki-duotone ${
                          isDateOpen.has(index) || isAllOpen
                            ? 'ki-up'
                            : 'ki-down'
                        } fs-5 me-2 fw-bolder`}
                      ></i>
                      {row.date}
                    </td>
                    <td className='text-center'>{row.shift}</td>
                    <td className='text-center'>{row.driving}</td>
                    <td
                      className={`text-center ${
                        row.inViolation !== '00:00:00' ? 'text-danger' : ''
                      }`}
                    >
                      {row.inViolation !== '00:00:00' ? (
                        <i className='ki-duotone me-2 align-middle alert-danger'>
                          <span className='badge bg-danger-subtle text-danger-emphasis fs-5'>
                            {row.inViolation}
                          </span>
                        </i>
                      ) : (
                        <i className='ki-duotone me-2 align-middle'>
                          <span className='fs-6'>{row.inViolation}</span>
                        </i>
                      )}
                    </td>
                    <td className='text-center'>
                      {row.logs ? row.logs[9] : '..........'}
                    </td>
                    <td className='text-center'>
                      {row.logs ? row.logs[10] : '..........'}
                    </td>
                    <td className='text-center'>
                      {row && (
                        <i
                          className={`ki-duotone ${row} me-2 align-middle alert-danger`}
                        >
                          <span className={`${row}`}></span>
                          <span className={`${row}`}></span>
                          <span className={`${row}`}></span>
                        </i>
                      )}
                      {row.details ? row.details : '.........'}
                    </td>
                    <td className='text-center align-middle btn-model-open'>
                      <button
                        className='btn btn-sm btn-icon btn-active-color-primary'
                        data-kt-menu-trigger='click'
                        data-kt-menu-placement='bottom-end'
                        onClick={e => {
                          e.stopPropagation()
                          openModal(row.date)
                        }}
                      >
                        <i className='ki-outline ki-dots-square fs-2'></i>
                      </button>
                    </td>
                  </tr>

                  {/* CoDriverModal OUTSIDE the table row */}
                  <CoDriverModal
                    activeModal={activeModal}
                    date={row.date}
                    closeModal={closeModal}
                    driverId={driverId}
                  />

                  {(isDateOpen.has(index) || isAllOpen) && (
                    <tr>
                      <td colSpan={8}>
                        {/* Expanded Row Content */}
                        <div className='border rounded-3 shadow'>
                          <div className='text-start m-5 fs-6'>
                            <div>
                              <span className='fw-medium'>
                                Carrier Name:{' '}
                                <span className='fw-normal'>
                                  {row.logs[1][3]?.career_name}
                                </span>
                              </span>
                            </div>
                            <div>
                              <span className='fw-medium'>
                                Carrier US DOT Number:{' '}
                                <span className='fw-normal'>
                                  {row.logs[1][3]?.carrer_us_dot_number}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className='separator my-5'></div>

                          <div className='text-start m-5 fs-6'>
                            <div>
                              <span className='fw-medium'>
                                Home Terminal Name:{' '}
                                <span className='fw-normal'>
                                  {row.logs[1][3]?.home_terminal_name}
                                </span>
                              </span>
                            </div>
                            <div>
                              <span className='fw-medium'>
                                Home Terminal Address:{' '}
                                <span className='fw-normal'>
                                  {row.logs[1][3]?.home_terminal?.name}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className='separator my-5'></div>

                          <div className='m-5'>
                            <div className='d-flex justify-content-between'>
                              <h3 className='align-items-start flex-column fs-2 fw-bold text-gray-800 mt-5'>
                                {row.logs[1][0]?.first_name}{' '}
                                {row.logs[1][0]?.last_name} -{' '}
                                <span>{row.date}</span>
                              </h3>
                            </div>

                            {graphDatas ? (
                              <Suspense fallback={<Skeleton height={200} />}>
                                <MemoizedLineChart
                                  params={graphDatas[row.date]}
                                />
                              </Suspense>
                            ) : (
                              <Skeleton height={200} width={180} />
                            )}

                            {/* Sub-table */}
                            <table className='mt-6 gs-7 gy-4 gx-9 border'>
                              <thead>
                                <tr className='fs-6 fw-bolder border-bottom'>
                                  <th className='text-center'>Time</th>
                                  <th className='text-center'>Duration</th>
                                  <th className='text-center'>Status</th>
                                  <th className='text-center'>Remark</th>
                                  <th className='text-center'>Vehicle</th>
                                  <th className='text-center'>Odometer</th>
                                  <th className='text-center'>Location</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row?.datas?.length > 0 ? (
                                  row.datas.map((datas, i) => {
                                    return (
                                      <tr className='fs-7' key={i}>
                                        <td className='text-center'>
                                          <span className='fs-6 fw-semibold'>
                                            {datas[4]} -
                                          </span>
                                          <div>
                                            <span>{datas[5]}</span>
                                          </div>
                                        </td>
                                        <td className='text-center'>
                                          {datas[0]}
                                        </td>
                                        <td className='text-center'>
                                          <span className='badge text-bg-dark fs-7'>
                                            {datas[1]}
                                          </span>
                                        </td>
                                        <td className='text-center'>
                                          {datas[2]}
                                        </td>
                                        <td className='text-center'>
                                          {datas[3]}
                                        </td>
                                        <td className='text-center'>
                                          {datas[7]}
                                        </td>
                                        <td className='text-center'>
                                          {datas[8] || '......'}
                                        </td>
                                      </tr>
                                    )
                                  })
                                ) : (
                                  <tr className='fs-7'>
                                    <td
                                      className='text-center fw-bold'
                                      colSpan={7}
                                    >
                                      No data present
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* HOS Violation Info */}
                            <div className='alert bg-danger-subtle d-flex align-items-center p-5 mb-10 mt-6'>
                              <div className='text-start'>
                                <i className='ki-duotone ki-information-5 me-2 align-middle alert-danger fs-1'>
                                  <span className='path1'></span>
                                  <span className='path2'></span>
                                  <span className='path3'></span>
                                </i>
                                <span className='mb-1 text-start fs-6 fw-bolder'>
                                  HOS Violation {row.inViolation}
                                </span>
                                {row?.total?.map((section, sectionIdx) =>
                                  section.map((datas, dataIdx) => (
                                    <div
                                      key={`${sectionIdx}-${dataIdx}`}
                                      className='ms-8 mt-2 fs-7'
                                    >
                                      <div className='border-bottom border-dark'>
                                        <span className='fw-medium'>
                                          {datas[0]} - {datas[1]} ({datas[3]})
                                        </span>
                                      </div>
                                      <div className='text-body-secondary'>
                                        <span>{datas[2]}</span>
                                      </div>
                                    </div>
                                  ))
                                ) || <p>No data available</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='table-responsive'>
          <table className='mt-6 table gs-7 gy-7 gx-7 d-table'>
            <thead>
              <tr className='fs-7'>
                <th className='text-start'>DATE(PDT)</th>
                <th className='text-start'>SHIFT</th>
                <th className='text-start'>DRIVING</th>
                <th className='text-start'>IN VIOLATION</th>
                <th className='text-start'>FROM</th>
                <th className='text-start'>TO</th>
                <th className='text-start'>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
              <tr>
                <td className='text-start fw-bolder'>
                  <Skeleton width={100} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start '>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
                <td className='text-start'>
                  <Skeleton width={200} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
