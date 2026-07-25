import { useSyncExternalStore } from 'react'
import { engine, type EngineSnapshot } from '../../engine/simulation-engine'

export function useEngine(): EngineSnapshot {
  const subscribe = (onStoreChange: () => void) => engine.onChange(onStoreChange)
  const getSnapshot = () => engine.changeCount
  useSyncExternalStore(subscribe, getSnapshot)
  return engine.getSnapshot()
}
