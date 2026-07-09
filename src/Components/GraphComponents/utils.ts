export const getClosestTime = (data, targetTime, status) => {
  function timeToSeconds (timeStr) {
    if (!timeStr) return 0
    const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number)

    return hours * 3600 + minutes * 60 + seconds
  }

  const targetInSeconds = timeToSeconds(targetTime)

  let closestObject = null
  let closestIndex = -1

  data.forEach((item, index) => {
    const stimeInSeconds = timeToSeconds(item.stime)
    const etimeInSeconds = timeToSeconds(item.etime)

    if (stimeInSeconds <= targetInSeconds && targetInSeconds < etimeInSeconds) {
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
  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number)

  return hours * 3600 + minutes * 60 + seconds
}

const parseTimeDiffrence = time => {
  const [h, m, s] = time.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

export const formatTimeM = totalSeconds => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

const formatTime = seconds => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const calculateTimeDifference = (stime, etime) => {
  const start = parseTimeDiffrence(stime)
  const end = parseTimeDiffrence(etime)

  let difference = end - start

  if (difference < 0) {
    difference += 24 * 60 * 60
  }

  return formatTime(difference)
}

export const roundUpTimeToNext15 = (time: string): string => {
  let [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number)

  // If seconds exist, move to the next minute first
  if (seconds > 0) {
    minutes += 1
    seconds = 0
  }

  // Round minutes up to next 15-minute mark
  let roundedMinutes = Math.ceil(minutes / 15) * 15

  if (roundedMinutes >= 60) {
    hours += Math.floor(roundedMinutes / 60)
    roundedMinutes %= 60
  }

  if (hours >= 24) {
    hours = 23
    roundedMinutes = 59
    seconds = 59
  }

  return `${hours.toString().padStart(2, '0')}:${roundedMinutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const processTimeData = data => {
  const rounded = data.map(item => ({
    ...item,
    stime: roundUpTimeToNext15(item.stime),
    etime: roundUpTimeToNext15(item.etime)
  }))

  const result = []

  rounded.forEach(item => {
    const last = result[result.length - 1]

    if (
      last &&
      last.status === item.status &&
      last.stime === item.stime &&
      last.etime === item.etime
    ) {
      return
    }

    result.push({
      ...item,
      time: calculateTimeDifference(item.stime, item.etime)
    })
  })

  return result
}

export const calculateTimeDifferenceAndFormat = (stime, etime) => {
  function timeToSeconds (timeStr) {
    if (!timeStr) return 0

    const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number)

    return hours * 3600 + minutes * 60 + seconds
  }

  const stimeInSeconds = timeToSeconds(stime)
  const etimeInSeconds = timeToSeconds(etime)

  let diffInSeconds = etimeInSeconds - stimeInSeconds

  if (diffInSeconds < 0) {
    diffInSeconds += 24 * 3600
  }

  const hours = Math.floor(diffInSeconds / 3600)
  const minutes = Math.floor((diffInSeconds % 3600) / 60)
  const seconds = diffInSeconds % 60

  const parts = []

  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (seconds) parts.push(`${seconds}s`)

  return parts.length ? parts.join(' ') : '0s'
}
