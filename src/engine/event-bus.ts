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
  // Keep the most recent events in memory
  private events: SimEvent[] = []
  private maxEvents = 100

  /**
   * Add a new event.
   * If the limit is reached, remove the oldest event.
   */
  emit(event: SimEvent) {
    this.events.push(event)
    if (this.events.length > this.maxEvents) this.events.shift()
  }

  getAll(): SimEvent[] {
    return this.events
  }

  clear() {
    this.events = []
  }
}
