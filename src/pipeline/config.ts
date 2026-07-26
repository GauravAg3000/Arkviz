/**
 * Describes where a node should be rendered.
 * {
 *   id: "redis",
 *   label: "Redis",
 *   x: 420, y: 280; (x,y) represents centre of the node 
 * }
 * 
 */
export interface NodePosition {
  id: string
  label: string
  x: number
  y: number
}

/**
 * Represents a connection (edge) between two nodes.
 * {
 *   from: "worker",
 *   to: "postgresql",
 * }
 */
export interface ConnectionDef {
  from: string
  to: string
}

/**
 * Pipeline node layout.
 * React iterates over this array to render each node.
 */
export const NODE_POSITIONS: NodePosition[] = [
  { id: 'client', label: 'Client', x: 60, y: 280 },
  { id: 'gateway', label: 'Gateway', x: 240, y: 280 },
  { id: 'redis', label: 'Redis', x: 420, y: 280 },
  { id: 'worker', label: 'Worker', x: 600, y: 280 },
  { id: 'db_router', label: 'DB Router', x: 750, y: 280 },
  { id: 'postgresql', label: 'PostgreSQL', x: 800, y: 120 },
  { id: 'mongodb', label: 'MongoDB', x: 660, y: 440 },
  { id: 'healer', label: 'Healer', x: 660, y: 580 },
  { id: 'dlq', label: 'DLQ', x: 880, y: 440 },
];

/**
 * Node connections used for visualization.
 */
export const CONNECTIONS: ConnectionDef[] = [
  { from: 'client', to: 'gateway' },
  { from: 'gateway', to: 'redis' },
  { from: 'redis', to: 'worker' },
  { from: 'worker', to: 'db_router' },
  { from: 'db_router', to: 'postgresql' },
  { from: 'db_router', to: 'mongodb' },
  { from: 'db_router', to: 'dlq' },
  { from: 'mongodb', to: 'healer' },
  { from: 'healer', to: 'postgresql' },
]

/**
 * Color for each node.
 */
export const NODE_COLORS: Record<string, string> = {
  client: '#6366f1',
  gateway: '#8b5cf6',
  redis: '#ef4444',
  worker: '#f59e0b',
  db_router: '#a855f7',
  postgresql: '#3b82f6',
  mongodb: '#10b981',
  healer: '#14b8a6',
  dlq: '#6b7280',
}