import type { InFlightPacket, NodeState, Packet } from '../types'
import {
  ClientBehavior, GatewayBehavior,
  PostgresBehavior,
  RedisBehavior,
  WorkerBehavior,
  type Behavior, type BehaviorContext, type BehaviorOutput,
} from './behaviors'
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
  worker: 'postgresql',
  postgresql: null,
}

const NODE_ORDER = ['client', 'gateway', 'redis', 'worker', 'postgresql'] as const

// Amount a packet moves on every tick (0 → 1)
const ANIMATION_STEP = 0.33

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
}

export class SimulationEngine {
  private nodes = new Map<string, NodeEntry>()  // All nodes in the pipeline
  private behaviors = new Map<string, Behavior>()
  private eventBus = new EventBus()
  private inFlight: InFlightEntry[] = []  // Packets currently moving between nodes
  private _changeCount = 0
  private tickCount = 0
  private listeners = new Set<() => void>()

  constructor() {
    for (const id of NODE_ORDER) {
      this.nodes.set(id, { state: 'idle', queue: [] })
    }
    this.behaviors.set('client', new ClientBehavior())
    this.behaviors.set('gateway', new GatewayBehavior())
    this.behaviors.set('redis', new RedisBehavior())
    this.behaviors.set('worker', new WorkerBehavior())
    this.behaviors.set('postgresql', new PostgresBehavior())

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
        tick: this.tickCount,
        queue: entry.queue,
        state: entry.state,
        setState: (state) => { entry.state = state },
        emitEvent: (event) => this.eventBus.emit({ tick: this.tickCount, ...event }),
      }
      const output = behavior.onTick(ctx)

      // Only keep nodes that actually did something.
      if (output.emit || output.processed) {
        outputs.push({ nodeId, output })
      }
    }

    // Step 2: Send packets to their next destination.
    for (const { nodeId, output } of outputs) {
      const route = (pkt: Packet, target: string | null) => {
        if (target === null) return
        this.inFlight.push({
          id: pkt.id,
          fromNodeId: nodeId,
          toNodeId: target,
          progress: 0,
          packet: pkt,
        })
      }

      // Newly created packets.
      for (const packet of output.emit ?? []) {
        route(packet, ROUTE_MAP[nodeId])
      }

      // Successfully processed packets.
      for (const { packet, result } of output.processed ?? []) {
        if (result === 'success') {
          route(packet, ROUTE_MAP[nodeId])
        }
      }
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

    this.notify()
  }

  private notify() {
    this._changeCount++
    this.listeners.forEach((cb) => cb())
  }
}

export const engine = new SimulationEngine()
