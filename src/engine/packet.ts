import type { Packet } from '../types'

let nextId = 1042

export function createPacket(): Packet {
  return {
    id: `#${nextId++}`,
    status: 'in_flight',
    route: [],
    createdAt: Date.now(),
  }
}

export function addHop(packet: Packet, nodeId: string) {
  packet.route.push({ nodeId, enteredAt: Date.now() })
}