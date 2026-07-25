/**
 * Shell → GPU Lab image-seed handoff via sessionStorage.
 * Carries Pass-1 hints + ephemeral conditioned PNG (never persisted server-side).
 */

export const IMAGE_SEED_STORAGE_KEY = 'psyfi.imageSeed.v1'

export interface ImageSeedHandoffV1 {
  schema: 'psyfi.imageSeed.v1'
  master_seed: number
  influence: number
  parameter_hints?: Record<string, number>
  conditioned_texture_png_base64?: string | null
  substance?: string
  experience_id?: string | null
  mode?: string
  features?: Record<string, unknown>
}

export function writeImageSeedHandoff(payload: Omit<ImageSeedHandoffV1, 'schema'>): void {
  if (typeof sessionStorage === 'undefined') return
  const doc: ImageSeedHandoffV1 = { schema: 'psyfi.imageSeed.v1', ...payload }
  try {
    sessionStorage.setItem(IMAGE_SEED_STORAGE_KEY, JSON.stringify(doc))
  } catch {
    // quota / private mode — ignore
  }
}

export function readImageSeedHandoff(
  storage: Storage | null = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
): ImageSeedHandoffV1 | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(IMAGE_SEED_STORAGE_KEY)
    if (!raw) return null
    const doc = JSON.parse(raw) as ImageSeedHandoffV1
    if (!doc || doc.schema !== 'psyfi.imageSeed.v1') return null
    if (typeof doc.master_seed !== 'number') return null
    return doc
  } catch {
    return null
  }
}

export function clearImageSeedHandoff(
  storage: Storage | null = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
): void {
  try {
    storage?.removeItem(IMAGE_SEED_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
