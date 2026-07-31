import type { Packet } from '../types'

let nextId = 1042

export function createPacket(opts?: { poisoned?: boolean }): Packet {
  return {
    id: `#${nextId++}`,
    status: 'in_flight',
    route: [],
    createdAt: Date.now(),
    poisoned: opts?.poisoned ?? false,
  }
}

export function addHop(packet: Packet, nodeId: string) {
  packet.route.push({ nodeId, enteredAt: Date.now() })
}