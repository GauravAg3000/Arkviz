// Which failure was triggered on a node
export type FailureType = 'pg_down' | 'worker_slow' | 'worker_crash'

export class ChaosController {
  // Each entry records an active failure on a specific node.
  private failures = new Map<string, FailureType>()

  /** Inject a failure into the simulation. */
  injectFailure(nodeId: string, type: FailureType) {
    this.failures.set(nodeId, type)
  }

  /** Remove all failures from a node. */
  restoreNode(nodeId: string) {
    this.failures.delete(nodeId)
  }

  /** Check if a failure is active. Optionally filter by type. */
  hasFailure(nodeId: string, type?: FailureType): boolean {
    if (type) return this.failures.get(nodeId) === type
    return this.failures.has(nodeId)
  }

  /** Return all active failures for the UI / snapshot. */
  getActiveFailures(): Array<{ nodeId: string; type: FailureType }> {
    return Array.from(this.failures.entries()).map(([nodeId, type]) => ({
      nodeId,
      type,
    }))
  }

  /** Remove every active failure (used on reset). */
  clear() {
    this.failures.clear()
  }
}

export const chaos = new ChaosController()
