import { motion } from 'framer-motion'
import type { FC, ReactNode, SVGProps } from 'react'
import type { CBState } from '../engine/circuit-breaker'
import { CB_THRESHOLD } from '../engine/circuit-breaker'
import type { NodeState } from '../types'
import { NODE_COLORS, NODE_GLOWS, type NodePosition } from './config'

import ClientSvg from '../assets/icons/client.svg?react'
import RouterSvg from '../assets/icons/db_router.svg?react'
import DlqSvg from '../assets/icons/dlq.svg?react'
import GatewaySvg from '../assets/icons/gateway.svg?react'
import HealerSvg from '../assets/icons/healer.svg?react'
import MongoSvg from '../assets/icons/mongodb.svg?react'
import PostgresSvg from '../assets/icons/postgresql.svg?react'
import RedisSvg from '../assets/icons/redis.svg?react'
import WorkerSvg from '../assets/icons/worker.svg?react'

const W = 110
const H = 70

const STATE_STROKES: Record<NodeState, string> = {
  idle: '#475569',
  processing: '#00F0FF',
  failed: '#FF2E54',
  recovering: '#00FF9D',
}

const CB_COLOR: Record<CBState, string> = {
  closed: '#22c55e',
  open: '#ef4444',
  half_open: '#eab308',
}

const NODE_SVGS: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  client: ClientSvg,
  gateway: GatewaySvg,
  redis: RedisSvg,
  worker: WorkerSvg,
  db_router: RouterSvg,
  postgresql: PostgresSvg,
  mongodb: MongoSvg,
  healer: HealerSvg,
  dlq: DlqSvg,
}

interface Props {
  pos: NodePosition
  state?: NodeState
  queueCount?: number
  cbState?: CBState
  cbFailureCount?: number
  cbThreshold?: number
}

function SvgFrame({ fill, stroke, className, children }: { fill: string; stroke: string; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={{ '--fill': fill, '--stroke': stroke } as React.CSSProperties}>
      {children}
    </div>
  )
}

export function PipelineNode({ pos, state = 'idle', queueCount = 0, cbState, cbFailureCount = 0, cbThreshold = CB_THRESHOLD }: Props) {
  const color = NODE_COLORS[pos.id]
  const glow = NODE_GLOWS[pos.id]
  const strokeColor = STATE_STROKES[state]
  const Svg = NODE_SVGS[pos.id]

  return (
    <motion.div
      className="absolute"
      style={{
        left: pos.x - W / 2,
        top: pos.y - H / 2,
        width: W,
        height: H,
      }}
      animate={{ boxShadow: state !== 'idle' ? glow : 'none' }}
      transition={{ duration: 0.3 }}
    >
      <SvgFrame fill={`${color}15`} stroke={strokeColor} className="absolute inset-0 w-full h-full">
        <motion.div
          className="w-full h-full"
          animate={{ filter: state !== 'idle' ? `drop-shadow(${glow})` : 'none' }}
          transition={{ duration: 0.3 }}
        >
          <Svg className="w-full h-full" />
        </motion.div>
      </SvgFrame>
      <div className="relative z-10 flex flex-col items-center justify-center h-full select-none">
        <div className="h-5" />
        <span className="text-[11px] text-white font-bold uppercase tracking-[1px]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {pos.label}
        </span>
        <span className="text-lg font-bold leading-none mt-0.5 text-slate-200">
          {queueCount}
        </span>
      </div>
      {cbState && (
        <motion.div
          className="absolute top-0.5 right-0.5 z-20 px-1 py-[1px] rounded-[2px] text-[9px] font-bold font-mono leading-tight text-white"
          style={{ background: CB_COLOR[cbState] }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {cbState} {cbFailureCount}/{cbThreshold}
        </motion.div>
      )}
    </motion.div>
  )
}
