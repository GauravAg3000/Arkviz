import type { CBState } from '../../engine/circuit-breaker'

const CB_COLORS: Record<CBState, string> = {
  closed: '#22c55e',
  open: '#ef4444',
  half_open: '#eab308',
}

const CB_LABELS: Record<CBState, string> = {
  closed: 'CLOSED',
  open: 'OPEN',
  half_open: 'HALF',
}

interface Props {
  state: CBState
  failureCount: number
}

export function CircuitBreakerIndicator({ state, failureCount }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 690,
        top: 190,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: CB_COLORS[state],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 700,
        color: '#0f172a',
        border: `3px solid ${CB_COLORS[state]}`,
        boxShadow: '0 0 8px rgba(0,0,0,0.4)',
        zIndex: 10,
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      <span style={{ fontSize: 9, lineHeight: 1.2 }}>
        {CB_LABELS[state]}
      </span>
      <span style={{ fontSize: 11, lineHeight: 1.2 }}>
        {failureCount}
      </span>
    </div>
  )
}
