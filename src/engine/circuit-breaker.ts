/* 
* A Circuit Breaker can be in one of three states.
* CLOSED     -> Everything is healthy. Requests are allowed.
* OPEN       -> Failures. Block the requests.
* HALF_OPEN  -> Try one request to see if the system has recovered.
*/
export type CBState = 'closed' | 'open' | 'half_open'

export class CircuitBreaker {
  private _state: CBState = 'closed'

  // Number of consecutive failures
  private _failureCount = 0

  /* 
  * Tick number when the breaker entered OPEN state.
  * Used to know when it's time to try HALF_OPEN.
  */
  private _openedAtTick = -1

  readonly threshold = 3

  // Stay OPEN for 100 ticks before allowing a probe.
  readonly timeoutTicks = 100

  get state() { return this._state }
  get failureCount() { return this._failureCount }

  // Should the Engine allow a request to the primary database?
  canTryPrimary(): boolean {
    if (this._state === 'closed') return true
    if (this._state === 'half_open') return true
    return false
  }

  recordSuccess() {
    if (this._state !== 'closed') {
      this._state = 'closed'
    }
    this._failureCount = 0
  }

  // Called whenever the primary database returns a failure.
  recordFailure(currentTick: number) {
    this._failureCount++
    if (this._failureCount >= this.threshold && this._state === 'closed') {
      this._state = 'open'
      this._openedAtTick = currentTick
    } else if (this._state === 'half_open') {
      // Probe request failed while HALF_OPEN.
      this._state = 'open'
      this._openedAtTick = currentTick
    }
  }

  // Called every simulation tick.
  onTick(currentTick: number) {
    if (this._state !== 'open') return
    if (currentTick - this._openedAtTick >= this.timeoutTicks) {
      this._state = 'half_open'
    }
  }

  reset() {
    this._state = 'closed'
    this._failureCount = 0
    this._openedAtTick = -1
  }
}
