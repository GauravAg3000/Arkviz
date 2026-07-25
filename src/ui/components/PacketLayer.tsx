import { NODE_POSITIONS } from '../../pipeline/config'
import { usePackets } from '../hooks/usePackets'

const DOT_SIZE = 8

// Returns the center position of a node
function nodeCenter(id: string) {
  const node = NODE_POSITIONS.find(p => p.id === id)
  return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }
}

export function PacketLayer() {
  // Current packet positions from the simulation
  const packets = usePackets()

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {packets.map(packet => {
        const from = nodeCenter(packet.from)
        const to = nodeCenter(packet.to)
        const x = from.x + (to.x - from.x) * packet.progress
        const y = from.y + (to.y - from.y) * packet.progress

        return (
          <div
            key={packet.id}
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