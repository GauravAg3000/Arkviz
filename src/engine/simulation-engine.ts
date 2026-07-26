import type { InFlightPacket, NodeState, Packet } from '../types'
import {
  ClientBehavior,
  DatabaseRouterBehavior,
  DLQBehavior,
  GatewayBehavior,
  HealerBehavior,
  MongoDBBehavior,
  PostgresBehavior,
  RedisBehavior,
  WorkerBehavior,
  type Behavior, type BehaviorContext, type BehaviorOutput,
} from './behaviors'
import { chaos, type FailureType } from './chaos-controller'
import { CircuitBreaker, type CBState } from './circuit-breaker'
import { clock, type TickPayload } from './clock'
import { EventBus } from './event-bus'


/* 
  * Defines the next destination for each node.
  * The engine uses this table for packet routing.
*/
const ROUTE_MAP: Record<string, string | null> = {
  client: 'gateway',
  gateway: 'redis',
  redis: 'worker',
  worker: 'db_router',
  db_router: 'postgresql',
  mongodb: 'healer',
  healer: 'postgresql',
  postgresql: null,
  dlq: null,
}

const NODE_ORDER = ['client', 'gateway', 'redis', 'worker', 'db_router', 'mongodb', 'healer', 'postgresql', 'dlq'] as const

// Amount a packet moves on every tick (0 → 1)
const ANIMATION_STEP = 0.09

/**
 * Represents a packet currently traveling between two nodes.
 */
interface InFlightEntry {
  id: string
  fromNodeId: string
  toNodeId: string
  progress: number
  packet: Packet
}

interface NodeEntry {
  state: NodeState
  queue: Packet[]
}

/**
 * Immutable view of the simulation.
 * React uses this to render the UI.
 */
export interface EngineSnapshot {
  nodes: {
    id: string
    state: NodeState
    queueDepth: number
  }[]
  inFlight: InFlightPacket[]
  failures: { nodeId: string; type: FailureType }[]
  cbState: CBState
  cbFailureCount: number
  totalCreated: number
  totalProcessed: number
  totalDeadLettered: number
  throughput: number
}

export class SimulationEngine {
  private nodes = new Map<string, NodeEntry>()  // All nodes in the pipeline
  private behaviors = new Map<string, Behavior>()
  readonly eventBus = new EventBus()
  private inFlight: InFlightEntry[] = []  // Packets currently moving between nodes
  private _changeCount = 0
  private tickCount = 0
  private listeners = new Set<() => void>()
  readonly cb = new CircuitBreaker()
  private _totalCreated = 0
  private _totalProcessed = 0
  private _totalDeadLettered = 0
  private processedRing: number[] = []

  constructor() {
    for (const id of NODE_ORDER) {
      this.nodes.set(id, { state: 'idle', queue: [] })
    }
    this.behaviors.set('client', new ClientBehavior())
    this.behaviors.set('gateway', new GatewayBehavior())
    this.behaviors.set('redis', new RedisBehavior())
    this.behaviors.set('worker', new WorkerBehavior())
    this.behaviors.set('db_router', new DatabaseRouterBehavior())
    this.behaviors.set('postgresql', new PostgresBehavior())
    this.behaviors.set('mongodb', new MongoDBBehavior())
    this.behaviors.set('healer', new HealerBehavior())
    this.behaviors.set('dlq', new DLQBehavior())

    // Run the simulation whenever the clock ticks.
    clock.onTick((payload) => this.onTick(payload))
  }

  get changeCount() { return this._changeCount }

