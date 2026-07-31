import { memo } from 'react'
import { motion } from 'framer-motion'
import { NODE_MAP, CONNECTIONS } from './config'

const HORIZ = 55
const VERT = 35

function getPathPoints(from: string, to: string): { x: number; y: number }[] {
  const a = NODE_MAP[from]
  const b = NODE_MAP[to]
  if (!a || !b) return []

  if (a.y === b.y) {
    const dir = b.x > a.x ? 1 : -1
    return [
      { x: a.x + dir * HORIZ, y: a.y },
      { x: b.x - dir * HORIZ, y: b.y },
    ]
  }

  if (a.x === b.x) {
    const dir = b.y > a.y ? 1 : -1
    return [
      { x: a.x, y: a.y + dir * VERT },
      { x: b.x, y: b.y - dir * VERT },
    ]
  }

  const route = ROUTES[`${from}>${to}`]
  if (!route) return []

  return route(a, b)
}

const sharedLRoute = (a: { x: number; y: number }, b: { x: number; y: number }) => [
  { x: a.x + HORIZ, y: a.y },
  { x: b.x, y: a.y },
  { x: b.x, y: b.y + VERT },
]

const ROUTES: Record<string, (a: { x: number; y: number }, b: { x: number; y: number }) => { x: number; y: number }[]> = {
  'worker>db_router':     (a, b) => [{ x: a.x, y: a.y - VERT }, { x: a.x, y: b.y + VERT }, { x: b.x, y: b.y + VERT }],
  'db_router>postgresql': sharedLRoute,
  'healer>postgresql':    sharedLRoute,
}

export function getPathD(from: string, to: string): string | null {
  const pts = getPathPoints(from, to)
  if (pts.length < 2) return null
  return 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ')
}

const PATH_DATA: (string | null)[] = CONNECTIONS.map(conn => getPathD(conn.from, conn.to))

export const ConnectionLines = memo(function ConnectionLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
        </marker>
      </defs>
      {CONNECTIONS.map((_, i) => {
        const d = PATH_DATA[i]
        if (!d) return null
        return (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="6 4"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -20 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            markerEnd="url(#arrowhead)"
          />
        )
      })}
    </svg>
  )
})
