/**
 * G4 cutover parity matrix — ship-critical flows vs legacy Live Experience.
 * Kept as data so CI can assert no unknown statuses remain.
 */

export type ParityStatus = 'yes' | 'partial' | 'n/a' | 'deferred'

export interface ParityRow {
  capability: string
  legacy: ParityStatus
  gpu: ParityStatus
  notes: string
}

export const G4_PARITY_ROWS: ParityRow[] = [
  {
    capability: 'ParameterField authority',
    legacy: 'yes',
    gpu: 'yes',
    notes: 'scene-snapshot ParameterField is source of truth',
  },
  {
    capability: 'Safety attenuator / Neutral View',
    legacy: 'yes',
    gpu: 'yes',
    notes: 'PresentPipeline safety pass + neutral_view flag',
  },
  {
    capability: 'Substance overlays (13)',
    legacy: 'yes',
    gpu: 'yes',
    notes: 'via snapshot procedural + phenomenology catalog',
  },
  {
    capability: 'Modulators (cam/motion/MIDI/audio/haptics)',
    legacy: 'yes',
    gpu: 'partial',
    notes: 'intensity/seed/mode wired; MIDI/haptics still legacy-shell primary',
  },
  {
    capability: 'Reduce motion',
    legacy: 'yes',
    gpu: 'yes',
    notes: 'publish path prefers-reduced-motion → snapshot',
  },
  {
    capability: 'Offline / PWA',
    legacy: 'yes',
    gpu: 'partial',
    notes: '/gpu/ separate route; embed-vs-route decision open',
  },
  {
    capability: 'KTX2 / Draco optional assets',
    legacy: 'n/a',
    gpu: 'partial',
    notes: 'upload + SceneAssetLayer; Python assets[] empty by default',
  },
]

/** Canonical seeds for future /gpu/ visual goldens (aligned with overlay suite). */
export const G4_VISUAL_SEEDS = [
  { substance: 'lsd', mode: 'open', seed: 42, intensity: 0.75 },
  { substance: 'psilocybin', mode: 'attractor', seed: 7, intensity: 0.6 },
  { substance: 'dmt', mode: 'void', seed: 99, intensity: 0.85 },
] as const

export function parityHasUnknown(rows: ParityRow[] = G4_PARITY_ROWS): boolean {
  return rows.some((r) => !r.legacy || !r.gpu || !r.capability)
}

export function parityShipBlockers(rows: ParityRow[] = G4_PARITY_ROWS): ParityRow[] {
  // Ship-critical: authority + safety must be fully yes on both tracks.
  return rows.filter(
    (r) =>
      (r.capability.startsWith('ParameterField') || r.capability.startsWith('Safety')) &&
      (r.legacy !== 'yes' || r.gpu !== 'yes'),
  )
}
