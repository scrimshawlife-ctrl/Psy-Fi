/// <reference lib="webworker" />
import { decodeAssetBytes } from './decodeAsset'
import type { AssetKind } from './AssetLoader'

type InMsg =
  | { type: 'load'; id: string; url: string; kind: AssetKind }
  | { type: 'abort'; id: string }

const controllers = new Map<string, AbortController>()

self.onmessage = async (ev: MessageEvent<InMsg>) => {
  const msg = ev.data
  if (msg.type === 'abort') {
    controllers.get(msg.id)?.abort()
    controllers.delete(msg.id)
    return
  }
  if (msg.type !== 'load') return

  const ac = new AbortController()
  controllers.set(msg.id, ac)
  try {
    const res = await fetch(msg.url, { signal: ac.signal })
    if (!res.ok) throw new Error(`asset ${msg.id}: ${res.status}`)
    const bytes = await res.arrayBuffer()
    const meta = decodeAssetBytes(msg.kind, bytes)
    const transfer = [bytes]
    ;(self as DedicatedWorkerGlobalScope).postMessage(
      { type: 'ok', id: msg.id, kind: msg.kind, bytes, meta },
      transfer,
    )
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    ;(self as DedicatedWorkerGlobalScope).postMessage({
      type: 'error',
      id: msg.id,
      error,
    })
  } finally {
    controllers.delete(msg.id)
  }
}
