import { useState } from 'react'
import { clock } from '../../engine/clock'
import { useClock } from '../hooks/useClock'

const SPEEDS = [0.5, 1, 2, 5]

export function ControlPanel() {
  const { tick, isPaused, speed, pause, resume, setSpeed } = useClock()
  const [started, setStarted] = useState(false)

  const handleStart = () => {
    setStarted(true)
    clock.start()
  }

  const handleReset = () => {
    clock.reset()
    setStarted(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 24px',
      background: '#1e293b',
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
    }}>
      {!started ? (
        <button onClick={handleStart} style={btnStyle}>▶ Start</button>
      ) : (
        <button onClick={isPaused ? resume : pause} style={btnStyle}>
          {isPaused ? '▶' : '⏸'}
        </button>
      )}
      <span>Tick: <strong>{tick}</strong></span>
      <span>Speed:</span>
      <select
        value={speed}
        onChange={e => setSpeed(Number(e.target.value))}
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          border: '1px solid #475569',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: 'monospace',
        }}
      >
        {SPEEDS.map(s => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>
      <button onClick={handleReset} style={btnStyle}> Reset </button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 14px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontWeight: 700,
}
