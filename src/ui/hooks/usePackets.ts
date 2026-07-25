import { useSyncExternalStore } from 'react'
import { packetManager } from '../../engine/packet-manager'

export function usePackets() {
  /* 
  * Subscribe React to packetmanager
  * react re-renders if the changeCount changes.
  */ 
  const subscribe = (onStoreChange: () => void) => packetManager.onChange(onStoreChange)
  const getSnapshot = () => packetManager.changeCount

  useSyncExternalStore(subscribe, getSnapshot)

  // return latest packet positions
  return packetManager.getPackets()
}