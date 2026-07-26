export interface SimEvent {
  tick: number
  nodeId: string
  type: string
  message: string
}

/**
 * Stores recent simulation events.
 * Used by the Event Log to show what happened during the simulation.
 */
export class EventBus {
  private events: SimEvent[] = []
  private maxEvents = 100
  private _version = 0

  get version() { return this._version }

  /**
   * Add a new event.
   * If the limit is reached, remove the oldest event.
   */
  emit(event: SimEvent) {
    this.events.push(event)
    this._version++
    if (this.events.length > this.maxEvents) this.events.shift()
  }

  getAll(): SimEvent[] {
    return this.events
  }

  clear() {
    this.events = []
    this._version = 0
  }
}
