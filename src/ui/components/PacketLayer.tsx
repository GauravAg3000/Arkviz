import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { getPathD } from '../../pipeline/ConnectionLines'
import { useEngine } from '../hooks/useEngine'

const W = 12
const H = 6

const pathCache = new Map<string, SVGPathElement>()

function getPointOnPath(d: string, t: number) {
  let path = pathCache.get(d)
  if (!path) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    pathCache.set(d, path)
  }
  const total = path.getTotalLength()
  const pt = path.getPointAtLength(t * total)
  return { x: pt.x, y: pt.y }
}

function PacketPill({ from, to, progress }: { from: string; to: string; progress: number }) {
  const d = useMemo(() => getPathD(from, to), [from, to])
  const pos = d ? getPointOnPath(d, progress) : { x: 0, y: 0 }

  return (
    <motion.div
      className="absolute rounded-full bg-green-500"
      style={{ width: W, height: H, boxShadow: '0 0 6px rgba(34,197,94,0.5)' }}
      initial={false}
      animate={{ left: pos.x - W / 2, top: pos.y - H / 2 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    />
  )
}

export function PacketLayer() {
  const { inFlight } = useEngine()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {inFlight.map((p) => (
        <PacketPill key={p.id} from={p.from} to={p.to} progress={p.progress} />
      ))}
    </div>
  )
}
