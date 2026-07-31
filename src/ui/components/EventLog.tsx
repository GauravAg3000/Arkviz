import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { engine } from '../../engine/simulation-engine'

const EVENT_COLORS: Record<string, string> = {
  emit: 'text-yellow-400',
  forward: 'text-cyan-400',
  process: 'text-green-400',
  receive: 'text-purple-400',
  failure: 'text-red-400',
  info: 'text-blue-400',
}

export function EventLog() {
  const [collapsed, setCollapsed] = useState(false)
  const subscribe = useCallback((cb: () => void) => engine.onChange(cb), [])
  const getSnapshot = useCallback(() => engine.eventBus.version, [])
  const version = useSyncExternalStore(subscribe, getSnapshot)
  const events = engine.eventBus.getAll()

  const reversed = useMemo(() => {
    const res: typeof events = []
    for (let i = events.length - 1; i >= 0; i--) res.push(events[i])
    return res
  }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute top-2 left-2 z-50 w-96 max-h-52 flex flex-col rounded overflow-hidden bg-slate-950/85 backdrop-blur border border-slate-800 shadow-lg">
      <button
        className="flex items-center justify-between w-full px-3 py-1.5 border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          {collapsed ? '▶ ' : '▼ '}Event Log
        </span>
        <span className="text-[10px] text-slate-600 font-mono">{events.length}</span>
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto max-h-40">
          {reversed.length === 0 ? (
            <p className="text-xs text-slate-600 italic px-3 py-4 text-center">No events yet</p>
          ) : (
            reversed.map((ev, i) => (
              <div
                key={ev.tick + ev.nodeId + i}
                className="flex items-start gap-2 px-3 py-1 text-[11px] font-mono border-b border-slate-800/30 last:border-0 hover:bg-slate-800/40 transition-colors"
              >
                <span className="text-slate-600 shrink-0 w-8 text-right">{String(ev.tick).padStart(4, '0')}</span>
                <span className="text-slate-400 shrink-0 w-20 truncate">{ev.nodeId}</span>
                <span className={EVENT_COLORS[ev.type] ?? 'text-slate-300'}>{ev.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
