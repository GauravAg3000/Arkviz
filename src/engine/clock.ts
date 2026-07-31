/*
* Clock will drive the entire simulator - It's the heartbeat
* Every component/node will simply react to this clock.
*/
type TickCallback = () => void

export class Clock {
  private baseInterval: number
  private multiplier: number
  private _tick: number
  private _isPaused: boolean
  private intervalId: ReturnType<typeof setInterval> | null
  private subscribers: Set<TickCallback>
  private _changeCount: number

  constructor(baseInterval = 100) {
    this.baseInterval = baseInterval
    this.multiplier = 1
    this._tick = 0
    this._isPaused = false
    this.intervalId = null
    this.subscribers = new Set()
    this._changeCount = 0
  }

  get isPaused() { return this._isPaused }
  get tick() { return this._tick }
  get speed() { return this.multiplier }
  get changeCount() { return this._changeCount }

  // starts the timer
  start() {
    if (this.intervalId !== null) return
    this.intervalId = setInterval(() => this.#tick(), this.baseInterval / this.multiplier)
  }

  // kills the timer
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  pause() {
    this._isPaused = true
    this.stop()
    this.#notify()
  }

  resume() {
    this._isPaused = false
    this.start()
    this.#notify()
  }

  setSpeed(multiplier: number) {
    this.multiplier = multiplier
    if (this.intervalId !== null) {
      this.stop()
      this.start()
    }
  }

  onTick(cb: TickCallback): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  #tick() {
    this._tick++
    this.#notify()
  }

  #notify() {
    this._changeCount++
    this.subscribers.forEach(cb => cb())
  }

  reset() {
    this.stop();
    this._tick = 0;
    this._isPaused = false
    this.#notify()
  }
}

export const clock = new Clock()
