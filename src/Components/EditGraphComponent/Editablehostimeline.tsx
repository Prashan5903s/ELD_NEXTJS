'use client'
import React, { useRef, useState } from 'react'

/**
 * Editable HOS duty-status timeline.
 *
 * Two interactions, matching the two things you asked for:
 *  1. Drag the vertical "line" at a boundary left/right  -> changes the TIME a duty
 *     status changed (resizes the two segments that share that boundary).
 *  2. Pick up a duty block and drag it up/down onto a different status row -> changes
 *     the STATUS of that block (e.g. move a chunk from "Driving" into "On Duty"),
 *     keeping its time span the same.
 *
 * ApexCharts has no built-in support for either, so this renders its own
 * lightweight Gantt-style lanes (one lane per duty status) instead of relying
 * on the chart library for the editable view. The read-only ApexChart-based
 * <Chart /> is untouched and still used wherever editing isn't needed.
 */

export type DutyStatus = 1 | 2 | 3 | 4 // 1=ON duty, 2=Driving, 3=Sleeper Berth, 4=Off duty

export interface DutySegment {
  id: string
  status: DutyStatus
  stime: string // "HH:MM", 00:00 - 24:00
  etime: string // "HH:MM", 00:00 - 24:00
  truckDetails?: any[]
}

interface EditableHosTimelineProps {
  segments: DutySegment[]
  onChange: (segments: DutySegment[]) => void
  readOnly?: boolean
}

const TOTAL_COLUMNS = 96 // 24h * 4 (15-minute slots), same grid the rest of the app uses
const MIN_SEGMENT_COLUMNS = 1 // 15 minutes minimum length for any segment

// Row 0 (top) -> status 4 (OFF) ... Row 3 (bottom) -> status 1 (ON)
// This matches the top-to-bottom order already used in GraphLabels/TimeFields.
const ROW_TO_STATUS: DutyStatus[] = [4, 3, 2, 1]
const STATUS_TO_ROW: Record<DutyStatus, number> = { 4: 0, 3: 1, 2: 2, 1: 3 }

// Colors matched to the existing GraphLabels legend so this lines up visually
// with what's already on screen next to the chart.
const STATUS_META: Record<DutyStatus, { label: string; color: string }> = {
  4: { label: 'OFF', color: 'gray' },
  3: { label: 'SB', color: 'blue' },
  2: { label: 'D', color: 'green' },
  1: { label: 'ON', color: 'orange' }
}

const timeToCol = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + m) / 15
}

const colToTime = (col: number): string => {
  const totalMinutes = Math.round(col) * 15
  if (totalMinutes >= 1440) return '24:00'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max)

// After an edit, two neighboring segments can end up with the same status
// (e.g. you dragged the middle block onto the same lane as its neighbor).
// Merge those back into one block instead of leaving a redundant boundary.
const normalizeSegments = (segments: DutySegment[]): DutySegment[] => {
  const sorted = [...segments].sort(
    (a, b) => timeToCol(a.stime) - timeToCol(b.stime)
  )
  const merged: DutySegment[] = []
  sorted.forEach(seg => {
    const prev = merged[merged.length - 1]
    if (prev && prev.status === seg.status && prev.etime === seg.stime) {
      prev.etime = seg.etime
    } else {
      merged.push({ ...seg })
    }
  })
  return merged
}

