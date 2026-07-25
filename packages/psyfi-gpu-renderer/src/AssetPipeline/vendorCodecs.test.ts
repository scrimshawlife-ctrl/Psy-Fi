import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  Draco3dWasmDecoder,
  encodeDracoTriangle,
  createDracoWasmDecoder,
} from './dracoBridge'
import { createBasisTranscoder, VendorBasisTranscoder } from './basisTranscoder'
import { planDracoMeshUpload } from './uploadPlan'
import { VENDOR_BASIS_FS, VENDOR_DRACO_GLTF_FS } from './vendorPaths'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

describe('vendored GPU codecs', () => {
  it('ships Draco glTF + Basis WASM under public/vendor', () => {
    expect(existsSync(join(repoRoot, VENDOR_DRACO_GLTF_FS, 'draco_decoder.wasm'))).toBe(true)
    expect(existsSync(join(repoRoot, VENDOR_DRACO_GLTF_FS, 'draco_wasm_wrapper.js'))).toBe(true)
    expect(existsSync(join(repoRoot, VENDOR_BASIS_FS, 'basis_transcoder.wasm'))).toBe(true)
    expect(existsSync(join(repoRoot, VENDOR_BASIS_FS, 'basis_transcoder.js'))).toBe(true)
  })

  it('decodes a real Draco bitstream with draco3d WASM', async () => {
    const bitstream = await encodeDracoTriangle()
    const decoder = createDracoWasmDecoder({ mode: 'wasm' })
    expect(decoder).toBeInstanceOf(Draco3dWasmDecoder)
    const plan = await planDracoMeshUpload('tri', bitstream, decoder)
    expect(plan.kind).toBe('mesh')
    if (plan.kind !== 'mesh') return
    expect(plan.decoder).toBe('wasm')
    const pos = plan.attributes.find((a) => a.name === 'POSITION')
    expect(pos?.itemSize).toBe(3)
    expect(pos?.array.length).toBe(9)
    expect(plan.indices?.length).toBe(3)
    decoder.dispose()
  })

  it('initializes the vendored Basis transcoder module', async () => {
    const transcoder = createBasisTranscoder({ mode: 'wasm' })
    expect(transcoder).toBeInstanceOf(VendorBasisTranscoder)
    await transcoder.ensureReady?.()
    expect(transcoder.ready).toBe(true)
    expect(transcoder.kind).toBe('wasm')
    transcoder.dispose()
  })
})
