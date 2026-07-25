/**
 * Present worker stub — protocol only until WebGPU present moves off-main.
 * Real OffscreenCanvas + WebGPURenderer ownership stays deferred.
 */

import type { PresentRemoteRequest, PresentRemoteResponse } from './presentRemote'

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (ev: MessageEvent<PresentRemoteRequest>) => {
  const msg = ev.data
  if (!msg || typeof msg !== 'object' || !('type' in msg)) return
  const reply = (data: PresentRemoteResponse) => ctx.postMessage(data)

  if (msg.type === 'init') {
    // Acknowledge remoting channel; mark deferred until GPU present is wired.
    reply({ type: 'ready', seq: msg.seq, mode: 'worker-deferred' })
    return
  }
  if (msg.type === 'dispose') {
    reply({ type: 'error', seq: msg.seq, code: 'disposed' })
    return
  }
  if (msg.type === 'snapshot' || msg.type === 'resize') {
    reply({ type: 'frame', seq: msg.seq, cpuMs: 0, droppedStale: 0 })
    return
  }
}
