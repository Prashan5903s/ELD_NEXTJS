'use client'
import React, { useMemo, useRef, useState, useEffect } from 'react'

import dynamic from 'next/dynamic'

import styles from '../../styles/chart.module.css'

import { ApexOptions } from 'apexcharts'

import {
  calculateTimeDifference,
  calculateTimeDifferenceAndFormat,
  getClosestTime
} from './utils'

const GraphChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <p>Loading chart...</p>
})

function timeToSeconds (timeStr) {
  if (!timeStr) return 0
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

function secondsToTimeStr (totalSeconds) {
  totalSeconds = Math.max(0, Math.min(totalSeconds, 24 * 3600 - 1))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`
}

const seriesToTruckStatus = {
  0.5: { value: 1, name: 'On', color: 'yellow' },
  1.5: { value: 2, name: 'D', color: 'green' },
  2.5: { value: 3, name: 'SB', color: 'blue' },
  3.5: { value: 4, name: 'OFF', color: 'grey' }
}

function Chart ({ processedData, params = null, rawData }) {
  const xLabels = Array.from({ length: 1440 / 15 }, (_, i) => {
    const hours = String(Math.floor((i * 15) / 60)).padStart(2, '0')
    const minutes = String((i * 15) % 60).padStart(2, '0')
    const seconds = '00'

    return `${hours}:${minutes}:${seconds}`
  })

  const xAxis = []
  let cumulativeHours = 0
  let cumulativeMinutes = 0
  let cumulativeSeconds = 0

  processedData.forEach(point => {
    const totalHours = point.totalTime

    const hours = Math.floor(totalHours)
    const totalMinutes = (totalHours - hours) * 60
    const minutes = Math.floor(totalMinutes)
    const seconds = Math.round((totalMinutes - minutes) * 60)

    cumulativeHours += hours
    cumulativeMinutes += minutes
    cumulativeSeconds += seconds

    // Normalize seconds
    if (cumulativeSeconds >= 60) {
      cumulativeMinutes += Math.floor(cumulativeSeconds / 60)
      cumulativeSeconds %= 60
    }

    // Normalize minutes
    if (cumulativeMinutes >= 60) {
      cumulativeHours += Math.floor(cumulativeMinutes / 60)
      cumulativeMinutes %= 60
    }

    xAxis.push(
      `${String(cumulativeHours).padStart(2, '0')}:${String(
        cumulativeMinutes
      ).padStart(2, '0')}:${String(cumulativeSeconds).padStart(2, '0')}`
    )
  })

  const xData = ['00.00:00', ...xAxis]

  let fetchingEndStatus = 0

  if (processedData.length > 0) {
    const lastLine = processedData[processedData.length - 1]
    if (lastLine.status) {
      fetchingEndStatus = lastLine.status
    }
  }

  const yAxis = processedData.map(point => point.status)
  const yData = [...yAxis, fetchingEndStatus]

  // Map xData to indices in the 15-minute intervals array
  const mappedData = []

  for (let i = 0; i < xLabels.length; i++) {
    const bucketStart = i * 15
    const bucketEnd = bucketStart + 15

    let activeStatus = null

    for (let j = 0; j < rawData.length; j++) {
      const current = rawData[j]

      const next = rawData[j + 1]

      const start = timeToMinutes(current.stime)

      const end = next ? timeToMinutes(next.stime) : 24 * 60

      // Does this status overlap this bucket?
      if (end > bucketStart && start < bucketEnd) {
        activeStatus = current.status
      }
    }

    mappedData.push({
      x: xLabels[i],
      y: yProcessData(activeStatus ?? rawData[0].status)
    })
  }

  for (let i = 0; i < mappedData.length; i++) {
    if (!mappedData[i]) {
      mappedData[i] =
        i === 0
          ? {
              x: xLabels[i],
              y: yProcessData(rawData[0].status)
            }
          : {
              x: xLabels[i],
              y: mappedData[i - 1].y
            }
    }
  }

  // Handle the case where the first value might be null
  if (mappedData[0] === null) {
    mappedData[0] = { x: xLabels[0], y: 0 }
  }

  const filteredData = processedData[0].colorLineData
  const colorLineData = []

  filteredData.forEach(entry => {
    const stime = entry.stime
    const etime = entry.etime
    const color = entry.color

    if (!stime || !etime || !color) {
      console.error(`Invalid entry: ${JSON.stringify(entry)}`)
      return
    }

    try {
      const startColumn = timeToColumn(stime)
      const endColumn = timeToColumn(etime)

      let colorEntry = colorLineData.find(e => e.color === color)
      if (!colorEntry) {
        colorEntry = {
          color: color,
          colNums: []
        }
        colorLineData.push(colorEntry)
      }

      for (let i = startColumn; i < endColumn; i++) {
        if (!colorEntry.colNums.includes(i)) {
          colorEntry.colNums.push(i)
        }
      }
    } catch (error) {
      console.error(
        `Error processing entry with stime: ${stime}, etime: ${etime}, color: ${color}`,
        error.message
      )
    }
  })

  const formatTime = dateString => {
    const date = new Date(dateString)

    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    const seconds = date.getUTCSeconds()

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`
  }

  const processViolationData = (data, key) => {
    // Get today's date in the correct format (ISO string without time part)
    const today = new Date().toISOString().split('T')[0]

    return data.map(item => {
      switch (key) {
        case 'Shift_data':
          const startDate = new Date(item['violation_startTime'])

          const endDate = new Date(item['violation_endTime'])

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted = formatTime(item['violation_startTime'])
          const endTimeFormatted = formatTime(item['violation_endTime'])

          let isEndOfDay = false // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate instanceof Date && !isNaN(endDate.getTime())) {
            isEndOfDay =
              endDate.toISOString().startsWith(today) &&
              endDate.getUTCHours() === 23 &&
              endDate.getUTCMinutes() === 59
          }

          return {
            stime: startTimeFormatted,
            etime: isEndOfDay ? '24:00' : endTimeFormatted
          }

          // Your logic for 'Shift_data'

          break

        case 'eight_hour_break_violation':
          const startDate1 = new Date(item['violation_start_time'])

          const endDate1 = new Date(item['violation_end_date'])

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted1 = formatTime(item['violation_start_time'])

          const endTimeFormatted1 = formatTime(item['violation_end_date'])

          let isEndOfDay1 = false // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate1 instanceof Date && !isNaN(endDate1.getTime())) {
            isEndOfDay1 =
              endDate1.toISOString().startsWith(today) &&
              endDate1.getUTCHours() === 23 &&
              endDate1.getUTCMinutes() === 59
          }

          return {
            stime: startTimeFormatted1,
            etime: isEndOfDay1 ? '24:00' : endTimeFormatted1
          }

          break

        case 'driver_eleven_viol_data':
          const startDate2 = new Date(item['drive_start_time'])

          const endDate2 = new Date(item['drive_end_time'])

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted2 = formatTime(item['drive_start_time'])
          const endTimeFormatted2 = formatTime(item['drive_end_time'])

          let isEndOfDay2 = false // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate2 instanceof Date && !isNaN(endDate2.getTime())) {
            isEndOfDay2 =
              endDate2.toISOString().startsWith(today) &&
              endDate2.getUTCHours() === 23 &&
              endDate2.getUTCMinutes() === 59
          }

          return {
            stime: startTimeFormatted2,
            etime: isEndOfDay2 ? '24:00' : endTimeFormatted2
          }

        case 'cycle_data':
          const startDate3 = new Date(item['violation_startTime'])
          const endDate3 = new Date(item['violation_endTime'])

          // Format start and end times (Assuming formatTime is defined elsewhere)
          const startTimeFormatted3 = formatTime(item['violation_startTime'])
          const endTimeFormatted3 = formatTime(item['violation_endTime'])

          let isEndOfDay3 = false // Proper declaration and initialization

          // Determine if end time should be "24:00" for the end of the day
          if (endDate3 instanceof Date && !isNaN(endDate3.getTime())) {
            isEndOfDay3 =
              endDate3.toISOString().startsWith(today) &&
              endDate3.getUTCHours() === 23 &&
              endDate3.getUTCMinutes() === 59
          }

          return {
            stime: startTimeFormatted3,
            etime: isEndOfDay3 ? '24:00' : endTimeFormatted3
          }

          break

          break
        default:
          // Optional: handle other cases if needed
          break
      }
    })
  }

  const specificKeys = [
    'Shift_data',
    'cycle_data',
    'eight_hour_break_violation',
    'driver_eleven_viol_data'
  ]

  let overtimeRanges = []

  if (params['params'] && params['params'][2]) {
    specificKeys.forEach(key => {
      if (params['params'][2][key]) {
        overtimeRanges = overtimeRanges.concat(
          processViolationData(params['params'][2][key], key)
        )
      }
    })
  }

  overtimeRanges.sort((a, b) => a.stime.localeCompare(b.stime))

  const adjustedOvertimeRanges = adjustData(overtimeRanges)

  const xAnnotations = adjustedOvertimeRanges.map(range => ({
    x: new Date(`1970-01-01T${range.stime}`).getTime(),
    x2: new Date(`1970-01-01T${range.etime}`).getTime(),
    fillColor: '#FF4560',
    opacity: 0.3,
    borderColor: '#FF4560',
    borderWidth: 1
  }))

  const annotations = [
    {
      y: 0,
      y2: 1,
      borderColor: '#fefbe2',
      borderWidth: 0.5,
      fillColor: 'yellow',
      opacity: 0.1
    },
    {
      y: 1,
      y2: 2,
      borderColor: '#ddfeda',
      borderWidth: 0.5,
      fillColor: 'green',
      opacity: 0.1
    }
  ]

  const series = [
    {
      name: '',
      data: rawData.flatMap(item => [
        {
          x: new Date(`1970-01-01T${item.stime}`).getTime(),
          y: yProcessData(item.status)
        },
        {
          x: new Date(`1970-01-01T${item.etime}`).getTime(),
          y: yProcessData(item.status)
        }
      ])
    }
  ]

  // ---- Custom hover-driven tooltip state (replaces reliance on Apex's dataPointIndex snapping) ----
  const chartWrapperRef = useRef(null)
  const [hoverInfo, setHoverInfo] = useState(null) // { x, y, timeInterval, statusMeta }
  const AXIS_START_SECONDS = 0
  const AXIS_END_SECONDS = 24 * 3600 - 1 // matches xaxis min/max below

  const findStatusAtTime = timeStr => {
    const t = timeToSeconds(timeStr)

    for (let i = 0; i < rawData.length; i++) {
      const s = timeToSeconds(rawData[i].stime)
      const e = timeToSeconds(rawData[i].etime)
      if (t >= s && t < e) {
        return rawData[i]
      }
    }
    // fallback to last interval if hovering exactly at/after the last etime
    if (rawData.length > 0) {
      const last = rawData[rawData.length - 1]
      if (t >= timeToSeconds(last.etime)) {
        return last
      }
    }
    return null
  }

  const handleMouseMove = e => {
    const wrapper = chartWrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    // If cursor is outside the wrapper's actual box, clear tooltip and bail
    if (
      offsetX < 0 ||
      offsetX > rect.width ||
      offsetY < 0 ||
      offsetY > rect.height
    ) {
      setHoverInfo(null)
      return
    }

    const ratio = Math.min(Math.max(offsetX / rect.width, 0), 1)
    const hoveredSeconds =
      AXIS_START_SECONDS + ratio * (AXIS_END_SECONDS - AXIS_START_SECONDS)
    const hoveredTimeStr = secondsToTimeStr(hoveredSeconds)

    const matched = findStatusAtTime(hoveredTimeStr)

    if (!matched) {
      setHoverInfo(null)
      return
    }

    const yVal = yProcessData(matched.status)
    const statusMeta = seriesToTruckStatus[yVal]

    setHoverInfo({
      clientX: e.clientX,
      clientY: e.clientY,
      timeInterval: matched,
      statusMeta
    })
  }

  const handleMouseLeave = () => {
    setHoverInfo(null)
  }

  // Safety net: clear tooltip if mouse leaves the browser window/document entirely,
  // or if pointer moves fast enough that mouseleave on the wrapper never fires.
  useEffect(() => {
    const handleGlobalMouseMove = e => {
      const wrapper = chartWrapperRef.current
      if (!wrapper) return

      const rect = wrapper.getBoundingClientRect()
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (!isInside) {
        setHoverInfo(null)
      }
    }

    const handleWindowBlur = () => setHoverInfo(null)

    document.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseout', handleWindowBlur)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseout', handleWindowBlur)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [])

  const options: ApexOptions = {
    tooltip: {
      enabled: false // disabled: replaced by custom absolutely-positioned tooltip driven by mousemove
    },
    chart: {
      zoom: {
        enabled: false
      },
      animations: {
        speed: 100,
        enabled: false,
        easing: 'linear'
      },
      foreColor: '#333',
      dropShadow: {
        enabled: false
      },
      type: 'line',
      toolbar: {
        show: false
      },
      redrawOnParentResize: true
    },

    stroke: {
      width: 3,
      curve: 'stepline',
      lineCap: 'butt',
      dashArray: 0,
      colors: ['#000000']
    },
    colors: ['#000000'],
    xaxis: {
      type: 'datetime',
      min: new Date('1970-01-01T00:00:00').getTime(),
      max: new Date('1970-01-01T23:59:59').getTime(),
      tickAmount: 24,
      position: 'top',

      labels: {
        datetimeUTC: false,
        format: 'HH:mm'
      }
    },
    markers: {
      size: 0
    },
    yaxis: {
      tickAmount: 4,
      min: 0,
      max: 4,
      labels: {
        formatter: function (value) {
          return typeof value === 'number' ? value.toFixed(0) : value // Check if value is a number
        }
      }
    },
    grid: {
      show: false,
      borderColor: '#90A4AE',
      strokeDashArray: 0,
      position: 'back',
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      }
    },
    annotations: {
      yaxis: annotations.map(anno => ({
        y: anno.y,
        y2: anno.y2,
        borderColor: anno.borderColor,
        borderWidth: anno.borderWidth,
        fillColor: anno.fillColor,
        opacity: anno.opacity
      })),
      xaxis: xAnnotations.map(anno => ({
        x: anno.x,
        x2: anno.x2,
        borderColor: anno.borderColor,
        borderWidth: anno.borderWidth,
        fillColor: anno.fillColor,
        opacity: anno.opacity
      }))
    }
  }

  const colorMap = useMemo(() => {
    const map = {}

    colorLineData.forEach(truck => {
      truck.colNums.forEach(col => {
        map[col] = truck.color
      })
    })

    return map
  }, [colorLineData])

  return (
    <div className={styles.apexChartmain}>
      <div
        className={`${styles.container1}`}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <div
          ref={chartWrapperRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`${styles.backgroundDiv}`}
          style={{
            position: 'absolute',
            top: 0,
            left: '0px',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            zIndex: 1
          }}
        >
          <GraphChart
            className={styles.section + ' ' + styles.apexCharts}
            options={options}
            series={series}
            type='line'
            height='100%'
            width='100%'
          />
        </div>

        {hoverInfo && hoverInfo.timeInterval && (
          <div
            style={{
              position: 'fixed',
              left: hoverInfo.clientX + 12,
              top: hoverInfo.clientY - 60,
              background: 'white',
              padding: '10px 12px',
              textAlign: 'center',
              zIndex: 9999,
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
              minWidth: '160px'
            }}
            className='custom-tooltip'
          >
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <strong
                style={{
                  backgroundColor: hoverInfo.statusMeta?.color,
                  display: 'block',
                  width: '30px',
                  borderRadius: '2px',
                  color:
                    hoverInfo.statusMeta?.color === 'yellow' ? '#000' : '#fff',
                  fontSize: '11px',
                  padding: '1px 0'
                }}
              >
                {hoverInfo.statusMeta?.name}
              </strong>
              <strong style={{ display: 'block' }}>
                {hoverInfo.timeInterval.stime} - {hoverInfo.timeInterval.etime}
              </strong>
            </div>
            <div>
              <p style={{ margin: '4px 0 0' }}>
                {calculateTimeDifferenceAndFormat(
                  hoverInfo.timeInterval.stime,
                  hoverInfo.timeInterval.etime
                )}
              </p>
            </div>
            {hoverInfo.timeInterval.truckDetails?.[0]?.text &&
              hoverInfo.timeInterval.truckDetails[0].text !== 'abc' && (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  {hoverInfo.timeInterval.truckDetails[0].text}
                </div>
              )}
          </div>
        )}

        <div className={`${styles.foregroundHead}`}>
          <h5>M</h5> <h6>1</h6> <h6>2</h6> <h6>3</h6> <h6>4</h6> <h6>5</h6>{' '}
          <h6>6</h6> <h6>7</h6> <h6>8</h6> <h6>9</h6> <h6>10</h6> <h6>11</h6>
          <h5>N</h5> <h6>1</h6> <h6>2</h6> <h6>3</h6> <h6>4</h6> <h6>5</h6>{' '}
          <h6>6</h6> <h6>7</h6> <h6>8</h6> <h6>9</h6> <h6>10</h6> <h5>M</h5>
        </div>
        <div className={`${styles.foregroundDiv}`}>
          <table>
            <tbody>
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 96 }).map((_, colIndex) => {
                    const color = colorMap[colIndex]

                    const heights = ['100%', '10%', '15%', '10%']

                    return (
                      <td
                        key={colIndex}
                        style={{
                          padding: '0px',
                          position: 'relative',
                          height: '10%',
                          borderBottom:
                            color && rowIndex === 3
                              ? `10px solid ${color}`
                              : '0px'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: heights[colIndex % 4],
                            borderLeft:
                              colIndex % 4 === 0
                                ? '1px solid lightgrey'
                                : '1px solid grey',
                            borderBottom:
                              color && rowIndex === 3
                                ? `4px solid ${color}`
                                : '1px solid grey'
                          }}
                        />
                        {colIndex === 95 && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderRight: '1px solid lightgrey'
                            }}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function yProcessData (data) {
  const valueMap = {
    1: 0.5, // 1 or ON
    ON: 0.5,
    2: 1.5, // 2 or D
    D: 1.5,
    3: 2.5, // 3 or SB
    SB: 2.5,
    4: 3.5, // 4 or Off
    Off: 3.5
  }
  return valueMap[data] !== undefined ? valueMap[data] : null
}

function timeToColumn (time) {
  if (!time || typeof time !== 'string') {
    throw new Error(`Invalid time format: ${time}`)
  }

  const [hours = 0, minutes = 0] = time.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`)
  }

  return hours * 4 + Math.floor(minutes / 15)
}

const roundToNearest15 = minutes => Math.round(minutes / 15) * 15

const timeToMinutes = time => {
  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number)

  return hours * 60 + minutes + seconds / 60
}

const minutesToTime = totalMinutes => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  const seconds = Math.round((totalMinutes % 1) * 60)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`
}

const adjustData = data => {
  let previousEndTime = 0
  const MAX_TIME = 23 * 60 + 45

  return data.map(item => {
    let start = roundToNearest15(timeToMinutes(item.stime))
    let end = roundToNearest15(timeToMinutes(item.etime))

    start = Math.max(start, previousEndTime)

    end = Math.max(end, start + 15)
    end = Math.min(end, MAX_TIME)

    previousEndTime = end

    return {
      ...item,
      stime: minutesToTime(start),
      etime: minutesToTime(end)
    }
  })
}

export default Chart