export default function EditableHosTimeline ({
  segments,
  onChange,
  readOnly = false
}: EditableHosTimelineProps) {
  const laneRef = useRef<HTMLDivElement>(null)
  const [liveSegments, setLiveSegments] = useState<DutySegment[]>(segments)
  const [dragHint, setDragHint] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const dragRef = useRef<{
    kind: 'boundary' | 'status'
    index: number
    startX: number
    startY: number
    snapshot: DutySegment[]
  } | null>(null)

  // Keep in sync with the parent, but never clobber an edit that's in progress.
  React.useEffect(() => {
    if (!dragRef.current) setLiveSegments(segments)
  }, [segments])

  const getColWidth = () =>
    (laneRef.current?.getBoundingClientRect().width || 1) / TOTAL_COLUMNS
  const getRowHeight = () =>
    (laneRef.current?.getBoundingClientRect().height || 1) / 4

  const startBoundaryDrag = (e: React.PointerEvent, index: number) => {
    if (readOnly) return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setActiveIndex(index)
    dragRef.current = {
      kind: 'boundary',
      index,
      startX: e.clientX,
      startY: e.clientY,
      snapshot: liveSegments.map(s => ({ ...s }))
    }
  }

  const startStatusDrag = (e: React.PointerEvent, index: number) => {
    if (readOnly) return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setActiveIndex(index)
    dragRef.current = {
      kind: 'status',
      index,
      startX: e.clientX,
      startY: e.clientY,
      snapshot: liveSegments.map(s => ({ ...s }))
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return

    if (drag.kind === 'boundary') {
      const colWidth = getColWidth()
      const deltaCols = Math.round((e.clientX - drag.startX) / colWidth)
      const left = drag.snapshot[drag.index]
      const right = drag.snapshot[drag.index + 1]
      const minCol = timeToCol(left.stime) + MIN_SEGMENT_COLUMNS
      const maxCol = timeToCol(right.etime) - MIN_SEGMENT_COLUMNS
      const originalCol = timeToCol(left.etime)
      const newCol = clamp(originalCol + deltaCols, minCol, maxCol)
      const newTime = colToTime(newCol)

      setDragHint(newTime)
      setLiveSegments(prev => {
        const next = prev.map(s => ({ ...s }))
        next[drag.index].etime = newTime
        next[drag.index + 1].stime = newTime
        return next
      })
    } else {
      const rowHeight = getRowHeight()
      const deltaRows = Math.round((e.clientY - drag.startY) / rowHeight)
      const originalRow = STATUS_TO_ROW[drag.snapshot[drag.index].status]
      const newRow = clamp(originalRow + deltaRows, 0, 3)
      const newStatus = ROW_TO_STATUS[newRow]

      setDragHint(STATUS_META[newStatus].label)
      setLiveSegments(prev => {
        const next = prev.map(s => ({ ...s }))
        next[drag.index].status = newStatus
        return next
      })
    }
  }

  const endDrag = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragHint(null)
    setActiveIndex(null)
    setLiveSegments(prev => {
      const normalized = normalizeSegments(prev)
      onChange(normalized)
      return normalized
    })
  }

  const hours = Array.from({ length: 24 }, (_, h) => h)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Hour ruler so it's clear what you're dragging to */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 14
        }}
      >
        {hours.map(h => (
          <span
            key={h}
            style={{
              position: 'absolute',
              left: `${(h / 24) * 100}%`,
              fontSize: '9px',
              color: '#999',
              transform: 'translateX(-50%)'
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Lanes: one per duty status, OFF/SB/D/ON top-to-bottom */}
      <div
        ref={laneRef}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          position: 'absolute',
          top: 14,
          left: 0,
          right: 0,
          bottom: 0,
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {ROW_TO_STATUS.map((status, row) => (
          <div
            key={status}
            style={{
              position: 'absolute',
              top: `${row * 25}%`,
              left: 0,
              width: '100%',
              height: '25%',
              borderBottom: '1px solid #e5e7eb',
              background: row % 2 === 0 ? '#fafafa' : '#ffffff',
              borderTop: '1px solid #eee',
              boxSizing: 'border-box'
            }}
          />
        ))}

        {/* Boundary handles - drag left/right to move a status-change time.
            Rendered after the segments so they sit on top and stay grabbable. */}
        {liveSegments.slice(0, -1).map((seg, i) => {
          const next = liveSegments[i + 1]
          const boundaryCol = timeToCol(seg.etime)
          const leftPct = (boundaryCol / TOTAL_COLUMNS) * 100
          const rowA = STATUS_TO_ROW[seg.status]
          const rowB = STATUS_TO_ROW[next.status]
          const topPct = Math.min(rowA, rowB) * 25
          const heightPct = (Math.abs(rowA - rowB) + 1) * 25
          const isActive =
            activeIndex === i && dragRef.current?.kind === 'boundary'
          return (
            <React.Fragment key={`boundary-${seg.id}`}>
              <div
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                  width: isActive ? '2px' : '1.5px',
                  background: isActive ? '#222' : '#555',
                  pointerEvents: 'none'
                }}
              />
              <div
                onPointerDown={e => startBoundaryDrag(e, i)}
                style={{
                  position: 'absolute',
                  left: `calc(${leftPct}% - 6px)`,
                  top: 0,
                  height: '100%',
                  width: '12px',
                  cursor: readOnly ? 'default' : 'ew-resize',
                  zIndex: 5
                }}
              />
            </React.Fragment>
          )
        })}

        {/* Duty segments - drag up/down to move this block to a different status */}
        {liveSegments.map((seg, index) => {
          const startCol = timeToCol(seg.stime)
          const endCol = timeToCol(seg.etime)
          const row = STATUS_TO_ROW[seg.status]
          const meta = STATUS_META[seg.status]
          const isActive =
            activeIndex === index && dragRef.current?.kind === 'status'
          return (
            <div
              key={seg.id}
              onPointerDown={e => startStatusDrag(e, index)}
              title={`${meta.label}  ${seg.stime} - ${seg.etime}`}
              style={{
                position: 'absolute',
                left: `${(startCol / TOTAL_COLUMNS) * 100}%`,
                width: `${((endCol - startCol) / TOTAL_COLUMNS) * 100}%`,
                top: `${row * 25 + 10}%`,
                height: '18%',
                background: meta.color,
                borderRadius: 6,
                cursor: 'grab',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                border: '1px solid rgba(255,255,255,.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: 11,
                transition: 'all .15s ease'
              }}
            >
              {meta.label}
            </div>
          )
        })}

        {dragHint && (
          <div
            style={{
              position: 'absolute',
              top: -22,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#222',
              color: '#fff',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '3px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {dragHint}
          </div>
        )}
      </div>
    </div>
  )
}
