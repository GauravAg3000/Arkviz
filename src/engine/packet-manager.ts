import type { TickPayload } from './clock'
import { clock } from './clock'
import { createPacket } from './packet'

// Every packet follows this path.
const HARDCODED_PATH = ['client', 'gateway', 'redis', 'worker', 'postgresql']

// Create one packet every 10 clock ticks.
const EMIT_INTERVAL = 10

// Move packet by 25% every tick
const PROGRESS_STEP = 0.25

// animation state of a moving packet
interface InFlight {
  id: string
  pathIndex: number
  progress: number
}

export class PacketManager {
  // inFlight will have all packets currently moving through the pipeline
  private inFlight: InFlight[] = []

  /* _changeCount 
  * Incremented whenever packets change.
  * React watches this to know when to re-render
  */ 
  private _changeCount = 0
  private tickCount = 0
  private listeners = new Set<() => void>()

  get changeCount() { return this._changeCount }

  // Returns packet positions
  getPackets() {
    return this.inFlight.map(packet => ({
      id: packet.id,
      from: HARDCODED_PATH[packet.pathIndex],
      to: HARDCODED_PATH[Math.min(packet.pathIndex + 1, HARDCODED_PATH.length - 1)],
      progress: packet.progress,
    }))
  }

  onChange(cb: () => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  // Called automatically on every clock tick.
  onTick(_payload: TickPayload) {
    this.tickCount++

    // Emit a new packet every 10 ticks.
    if (this.tickCount % EMIT_INTERVAL === 0) {
      this.inFlight.push({
        id: createPacket().id,
        pathIndex: 0,
        progress: 0,
      })
    }

    // Update every moving packet.
    for (let i = this.inFlight.length - 1; i >= 0; i--) {
      const packet = this.inFlight[i]
      packet.progress += PROGRESS_STEP

      // Packet reached the next node
      if (packet.progress >= 1) {
        packet.pathIndex++
        packet.progress = 0

        // Packet reached PostgreSQL -> Remove it from the simulation.
        if (packet.pathIndex >= HARDCODED_PATH.length - 1) {
          this.inFlight.splice(i, 1)
        }
      }
    }

    this._changeCount++
    this.listeners.forEach(cb => cb())
  }

  reset() {
    this.inFlight = []
    this.tickCount = 0
    this._changeCount++
    this.listeners.forEach(cb => cb())
  }
}

export const packetManager = new PacketManager()
// Every clock tick updates the simulation
clock.onTick(p => packetManager.onTick(p))
