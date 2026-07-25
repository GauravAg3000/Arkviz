// Behavior defines how each node behaves when the clock ticks.

import type { InsertResult, NodeState, Packet } from '../types'
import type { SimEvent } from './event-bus'
import { addHop, createPacket } from './packet'

/**
 * Information provided by the Simulation Engine to a node on every clock tick.
 */
export interface BehaviorContext {
  nodeId: string
  tick: number
  // Packets waiting at this node
  queue: Packet[]
  state: NodeState
  setState: (s: NodeState) => void
  emitEvent: (ev: Omit<SimEvent, 'tick'>) => void
}

/**
 * Result returned by a node after doing its work.
 * The Simulation Engine decides where packets go next.
 */
export interface BehaviorOutput {
  emit?: Packet[]
  processed?: { packet: Packet; result: InsertResult }[]
}

// Every node will implement this interface
export interface Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput
}


export class ClientBehavior implements Behavior {
  private tickCount = 0
  private readonly interval = 10

  onTick(ctx: BehaviorContext): BehaviorOutput {
    this.tickCount++

    // Emit one packet every 'interval' ticks
    if (this.tickCount % this.interval !== 0) return {}
    const packet = createPacket()

    // Record that the packet visited this node
    addHop(packet, ctx.nodeId)

    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'emit',
      message: `${packet.id} emitted`,
    })

    // Tell the engine a new packet was created
    return { emit: [packet] }
  }
}

export class GatewayBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    // Process one packet at a time
    const packet = ctx.queue.shift()
    if (!packet) return {}

    addHop(packet, ctx.nodeId)
    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'forward',
      message: `${packet.id} forwarded`,
    })
    return {
      processed: [
        {
          packet,
          result: 'success',
        },
      ],
    }
  }
}

export class RedisBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    const packet = ctx.queue.shift()
    if (!packet) return {}
    addHop(packet, ctx.nodeId)

    // Redis only forwards packets.
    return {
      processed: [
        {
          packet,
          result: 'success',
        },
      ],
    }
  }
}

export class WorkerBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    const packet = ctx.queue.shift()
    if (!packet) return {}
    addHop(packet, ctx.nodeId)

    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'process',
      message: `${packet.id} processed`,
    })
    return {
      processed: [
        {
          packet,
          result: 'success',
        },
      ],
    }
  }
}

export class PostgresBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    const packet = ctx.queue.shift()
    if (!packet) return {}

    // Final destination reached
    packet.status = 'processed'
    addHop(packet, ctx.nodeId)

    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'receive',
      message: `${packet.id} stored`,
    })
    return {
      processed: [
        {
          packet,
          result: 'success',
        },
      ],
    }
  }
}
