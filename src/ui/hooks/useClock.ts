import { useSyncExternalStore } from 'react'
import { clock } from '../../engine/clock'

export function useClock() {
  const subscribe = (onStoreChange: () => void) => clock.onTick(onStoreChange)
  const getSnapshot = () => clock.changeCount
  useSyncExternalStore(subscribe, getSnapshot)

  return {
    tick: clock.tick,
    isPaused: clock.isPaused,
    speed: clock.speed,
    pause: () => clock.pause(),
    resume: () => clock.resume(),
    setSpeed: (s: number) => clock.setSpeed(s),
  }
}