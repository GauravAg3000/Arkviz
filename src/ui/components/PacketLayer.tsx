import { NODE_POSITIONS } from '../../pipeline/config'
import { useEngine } from '../hooks/useEngine'

const DOT_SIZE = 8

// Returns the center position of a node
function nodeCenter(id: string) {
  const node = NODE_POSITIONS.find(p => p.id === id)
  return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }
}

export function PacketLayer() {
  const { inFlight } = useEngine()

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {inFlight.map((p) => {
        const from = nodeCenter(p.from)
        const to = nodeCenter(p.to)
        const x = from.x + (to.x - from.x) * p.progress
        const y = from.y + (to.y - from.y) * p.progress

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x - DOT_SIZE / 2,
              top: y - DOT_SIZE / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: '50%',
              background: '#22c55e',
              transition: 'left 95ms linear, top 95ms linear',
            }}
          />
        )
      })}
    </div>
  )
}