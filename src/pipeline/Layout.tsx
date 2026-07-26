import { motion } from 'framer-motion'
import { PacketLayer } from '../ui/components/PacketLayer'
import { useEngine } from '../ui/hooks/useEngine'
import { CbRing } from './CbRing'
import { NODE_POSITIONS, NODE_MAP, CANVAS_WIDTH, CANVAS_HEIGHT } from './config'
import { CB_THRESHOLD } from '../engine/circuit-breaker'
import { ConnectionLines } from './ConnectionLines'
import { PipelineNode } from './PipelineNode'

const LEGEND = [
  { color: '#00F0FF', label: 'Active' },
  { color: '#FF2E54', label: 'Failed' },
  { color: '#00FF9D', label: 'Recover' },
  { color: '#475569', label: 'Idle' },
] as const

const dbRouter = NODE_MAP['db_router']

export function PipelineLayout() {
  const snapshot = useEngine()
  const nodeMap = new Map(snapshot.nodes.map((n) => [n.id, n]))

  return (
    <motion.div
      className="w-full h-full overflow-hidden relative flex items-center justify-center bg-pipeline-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative mx-auto" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <CbRing cx={dbRouter.x} cy={dbRouter.y} cbState={snapshot.cbState} failureCount={snapshot.cbFailureCount} threshold={CB_THRESHOLD} />
        <ConnectionLines />
        {NODE_POSITIONS.map((pos) => {
          const node = nodeMap.get(pos.id)
          return (
            <PipelineNode
              key={pos.id}
              pos={pos}
              state={node?.state}
              queueCount={node?.queueDepth ?? 0}
              cbState={pos.id === 'db_router' ? snapshot.cbState : undefined}
              cbFailureCount={pos.id === 'db_router' ? snapshot.cbFailureCount : undefined}
              cbThreshold={CB_THRESHOLD}
            />
          )
        })}
        <PacketLayer />
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-4 text-[11px] font-mono text-slate-400">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
