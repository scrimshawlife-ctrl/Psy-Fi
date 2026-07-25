import { describe, expect, it } from 'vitest'
import { createPresentRemoteClient, createPresentRemoteStub } from './presentRemote'
import { resolveOffscreenPresentMode } from './offscreenPresent'

describe('present remoting protocol', () => {
  it('stub init returns worker-deferred ready', async () => {
    const port = createPresentRemoteStub()
    const client = createPresentRemoteClient(port)
    const res = await client.init({ tier: 'balanced' })
    expect(res.type).toBe('ready')
    if (res.type === 'ready') expect(res.mode).toBe('worker-deferred')
    client.close()
  })

  it('unsupported stub returns error', async () => {
    const port = createPresentRemoteStub({ support: false })
    const client = createPresentRemoteClient(port)
    const res = await client.init()
    expect(res.type).toBe('error')
    if (res.type === 'error') expect(res.code).toBe('unsupported')
    client.close()
  })

  it('snapshot/resize yield frame acks', async () => {
    const port = createPresentRemoteStub()
    const client = createPresentRemoteClient(port)
    await client.init()
    const frame = await client.snapshot('abc')
    expect(frame.type).toBe('frame')
    const resized = await client.resize(640, 400)
    expect(resized.type).toBe('frame')
    client.close()
  })

  it('resolveOffscreenPresentMode prefers worker when requested', () => {
    expect(
      resolveOffscreenPresentMode({
        requested: true,
        preferWorker: true,
        caps: { canTransfer: true, canWorker: true, preferMain: false },
      }),
    ).toBe('worker-remoting')
    expect(
      resolveOffscreenPresentMode({
        requested: true,
        preferWorker: true,
        caps: { canTransfer: true, canWorker: false, preferMain: false },
      }),
    ).toBe('worker-unsupported')
  })
})
