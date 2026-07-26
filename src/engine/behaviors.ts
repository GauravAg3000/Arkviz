// Behavior defines how each node behaves when the clock ticks.

import type { InsertResult, NodeState, Packet } from '../types'
import { chaos } from './chaos-controller'
import type { SimEvent } from './event-bus'
import { addHop, createPacket } from './packet'

/**
 * Information provided by the Simulation Engine to a node on every clock tick.
 */
export interface BehaviorContext {
  nodeId: string
  queue: Packet[]
  setState: (s: NodeState) => void
  emitEvent: (ev: Omit<SimEvent, 'tick'>) => void
  canTryPrimary: boolean
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
  private readonly interval = 6

  onTick(ctx: BehaviorContext): BehaviorOutput {
    this.tickCount++

    // Emit one packet every 'interval' ticks
    if (this.tickCount % this.interval !== 0) {
      ctx.setState('idle')
      return {}
    }
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
    if (!packet) {
      ctx.setState('idle')
      return {}
    }

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
    if (!packet) {
      ctx.setState('idle')
      return {}
    }
    addHop(packet, ctx.nodeId)
    ctx.setState('processing')

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
    if (chaos.hasFailure('worker', 'worker_crash')) {
      ctx.setState('failed')
      return {}
    }

    const packet = ctx.queue.shift()
    if (!packet) {
      ctx.setState('idle')
      return {}
    }

    addHop(packet, ctx.nodeId)
    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'process',
      message: `${packet.id} processed`,
    })
    return { processed: [{ packet, result: 'success' }] }
  }
}

export class PostgresBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    // PostgreSQL is down — reject all packets.
    if (chaos.hasFailure('postgresql', 'pg_down')) {
      ctx.setState('failed')
      return {}
    }

    const packet = ctx.queue.shift()
    if (!packet) {
      ctx.setState('idle')
      return {}
    }

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

export class MongoDBBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    if (ctx.queue.length === 0) {
      ctx.setState('idle')
      return {}
    }

    ctx.setState('processing')

    // Hold packets when PG is down — queue grows visibly.
    if (chaos.hasFailure('postgresql')) return {}

    const packet = ctx.queue.shift()!
    addHop(packet, ctx.nodeId)
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'forward',
      message: `${packet.id} forwarded to Healer`,
    })
    return { processed: [{ packet, result: 'success' }] }
  }
}

export class HealerBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    // Don't replay if PostgreSQL is down.
    if (chaos.hasFailure('postgresql')) return {}

    const packet = ctx.queue.shift()
    if (!packet) {
      ctx.setState('idle')
      return {}
    }

    addHop(packet, ctx.nodeId)
    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'process',
      message: `${packet.id} replayed to PostgreSQL`,
    })
    return { processed: [{ packet, result: 'success' }] }
  }
}

export class DatabaseRouterBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    const packet = ctx.queue.shift()
    if (!packet) {
      ctx.setState('idle')
      return {}
    }

    addHop(packet, ctx.nodeId)

    // Poison message → DLQ (data problem, CB stays closed).
    if (chaos.hasFailure('worker', 'worker_invalid')) {
      ctx.emitEvent({
        nodeId: ctx.nodeId,
        type: 'failure',
        message: `${packet.id} — invalid data, routed to DLQ`,
      })
      return { processed: [{ packet, result: 'invalid_data' }] }
    }

    // PG down or CB blocking → MongoDB fallback.
    if (chaos.hasFailure('postgresql') || !ctx.canTryPrimary) {
      ctx.setState('idle')
      ctx.emitEvent({
        nodeId: ctx.nodeId,
        type: 'failure',
        message: `${packet.id} — PG unavailable, routed to MongoDB`,
      })
      return { processed: [{ packet, result: 'connection_failure' }] }
    }

    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'forward',
      message: `${packet.id} routed to PostgreSQL`,
    })
    return { processed: [{ packet, result: 'success' }] }
  }
}

export class DLQBehavior implements Behavior {
  onTick(ctx: BehaviorContext): BehaviorOutput {
    const packet = ctx.queue.shift()
    if (!packet) {
      ctx.setState('idle')
      return {}
    }

    packet.status = 'dead_lettered'
    addHop(packet, ctx.nodeId)
    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'receive',
      message: `${packet.id} dead-lettered`,
    })
    return {}
  }
}
