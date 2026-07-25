import { NODE_POSITIONS } from './config'
import { PipelineNode } from './PipelineNode'
import { ConnectionLines } from './ConnectionLines'
import { PacketLayer } from '../ui/components/PacketLayer'
import { useEngine } from '../ui/hooks/useEngine'

export function PipelineLayout() {
  const snapshot = useEngine()
  const nodeMap = new Map(snapshot.nodes.map((n) => [n.id, n]))

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
      {NODE_POSITIONS.map((pos) => {
        const node = nodeMap.get(pos.id)
        return (
          <PipelineNode
            key={pos.id}
            pos={pos}
            state={node?.state}
            queueCount={node?.queueDepth ?? 0}
          />
        )
      })}
      <PacketLayer />
    </div>
  )
}