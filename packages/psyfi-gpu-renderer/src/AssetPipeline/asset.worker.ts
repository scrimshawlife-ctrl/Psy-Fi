/// <reference lib="webworker" />
import { decodeAssetBytes } from './decodeAsset'
import type { AssetKind } from './AssetLoader'

type InMsg =
  | { type: 'load'; id: string; url: string; kind: AssetKind; seq?: number }
  | { type: 'abort'; id: string; seq?: number }

type ControllerEntry = { ac: AbortController; seq: number }

const controllers = new Map<string, ControllerEntry>()

self.onmessage = async (ev: MessageEvent<InMsg>) => {
  const msg = ev.data
  if (msg.type === 'abort') {
    const entry = controllers.get(msg.id)
    if (!entry) return
    // Abort only the targeted generation when seq is provided.
    if (msg.seq != null && entry.seq !== msg.seq) return
    entry.ac.abort()
    if (msg.seq == null || entry.seq === msg.seq) {
      controllers.delete(msg.id)
    }
    return
  }
  if (msg.type !== 'load') return

  const seq = msg.seq ?? 0
  const ac = new AbortController()
  controllers.set(msg.id, { ac, seq })
  try {
    const res = await fetch(msg.url, { signal: ac.signal })
    if (!res.ok) throw new Error(`asset ${msg.id}: ${res.status}`)
    const bytes = await res.arrayBuffer()
    const meta = decodeAssetBytes(msg.kind, bytes)
    // Drop stale completions if a newer load replaced this id.
    const current = controllers.get(msg.id)
    if (!current || current.seq !== seq || current.ac !== ac) return
    const transfer = [bytes]
    ;(self as DedicatedWorkerGlobalScope).postMessage(
      { type: 'ok', id: msg.id, seq, kind: msg.kind, bytes, meta },
      transfer,
    )
  } catch (err) {
    const current = controllers.get(msg.id)
    if (!current || current.seq !== seq || current.ac !== ac) return
    const error = err instanceof Error ? err.message : String(err)
    ;(self as DedicatedWorkerGlobalScope).postMessage({
      type: 'error',
      id: msg.id,
      seq,
      error,
    })
  } finally {
    const current = controllers.get(msg.id)
    if (current && current.ac === ac) {
      controllers.delete(msg.id)
    }
  }
}
