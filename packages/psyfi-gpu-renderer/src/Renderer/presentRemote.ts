/**
 * Present-worker remoting protocol (OffscreenCanvas → dedicated present worker).
 * CI uses an in-process FakeWorker; production worker WebGPU present stays deferred.
 */

export type PresentRemoteRequest =
  | { type: 'init'; seq: number; tier?: string; dpr?: number; deferred?: boolean }
  | { type: 'snapshot'; seq: number; snapshotId?: string }
  | { type: 'resize'; seq: number; width: number; height: number }
  | { type: 'dispose'; seq: number }

export type PresentRemoteResponse =
  | { type: 'ready'; seq: number; mode: 'worker-remoting' | 'worker-deferred' }
  | { type: 'frame'; seq: number; cpuMs: number; droppedStale: number }
  | { type: 'error'; seq: number; code: 'unsupported' | 'transfer-failed' | 'disposed' | string }

export type PresentRemotePort = {
  postMessage: (msg: PresentRemoteRequest | PresentRemoteResponse, transfer?: Transferable[]) => void
  addEventListener: (type: 'message', fn: (ev: { data: PresentRemoteRequest | PresentRemoteResponse }) => void) => void
  removeEventListener: (type: 'message', fn: (ev: { data: PresentRemoteRequest | PresentRemoteResponse }) => void) => void
  terminate?: () => void
}

/** In-process stub that acknowledges remoting but does not own WebGPU. */
export function createPresentRemoteStub(opts?: { support?: boolean }): PresentRemotePort {
  const support = opts?.support !== false
  const listeners = new Set<(ev: { data: PresentRemoteResponse }) => void>()
  const port: PresentRemotePort = {
    postMessage(msg) {
      const req = msg as PresentRemoteRequest
      queueMicrotask(() => {
        if (!support) {
          emit({ type: 'error', seq: req.seq, code: 'unsupported' })
          return
        }
        if (req.type === 'init') {
          emit({
            type: 'ready',
            seq: req.seq,
            mode: req.deferred === false ? 'worker-remoting' : 'worker-deferred',
          })
          return
        }
        if (req.type === 'dispose') {
          emit({ type: 'error', seq: req.seq, code: 'disposed' })
          return
        }
        if (req.type === 'snapshot' || req.type === 'resize') {
          emit({ type: 'frame', seq: req.seq, cpuMs: 0.5, droppedStale: 0 })
        }
      })
    },
    addEventListener(_type, fn) {
      listeners.add(fn as (ev: { data: PresentRemoteResponse }) => void)
    },
    removeEventListener(_type, fn) {
      listeners.delete(fn as (ev: { data: PresentRemoteResponse }) => void)
    },
    terminate() {
      listeners.clear()
    },
  }
  function emit(data: PresentRemoteResponse) {
    for (const fn of listeners) fn({ data })
  }
  return port
}

export function createPresentRemoteClient(port: PresentRemotePort) {
  let seq = 0
  const waiters = new Map<number, (msg: PresentRemoteResponse) => void>()
  const onMessage = (ev: { data: PresentRemoteRequest | PresentRemoteResponse }) => {
    const data = ev.data as PresentRemoteResponse
    if (!data || typeof data !== 'object' || !('seq' in data)) return
    const wait = waiters.get(data.seq)
    if (wait) {
      waiters.delete(data.seq)
      wait(data)
    }
  }
  port.addEventListener('message', onMessage)

  async function request(msg: PresentRemoteRequest) {
    return new Promise<PresentRemoteResponse>((resolve) => {
      waiters.set(msg.seq, resolve)
      port.postMessage(msg)
    })
  }

  function nextSeq(): number {
    seq += 1
    return seq
  }

  return {
    async init(opts?: { tier?: string; deferred?: boolean }) {
      return request({
        type: 'init',
        seq: nextSeq(),
        tier: opts?.tier,
        deferred: opts?.deferred !== false,
      })
    },
    async snapshot(snapshotId?: string) {
      return request({ type: 'snapshot', seq: nextSeq(), snapshotId })
    },
    async resize(width: number, height: number) {
      return request({ type: 'resize', seq: nextSeq(), width, height })
    },
    async dispose() {
      return request({ type: 'dispose', seq: nextSeq() })
    },
    close() {
      port.removeEventListener('message', onMessage)
      port.terminate?.()
    },
  }
}
