import { useState } from 'react'
import { clock } from '../../engine/clock'
import { chaos, type FailureType } from '../../engine/chaos-controller'
import { engine } from '../../engine/simulation-engine'
import { useClock } from '../hooks/useClock'

const SPEEDS = [0.5, 1, 2, 5]

export function ControlPanel() {
  const { tick, isPaused, speed, pause, resume, setSpeed } = useClock()
  const [started, setStarted] = useState(false)
  const [pgCountdown, setPgCountdown] = useState<number | null>(null)
  const [crashCountdown, setCrashCountdown] = useState<number | null>(null)
  const [poisonCountdown, setPoisonCountdown] = useState<number | null>(null)

  const handleStart = () => {
    setStarted(true)
    clock.start()
  }

  const handleReset = () => {
    engine.reset()
    setStarted(false)
  }

  const startCountdown = (
    nodeId: string,
    type: FailureType,
    setter: (n: number | null) => void,
  ) => {
    setter(3)
    let count = 3
    const id = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(id)
        setter(null)
        chaos.injectFailure(nodeId, type)
      } else {
        setter(count)
      }
    }, 1000)
  }

  const failBtn = (
    label: string,
    restoreLabel: string,
    nodeId: string,
    type: FailureType,
    countdown: number | null,
    setter: (n: number | null) => void,
  ) => {
    const failureActive = chaos.hasFailure(nodeId, type)
    const text = countdown !== null ? `${countdown}...` : failureActive ? restoreLabel : label
    return (
      <button
        onClick={() => {
          if (countdown !== null) return
          if (failureActive) {
            chaos.restoreFailure(nodeId, type)
            return
          }
          startCountdown(nodeId, type, setter)
        }}
        style={{
          ...btnStyle,
          background: failureActive ? '#16a34a' : '#dc2626',
          cursor: countdown !== null ? 'not-allowed' : 'pointer',
          opacity: countdown !== null ? 0.6 : 1,
        }}
      >
        {text}
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        background: '#1e293b',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13,
        flexWrap: 'wrap',
      }}
    >
      {!started ? (
        <button onClick={handleStart} style={btnStyle}>
          ▶ Start
        </button>
      ) : (
        <button onClick={isPaused ? resume : pause} style={btnStyle}>
          {isPaused ? '▶' : '⏸'}
        </button>
      )}

      <span>
        Tick: <strong>{tick}</strong>
      </span>

      <span>Speed:</span>
      <select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          border: '1px solid #475569',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: 'monospace',
        }}
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      <span style={{ width: 1, height: 24, background: '#475569' }} />

      {failBtn('Fail PG', 'Restore PG', 'postgresql', 'pg_down', pgCountdown, setPgCountdown)}
      {failBtn('Crash Worker', 'Restore Worker', 'worker', 'worker_crash', crashCountdown, setCrashCountdown)}
      {failBtn('Poison Msg', 'Clear Poison', 'worker', 'worker_invalid', poisonCountdown, setPoisonCountdown)}

      <span style={{ width: 1, height: 24, background: '#475569' }} />

      <button onClick={handleReset} style={btnStyle}>
        Reset
      </button>
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
  fontSize: 13,
}
