// Health of the node (Worker, Redis, PostgreSQL, MongoDB, Client)
export type NodeState = 'idle' | 'processing' | 'failed' | 'recovering'

// Result returned by the Worker after attempting to insert into PostgreSQL
export type InsertResult = 'success' | 'connection_failure' | 'invalid_data'

/** One event moving through the entire pipeline. */
export interface Packet {
  id: string
  poisoned: boolean
}

/** A packet currently being animated between two nodes. */
export interface InFlightPacket {
  id: string
  from: string
  to: string
  progress: number
}
