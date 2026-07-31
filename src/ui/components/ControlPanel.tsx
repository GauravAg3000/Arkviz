import { useState } from 'react'
import { motion } from 'framer-motion'
import { clock } from '../../engine/clock'
import { chaos, type FailureType } from '../../engine/chaos-controller'
import { engine } from '../../engine/simulation-engine'
import { useClock } from '../hooks/useClock'

const SPEEDS = [0.5, 1, 2, 5]

const FAILURE_BUTTONS: { label: string; restoreLabel: string; nodeId: string; type: FailureType }[] = [
  { label: 'Fail PG', restoreLabel: 'Restore PG', nodeId: 'postgresql', type: 'pg_down' },
  { label: 'Crash Worker', restoreLabel: 'Restore Worker', nodeId: 'worker', type: 'worker_crash' },
  { label: 'Poison Msg', restoreLabel: 'Clear Poison', nodeId: 'worker', type: 'worker_invalid' },
]

export function ControlPanel() {
  const { tick, isPaused, speed, pause, resume, setSpeed } = useClock()
  const [started, setStarted] = useState(false)
  const [countdowns, setCountdowns] = useState<Record<FailureType, number | null>>({
    pg_down: null,
    worker_crash: null,
    worker_invalid: null,
  })

  const handleStart = () => {
    setStarted(true)
    clock.start()
  }

  const handleReset = () => {
    engine.reset()
    setStarted(false)
  }

  const startCountdown = (nodeId: string, type: FailureType) => {
    setCountdowns((prev) => ({ ...prev, [type]: 3 }))
    let count = 3
    const id = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(id)
        setCountdowns((prev) => ({ ...prev, [type]: null }))
        chaos.injectFailure(nodeId, type)
      } else {
        setCountdowns((prev) => ({ ...prev, [type]: count }))
      }
    }, 1000)
  }

  const failBtn = (label: string, restoreLabel: string, nodeId: string, type: FailureType) => {
    const countdown = countdowns[type]
    const failureActive = chaos.hasFailure(nodeId, type)
    const text = countdown !== null ? `${countdown}...` : failureActive ? restoreLabel : label
    const active = failureActive ? 'bg-[#00FF9D] text-[#0B0E14] border-[#00FF9D]' : 'bg-[#1E2638] text-[#F1F5F9] border-[#2A3548]'
    const disabled = countdown !== null ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
    return (
      <button
        className={`px-[14px] py-[6px] rounded font-mono font-bold text-xs border transition-colors duration-200 ${active} ${disabled}`}
        onClick={() => {
          if (countdown !== null) return
          if (failureActive) {
            chaos.restoreFailure(nodeId, type)
            return
          }
          startCountdown(nodeId, type)
        }}
      >
        {text}
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2.5 px-[18px] py-[10px] bg-[#121824] rounded-lg border border-[#1E2638] font-mono text-xs flex-wrap text-slate-400"
    >
      {!started ? (
        <button
          onClick={handleStart}
          className="px-[14px] py-[6px] rounded font-mono font-bold text-xs border cursor-pointer bg-[#00F0FF] text-[#0B0E14] border-[#00F0FF]"
        >
          ▶ Start
        </button>
      ) : (
        <button
          onClick={isPaused ? resume : pause}
          className="px-[14px] py-[6px] rounded font-mono font-bold text-xs border cursor-pointer bg-[#1E2638] text-[#F1F5F9] border-[#2A3548]"
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      )}

      <span>
        Tick: <strong className="text-[#F1F5F9]">{tick}</strong>
      </span>

      <span>Speed:</span>
      <select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="bg-[#0B0E14] text-[#F1F5F9] border border-[#2A3548] rounded px-2 py-1 font-mono text-xs"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>

      <div className="w-px h-[22px] bg-[#2A3548]" />

      {FAILURE_BUTTONS.map(({ label, restoreLabel, nodeId, type }) =>
        failBtn(label, restoreLabel, nodeId, type)
      )}

      <div className="w-px h-[22px] bg-[#2A3548]" />

      <button
        onClick={handleReset}
        className="px-[14px] py-[6px] rounded font-mono font-bold text-xs border cursor-pointer bg-[#1E2638] text-[#F1F5F9] border-[#2A3548]"
      >
        Reset
      </button>
    </motion.div>
  )
}
