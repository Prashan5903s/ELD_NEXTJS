export const getClosestTime = (data, targetTime, status) => {
  function timeToMinutes (timeStr) {
    if (!timeStr) return 0 // handle null or undefined input
    const [hours = 0, minutes = 0] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const targetInMinutes = timeToMinutes(targetTime)

  let closestObject = null
  let closestIndex = -1

  data.forEach((item, index) => {
    const stimeInMinutes = timeToMinutes(item.stime)
    const etimeInMinutes = timeToMinutes(item.etime)

    if (stimeInMinutes <= targetInMinutes && targetInMinutes < etimeInMinutes) {
      closestObject = item
      closestIndex = index
    }
  })

  if (closestObject && closestObject.status === status) {
    return closestObject
  }

  if (closestIndex !== -1) {
    if (closestIndex > 0) {
      const prevObject = data[closestIndex - 1]
      if (prevObject.status === status) {
        return prevObject
      }
    }

    if (closestIndex < data.length - 1) {
      const nextObject = data[closestIndex + 1]
      if (nextObject.status === status) {
        return nextObject
      }
    }
  }

  return null
}

export const parseTime = time => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes // Return the time in minutes
}

export const formatTimeM = minutes => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

export const calculateTimeDifference = (stime, etime) => {
  const start = parseTime(stime)
  const end = parseTime(etime)
  const difference = end - start
  return formatTimeM(difference)
}

export const roundUpTimeToNext15 = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)

  // Round the minutes to the next 15 minute mark
  const roundedMinutes = Math.ceil(minutes / 15) * 15

  // If minutes >= 60, adjust the hours
  const newHours = roundedMinutes === 60 ? hours + 1 : hours
  const newMinutes = roundedMinutes === 60 ? 0 : roundedMinutes

  // Adjust for 24-hour format if needed
  const adjustedHours = newHours >= 24 ? 23 : newHours
  const adjustedMinutes = newHours >= 24 ? 59 : newMinutes

  // Return the formatted time in "HH:MM" format
  return `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes
    .toString()
    .padStart(2, '0')}`
}

export const processTimeData = data => {
  return data.map(item => {
    // Adjust stime and etime to the nearest 15-minute mark
    let adjustedStime = roundUpTimeToNext15(item.stime)
    let adjustedEtime = roundUpTimeToNext15(item.etime)

    // Ensure stime and etime are not the same
    if (adjustedStime === adjustedEtime) {
      // If they are the same, increment etime by 15 minutes
      const [hours, minutes] = adjustedEtime.split(':').map(Number)
      const newTime = new Date()
      newTime.setHours(hours)
      newTime.setMinutes(minutes + 15)

      adjustedEtime = `${newTime
        .getHours()
        .toString()
        .padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`

      // Ensure the new etime is still rounded to the nearest 15-minute mark
      adjustedEtime = roundUpTimeToNext15(adjustedEtime)
    }

    return {
      ...item,
      stime: adjustedStime,
      etime: adjustedEtime
    }
  })
}

export const calculateTimeDifferenceAndFormat = (stime, etime) => {
  // Convert a time string (e.g., "08:44") into minutes
  function timeToMinutes (timeStr) {
    if (!timeStr) return 0 // handle null or undefined input
    const [hours = 0, minutes = 0] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Convert both stime and etime to minutes
  const stimeInMinutes = timeToMinutes(stime)
  const etimeInMinutes = timeToMinutes(etime)

  // Calculate the difference in minutes
  let diffInMinutes = etimeInMinutes - stimeInMinutes

  // If etime is after midnight (00:00), handle day wrap-around
  if (diffInMinutes < 0) {
    diffInMinutes += 24 * 60 // Add 24 hours worth of minutes
  }

  // Convert the difference into hours and minutes
  const hours = Math.floor(diffInMinutes / 60)
  const minutes = diffInMinutes % 60

  // Format the result
  const hoursPart = hours > 0 ? `${hours}h` : ''
  const minutesPart = minutes > 0 ? `${minutes}m` : ''

  // Join the parts together
  return `${hoursPart} ${minutesPart}`.trim()
}
