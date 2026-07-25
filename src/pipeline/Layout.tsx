import { NODE_POSITIONS } from './config'
import { PipelineNode } from './PipelineNode'
import { ConnectionLines } from './ConnectionLines'
import { PacketLayer } from '../ui/components/PacketLayer'

export function PipelineLayout() {
  return (
    <div
      style={{
        position: 'relative',
        width: 1000,
        height: 660,
        margin: '40px auto',
      }}
    >
      <ConnectionLines />
      {NODE_POSITIONS.map(pos => (
        <PipelineNode key={pos.id} pos={pos} />
      ))}
      <PacketLayer />
    </div>
  )
}