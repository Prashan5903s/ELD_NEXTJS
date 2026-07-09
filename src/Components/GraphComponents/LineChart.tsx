'use client'
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import styles from '../../styles/linechart.module.css'
import GraphLabels from './GraphLabels'
import TimeFields from './TimeFields'
import { calculateTimeDifference, parseTime, processTimeData } from './utils'

const LazyChart = lazy(() => import('./Chart'))

function LineChart (params = null) {
  const [val, setVal] = useState<any>([])

  useEffect(() => {
    setVal(params)
  }, [params])

  // Helper function to convert a name to a slug
  const convertToSlug = name => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading or trailing hyphens
  }

  // Helper function to generate a random color
  const colorNames = [
    'Pink',
    'Violet',
    'Magenta',
    'Orange',
    'Purple',
    'Brown',
    'Gray',
    'Black',
    'Lime',
    'Teal',
    'Olive',
    'Maroon',
    'Navy',
    'Silver',
    'Gold'
  ]

  const generateRandomColorName = () => {
    const randomIndex = Math.floor(Math.random() * colorNames.length)
    return colorNames[randomIndex]
  }

  // Ensure `val['params'][1]` exists before mapping
  const mappedData =
    val['params'] && val['params'][1]
      ? val['params'][1].map((data, index) => {
          let colors = colorNames[index]

          const slug = convertToSlug(data.name)
          return {
            [slug]: [{ color: colors, text: data.name }]
          }
        })
      : []

  const rawData = []

  if (val?.params?.[0]) {
    val.params[0].forEach(item => {
      let mapI = 0

      switch (item[1]) {
        case 1:
        case 5:
          mapI = 4 // OFF
          break

        case 3:
          mapI = 2 // Driving
          break

        case 2:
          mapI = 3 // SB
          break

        case 4:
        case 6:
          mapI = 1 // ON
          break
      }

      const truckDetails = mappedData
        ? mappedData.find(data => data[convertToSlug(item[5])])
        : null

      const newItem = {
        status: mapI,
        stime: item[3],
        etime: item[4],
        time: '',
        truckDetails: [truckDetails?.[convertToSlug(item[5])]?.[0]]
      }

      const existing = rawData.find(
        r => r.stime === newItem.stime && r.etime === newItem.etime
      )

      if (!existing) {
        rawData.push(newItem)
      } else {
        // Choose which status should win if duplicate intervals exist.
        // Example: keep Driving over OFF.
        if (newItem.status === 2) {
          existing.status = 2
        }
      }
    })
  }

  let data = rawData.map(item => ({
    ...item,
    time: calculateTimeDifference(item.stime, item.etime)
  }))

  const colorLineData = []

  data.forEach(entry => {
    const stime = entry.stime
    const etime = entry.etime
    const status = entry.status
    const color = entry.truckDetails[0].color
    colorLineData.push({
      stime: stime,
      etime: etime,
      status: status,
      color: color
    })
  })

  const groupDataByTruck = data => {
    const truckMap = new Map()

    data.forEach(entry => {
      const truckNumber =
        Array.isArray(entry.truckDetails) && entry.truckDetails.length > 0
          ? entry.truckDetails[0]?.text || null
          : null

      const truckColor =
        Array.isArray(entry.truckDetails) && entry.truckDetails.length > 0
          ? entry.truckDetails[0]?.color
          : null

      const truckStatus = entry.status
      const hours = parseTime(entry.time) / 60 // Convert minutes to hours

      if (!truckMap.has(truckNumber)) {
        truckMap.set(truckNumber, {
          truckNumber,
          truckColor,
          totalHours: 0,
          statusHours: {}
        })
      }

      const truckData = truckMap.get(truckNumber)
      truckData.totalHours += hours
      truckData.statusHours[truckStatus] =
        (truckData.statusHours[truckStatus] || 0) + hours
    })

    return Array.from(truckMap.values())
  }

  const transformedData = groupDataByTruck(data)

  const processedData = processedRawData(data, transformedData, colorLineData)

  const timeMap = () => {
    let timeMapData =
      val['params'] && val['params'][0]
        ? val['params'][0].map(item => {
            // Initialize mapI
            let mapI = 0 // Default value

            // Set mapI based on the condition
            if (item[1] === 1 || item[1] === 5) {
              mapI = 4
            } else if (item[1] === 3) {
              mapI = 2
            } else if (item[1] === 4 || item[1] === 6) {
              mapI = 1
            } else if (item[1] === 2) {
              mapI = 3
            }

            // Determine truckDetails based on slug
            const slug = convertToSlug(item[5])
            const truckDetails = mappedData?.find(data => data[slug]) || null

            // Ensure truckDetails exists and has data before accessing
            const truckDetailItem =
              truckDetails && truckDetails[slug] ? truckDetails[slug][0] : null

            // Return the object with the computed status
            return {
              status: mapI,
              stime: item[3],
              etime: item[4],
              time: '',
              truckDetails: truckDetailItem ? [truckDetailItem] : []
            }
          })
        : []

    timeMapData.forEach(entry => {
      const diff = calculateTimeDifference(entry.stime, entry.etime)

      entry.time = diff
    })

    console.log('timeMapData', timeMapData)

    return calculateTime(timeMapData)
  }

  const totalTime = calculateTotalTime(timeMap())

  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const checkWidth = () => {
        if (container.offsetWidth >= 100) {
          container.classList.add(styles.smallWidth)
        } else {
          container.classList.remove(styles.smallWidth)
        }
      }

      checkWidth()

      window.addEventListener('resize', checkWidth)

      return () => {
        window.removeEventListener('resize', checkWidth)
      }
    }
  }, [])

  return (
    <div className={`${styles.linechartContainer}`}>
      <div
        className={`${styles.graphcontainer}`}
        style={{ display: 'flex', gap: '0', flex: '1' }}
      >
        <div ref={containerRef} className={`${styles.graphclass}`} style={{}}>
          <GraphLabels />
          <Suspense fallback={<div>Loading Chart...</div>}>
            {processedData.length && (
              <LazyChart
                processedData={processedData}
                params={params}
                rawData={rawData}
              />
            )}
          </Suspense>
          <TimeFields timeMap={timeMap()} />
        </div>
      </div>

      <div
        className={`${styles.truckColumn}`}
        style={{
          flex: '1',
          display: 'flex',
          gap: '0',
          padding: '0px 20px 30px 30px',
          minHeight: '2%',
          width: '100%'
        }}
      >
        {transformedData.map((detail, index) =>
          detail.truckNumber != 'abc' && detail.truckNumber !== '' ? (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '15px',
                width: '95%'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  paddingBottom: '30px'
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: detail.truckColor,
                    margin: '0px 5px 5px 0px'
                  }}
                ></div>
                <p style={{ margin: '0', textAlign: 'center' }}>
                  {detail.truckNumber}
                </p>
              </div>
            </div>
          ) : (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '15px',
                width: '95%'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  paddingBottom: '30px'
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'white',
                    margin: '0px 5px 5px 0px'
                  }}
                ></div>
                <p style={{ margin: '0', textAlign: 'center' }}></p>
              </div>
            </div>
          )
        )}
        {transformedData.length == 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '15px',
              width: '95%'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingBottom: '30px'
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'white',
                  margin: '0px 5px 5px 0px'
                }}
              ></div>
              <p style={{ margin: '0', textAlign: 'center' }}></p>
            </div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'right',
            height: '15px',
            width: '15%'
          }}
        >
          <div
            style={{
              flex: '1',
              display: 'flex',
              justifyContent: 'right',
              alignItems: 'flex-end',
              paddingBottom: '28px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'right'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'right',
                  alignItems: 'flex-end',
                  paddingBottom: '30px'
                }}
              >
                <p style={{ margin: '0', textAlign: 'right' }}>{totalTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const processedRawData = (data, transformedData, colorLineData) => {
  return data.map(item => {
    const [hours = 0, minutes = 0, seconds = 0] = item.time
      .split(':')
      .map(Number)

    const totalTime = Number(hours + minutes / 60 + seconds / 3600)

    return {
      totalTime,
      status: item.status,
      singleTruckDetails: item.truckDetails,
      truckDetails: [transformedData],
      colorLineData
    }
  })
}

//Time Calculations on the Right
function calculateTime (data) {
  const timeMap = {
    1: 0,
    2: 0,
    3: 0,
    4: 0
  }

  data.forEach(({ status, time }) => {
    const [hours, minutes, seconds] = time.split(':').map(Number)

    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    if (timeMap[status] !== undefined) {
      timeMap[status] += totalSeconds
    }
  })

  Object.keys(timeMap).forEach(status => {
    const totalSeconds = timeMap[status]

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    timeMap[status] = `${String(hours).padStart(2, '0')}:${String(
      minutes
    ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  return timeMap
}
function calculateTotalTime (timeMap) {
  let totalSeconds = 0
  Object.values(timeMap).map((entry: string) => {
    const [hours, minutes, seconds] = entry.split(':').map(Number)
    totalSeconds += hours * 3600 + minutes * 60 + seconds
  })

  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)
  const totalSecs = totalSeconds % 60
  return `${totalHours}:${
    totalMinutes < 10 ? '0' + totalMinutes : totalMinutes
  }:${totalSecs < 10 ? '0' + totalSecs : totalSecs}`
}

//Time Formats

export default LineChart
