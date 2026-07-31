export type FailureType = 'pg_down' | 'worker_crash' | 'worker_invalid'

export class ChaosController {
  private failures = new Map<string, Set<FailureType>>()

  /** Inject a failure into the simulation. */
  injectFailure(nodeId: string, type: FailureType) {
    let types = this.failures.get(nodeId)
    if (!types) {
      types = new Set()
      this.failures.set(nodeId, types)
    }
    types.add(type)
  }

  restoreFailure(nodeId: string, type: FailureType) {
    const types = this.failures.get(nodeId)
    if (!types) return
    types.delete(type)
    if (types.size === 0) this.failures.delete(nodeId)
  }

  hasFailure(nodeId: string, type?: FailureType): boolean {
    if (type) {
      const types = this.failures.get(nodeId)
      return types ? types.has(type) : false
    }
    return this.failures.has(nodeId)
  }

  clear() {
    this.failures.clear()
  }
}

export const chaos = new ChaosController()
