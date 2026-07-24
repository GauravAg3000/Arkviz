import { NODE_POSITIONS, CONNECTIONS } from './config'

function center(id: string) {
  const n = NODE_POSITIONS.find(p => p.id === id)
  return n ? { x: n.x, y: n.y } : { x: 0, y: 0 }
}

// TODO: Fix the connection lines as in arise.
export function ConnectionLines() {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
      {CONNECTIONS.map((conn, i) => {
        const from = center(conn.from)
        const to = center(conn.to)
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#475569"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
        )
      })}
    </svg>
  )
}