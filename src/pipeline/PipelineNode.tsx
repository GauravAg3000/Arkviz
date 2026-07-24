import { NODE_COLORS, type NodePosition } from './config'

const CARD_W = 110
const CARD_H = 64

interface Props {
  pos: NodePosition
  queueCount?: number
}

// TODO: Render them in better positions
export function PipelineNode({ pos, queueCount = 0 }: Props) {
  const color = NODE_COLORS[pos.id]

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x - CARD_W / 2,
        top: pos.y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        border: `2px solid ${color}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}15`,
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: 13,
        transition: 'border-color 0.3s, background 0.3s',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color }}>
        {pos.label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
        {queueCount}
      </span>
    </div>
  )
}