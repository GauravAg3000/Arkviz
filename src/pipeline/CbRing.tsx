import { motion } from 'framer-motion'
import type { CBState } from '../engine/circuit-breaker'

const R = 72
const STROKE = 4
const D = (R + STROKE) * 2
const OFF = R + STROKE
const CIRCUM = 2 * Math.PI * R

const COLORS: Record<CBState, string> = {
  closed: '#00FF9D',
  open: '#FF2E54',
  half_open: '#eab308',
}

function progressColor(fill: number): string {
  if (fill <= 0.33) return '#00FF9D'
  if (fill <= 0.66) return '#eab308'
  return '#FF2E54'
}

interface Props {
  cx: number
  cy: number
  cbState: CBState
  failureCount: number
  threshold: number
}

export function CbRing({ cx, cy, cbState, failureCount, threshold }: Props) {
  const fill = Math.min(failureCount / threshold, 1)

  let dash: string
  let stroke: string

  if (cbState === 'open') {
    dash = `${CIRCUM * 0.75} ${CIRCUM * 0.25}`
    stroke = COLORS.open
  } else if (cbState === 'half_open') {
    dash = `${CIRCUM} 0`
    stroke = COLORS.half_open
  } else {
    const pct = CIRCUM * fill
    dash = `${pct} ${CIRCUM - pct}`
    stroke = progressColor(fill)
  }

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{ left: cx - R - STROKE, top: cy - R - STROKE, width: D, height: D }}
    >
      <svg viewBox={`0 0 ${D} ${D}`} className="w-full h-full">
        <circle cx={OFF} cy={OFF} r={R} fill="none" stroke="#121824" strokeWidth={STROKE} />
        <motion.circle
          cx={OFF}
          cy={OFF}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          transform={`rotate(-90 ${OFF} ${OFF})`}
          initial={false}
          animate={{ strokeDasharray: dash, stroke }}
          transition={{ stroke: { duration: 0.3 }, strokeDasharray: { duration: 0.5 } }}
        />
      </svg>
    </div>
  )
}
