import type { Packet } from '../types'

let nextId = 1042

export function createPacket(opts?: { poisoned?: boolean }): Packet {
  return {
    id: `#${nextId++}`,
    poisoned: opts?.poisoned ?? false,
  }
}
