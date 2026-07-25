// Behavior defines how each node behaves when the clock ticks.

import type { InsertResult, NodeState, Packet } from '../types'
import type { SimEvent } from './event-bus'
import { chaos } from './chaos-controller'
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
  reset?(): void
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
  // Packet that failed to reach PostgreSQL — retried each tick.
  private retryPacket: Packet | null = null
  // Remaining ticks to skip when slow-worker is active.
  private latencyRemaining = 0

  onTick(ctx: BehaviorContext): BehaviorOutput {
    // Crashed worker — do nothing.
    if (chaos.hasFailure('worker', 'worker_crash')) {
      ctx.setState('failed')
      return {}
    }

    // Slow worker — each packet takes 5 ticks before processing.
    if (chaos.hasFailure('worker', 'worker_slow') && ctx.queue.length > 0) {
      if (this.latencyRemaining > 0) {
        this.latencyRemaining--
        return {}
      }
      this.latencyRemaining = 5
    }

    // Get the next packet (retried or fresh).
    const packet = this.retryPacket ?? ctx.queue.shift()
    if (!packet) return {}

    addHop(packet, ctx.nodeId)

    // PostgreSQL is down — hold the packet and retry next tick.
    if (chaos.hasFailure('postgresql', 'pg_down')) {
      this.retryPacket = packet
      ctx.setState('idle')
      ctx.emitEvent({
        nodeId: ctx.nodeId,
        type: 'failure',
        message: `${packet.id} — PG unreachable, retrying`,
      })
      // Engine sees connection_failure → doesn't route (packet stays in retryPacket).
      return { processed: [{ packet, result: 'connection_failure' }] }
    }

    // Normal path — success, packet moves to PostgreSQL.
    this.retryPacket = null
    ctx.setState('processing')
    ctx.emitEvent({
      nodeId: ctx.nodeId,
      type: 'process',
      message: `${packet.id} processed`,
    })
    return { processed: [{ packet, result: 'success' }] }
  }

  reset() {
    this.retryPacket = null
    this.latencyRemaining = 0
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
