import { useEngine } from '../hooks/useEngine'

const CB_COLORS: Record<string, string> = {
  closed: 'text-green-400',
  open: 'text-red-400',
  half_open: 'text-yellow-400',
}

const CELL = 'flex flex-col items-center px-5 py-2 border-r border-slate-800/60 last:border-r-0'
const LABEL = 'text-[10px] uppercase tracking-wider text-slate-500'
const VALUE = 'text-xl font-bold font-mono'

export function StatsPanel() {
  const s = useEngine()
  const mongoQueue = s.nodes.find(n => n.id === 'mongodb')?.queueDepth ?? 0

  return (
    <div className="flex items-stretch bg-slate-900/40 border-b border-slate-800/50">
      <div className={CELL}>
        <span className={LABEL}>Ingested</span>
        <span className={`${VALUE} text-white`}>{s.totalCreated}</span>
      </div>
      <div className={CELL}>
        <span className={LABEL}>Processed</span>
        <span className={`${VALUE} text-green-400`}>{s.totalProcessed}</span>
      </div>
      <div className={CELL}>
        <span className={LABEL}>Dead Lettered</span>
        <span className={`${VALUE} text-red-400`}>{s.totalDeadLettered}</span>
      </div>
      <div className={CELL}>
        <span className={LABEL}>Throughput</span>
        <span className={`${VALUE} text-cyan-400`}>{s.throughput}<span className="text-xs text-slate-500">/10t</span></span>
      </div>
      <div className={CELL}>
        <span className={LABEL}>CB State</span>
        <span className={`text-sm font-bold font-mono ${CB_COLORS[s.cbState] ?? 'text-slate-400'}`}>
          ● {s.cbState}
        </span>
      </div>
      <div className={CELL}>
        <span className={LABEL}>Mongo</span>
        <span className={`${VALUE} text-slate-300`}>{mongoQueue}</span>
      </div>
    </div>
  )
}
