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
 */
export const NODE_POSITIONS: NodePosition[] = [
  { id: 'client',     label: 'Client',     x: 100, y: 510 },
  { id: 'gateway',    label: 'Gateway',    x: 310, y: 510 },
  { id: 'redis',      label: 'Redis',      x: 520, y: 510 },
  { id: 'worker',     label: 'Worker',     x: 730, y: 510 },
  { id: 'dlq',        label: 'DLQ',        x: 630, y: 150 },
  { id: 'postgresql', label: 'PostgreSQL', x: 910, y: 150 },
  { id: 'mongodb',    label: 'MongoDB',    x: 380, y: 270 },
  { id: 'db_router',  label: 'DB Router',  x: 630, y: 270 },
  { id: 'healer',     label: 'Healer',     x: 380, y: 390 },
]

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

export const NODE_COLORS: Record<string, string> = {
  client: '#00F0FF',
  gateway: '#00F0FF',
  redis: '#FF2E54',
  worker: '#00F0FF',
  db_router: '#A855F7',
  postgresql: '#A855F7',
  mongodb: '#00FF9D',
  healer: '#00FF9D',
  dlq: '#A855F7',
}

export const CANVAS_WIDTH = 1100
export const CANVAS_HEIGHT = 680

export const NODE_MAP: Record<string, { x: number; y: number }> = Object.fromEntries(
  NODE_POSITIONS.map(n => [n.id, { x: n.x, y: n.y }])
)

export const NODE_GLOWS: Record<string, string> = {
  client: '0 0 12px rgba(0, 240, 255, 0.35)',
  gateway: '0 0 12px rgba(0, 240, 255, 0.35)',
  redis: '0 0 12px rgba(255, 46, 84, 0.4)',
  worker: '0 0 12px rgba(0, 240, 255, 0.35)',
  db_router: '0 0 12px rgba(168, 85, 247, 0.35)',
  postgresql: '0 0 12px rgba(168, 85, 247, 0.35)',
  mongodb: '0 0 12px rgba(0, 255, 157, 0.35)',
  healer: '0 0 12px rgba(0, 255, 157, 0.35)',
  dlq: '0 0 12px rgba(168, 85, 247, 0.35)',
}