  // Returns the current simulation state.
  getSnapshot(): EngineSnapshot {
    return {
      nodes: NODE_ORDER.map((id) => {
        const n = this.nodes.get(id)!
        return {
          id,
          state: n.state,
          queueDepth: n.queue.length
        }
      }),
      inFlight: this.inFlight.map((f) => ({
        id: f.id,
        from: f.fromNodeId,
        to: f.toNodeId,
        progress: f.progress,
      })),
      failures: chaos.getActiveFailures(),
      cbState: this.cb.state,
      cbFailureCount: this.cb.failureCount,
      totalCreated: this._totalCreated,
      totalProcessed: this._totalProcessed,
      totalDeadLettered: this._totalDeadLettered,
      throughput: (() => {
        if (this.processedRing.length < 2) return 0
        return this.processedRing[this.processedRing.length - 1] - this.processedRing[0]
      })(),
    }
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  // Restores the simulation to its initial state.
  reset() {
    clock.reset()
    for (const [, entry] of this.nodes) {
      entry.state = 'idle'
      entry.queue.length = 0
    }
    this.inFlight.length = 0
    this.tickCount = 0
    this.eventBus.clear()
    chaos.clear()
    this.cb.reset()
    this._totalCreated = 0
    this._totalProcessed = 0
    this._totalDeadLettered = 0
    this.processedRing.length = 0
    this.notify()
  }

  private onTick(_payload: TickPayload) {
    this.tickCount++

    const outputs: { nodeId: string; output: BehaviorOutput }[] = []

    // Step 1: Let every node do its work.
    for (const nodeId of NODE_ORDER) {
      const entry = this.nodes.get(nodeId)!
      const behavior = this.behaviors.get(nodeId)!
      const ctx: BehaviorContext = {
        nodeId,
        queue: entry.queue,
        setState: (state) => { entry.state = state },
        emitEvent: (event) => this.eventBus.emit({ tick: this.tickCount, ...event }),
        canTryPrimary: this.cb.canTryPrimary(),
      }
      const output = behavior.onTick(ctx)

      // Only keep nodes that actually did something.
      if (output.emit || output.processed) {
        outputs.push({ nodeId, output })
      }
    }

    // Step 2: Send packets to their next destination.
    for (const { nodeId, output } of outputs) {
      if (output.emit) this._totalCreated += output.emit.length

      for (const packet of output.emit ?? []) {
        this.routeInFlight(packet, nodeId, ROUTE_MAP[nodeId])
      }

      for (const { packet, result } of output.processed ?? []) {
        if (result === 'invalid_data') {
          this._totalDeadLettered++
        }

        if (result === 'connection_failure') {
          this.cb.recordFailure(this.tickCount)
          this.eventBus.emit({
            tick: this.tickCount,
            nodeId: 'circuit-breaker',
            type: 'failure',
            message: `CB failure #${this.cb.failureCount} — routing to MongoDB`,
          })
          this.routeInFlight(packet, nodeId, 'mongodb')
          continue
        }

        if (result === 'invalid_data') {
          this.eventBus.emit({
            tick: this.tickCount,
            nodeId: 'dlq',
            type: 'info',
            message: `${packet.id} — dead-lettered`,
          })
          this.routeInFlight(packet, nodeId, 'dlq')
          continue
        }

        if (result === 'success') {
          if (nodeId === 'postgresql') {
            this._totalProcessed++
            this.cb.recordSuccess()
          }
          this.routeInFlight(packet, nodeId, ROUTE_MAP[nodeId])
        }
      }
    }

    // Step 2b: Advance the Circuit Breaker state machine.
    this.cb.onTick(this.tickCount)

    // Map CB state to db_router visual state.
    const dbRouter = this.nodes.get('db_router')!
    if (this.cb.state === 'open') {
      dbRouter.state = 'failed'
    } else if (this.cb.state === 'half_open') {
      dbRouter.state = 'recovering'
    }

    // Step 3: Move packets already traveling.
    for (let i = this.inFlight.length - 1; i >= 0; i--) {
      const packet = this.inFlight[i]
      packet.progress += ANIMATION_STEP

      // Packet reached the destination node.
      if (packet.progress >= 1) {
        const target = this.nodes.get(packet.toNodeId)
        if (target) {
          target.queue.push(packet.packet)
        }
        
        this.inFlight.splice(i, 1)
      }
    }

    this.processedRing.push(this._totalProcessed)
    if (this.processedRing.length > 10) this.processedRing.shift()

    this.notify()
  }

  private routeInFlight(packet: Packet, fromNodeId: string, target: string | null) {
    if (target === null) return
    this.inFlight.push({
      id: packet.id,
      fromNodeId,
      toNodeId: target,
      progress: 0,
      packet,
    })
  }

  private notify() {
    this._changeCount++
    this.listeners.forEach((cb) => cb())
  }
}

export const engine = new SimulationEngine()
