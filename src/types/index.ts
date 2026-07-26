// Health of the node (Worker, Redis, PostgreSQL, MongoDB, Client)
export type NodeState = 'idle' | 'processing' | 'failed' | 'recovering'

// Result returned by the Worker after attempting to insert into PostgreSQL
export type InsertResult = 'success' | 'connection_failure' | 'invalid_data'

/**
 * Represents the lifecycle of a packet.
 * - in_flight: Being animated between nodes
 * - queued: Sitting in a node's queue
 * - processed: Successfully reached PostgreSQL
 * - failed: Processing failed somewhere in the pipeline
 */
export type PacketStatus = 'in_flight' | 'queued' | 'processed' | 'failed' | 'dead_lettered'

/** One stop in a packet's journey. */
export interface RouteHop {
  nodeId: string
  enteredAt: number
}

/** One event moving through the entire pipeline. */
export interface Packet {
  id: string
  status: PacketStatus
  route: RouteHop[]
  createdAt: number
}

/** A packet currently being animated between two nodes. */
export interface InFlightPacket {
  id: string
  from: string
  to: string
  progress: number
}

/** A simulated service (Redis, Worker, MongoDB, PostgreSQL, Client). */
export interface SimNode {
  id: string
  state: NodeState
  queue: Packet[]
}
