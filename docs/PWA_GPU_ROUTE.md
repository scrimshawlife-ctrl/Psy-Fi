# PWA decision: `/gpu/` stays a separate route

Status: **decided** (2026-07-25)  
Related: [`MOBILE_PWA_GUIDE.md`](../MOBILE_PWA_GUIDE.md), [`rendering/G4_CUTOVER.md`](rendering/G4_CUTOVER.md), [`DESKTOP_GPU.md`](DESKTOP_GPU.md)

## Decision

**Keep the GPU platform at `/gpu/` as a separate navigable route.** Do **not** embed the R3F/WebGPU bundle inside the legacy Live Experience shell (`/`).

| Surface | URL | PWA role |
| --- | --- | --- |
| Installable shell + Live Experience | `/` (`start_url`) | Primary PWA |
| GPU Lab (WebGPU present path) | `/gpu/` | Progressive enhancement link |

## Why separate (not embed)

1. **Bundle isolation** — GPU `dist/` is large; embedding would inflate the installable shell and SW precache.
2. **Fallback clarity** — No WebGPU → stay on `/` (Canvas/WebGL). Separate route makes capability failure obvious.
3. **Authority unchanged** — Both surfaces consume `/api/v1` + ParameterField; embedding would not change simulation truth.
4. **SW strategy** — Shell precaches `/` + `/static/*`; `/gpu/` is network-first and not shell-precached.
5. **Cutover safety** — Hard-frozen API + legacy shell remain the offline/PWA baseline while `/gpu/` iterates.

## Runtime behavior

- Nav link **GPU Lab** on the shell points to `/gpu/`.
- Capabilities panel links to `/gpu/` when `navigator.gpu` is present.
- Manifest `start_url` remains `/` (standalone install opens the shell).
- Optional manifest **shortcut** “GPU Lab” → `/gpu/` for Chromium install menus.
- Offline: `/gpu/` navigation falls back to the cached shell (`/`), not a broken GPU SPA.
- Service worker is registered from **`/sw.js`** with `{ scope: '/' }` and served with `Service-Worker-Allowed: /` (scripts under `/static/` cannot control `/` or `/gpu/`).

## Non-goals

- Dual `start_url` / multi-manifest installs
- Embedding `<iframe src="/gpu/">` in the Live Experience panel
- Precaching the full GPU asset graph in the shell service worker

## Revisit when

- Pixel goldens + device Ultra QA show `/gpu/` ready to become the default desktop entry
- Bundle size drops enough that optional embed behind a flag is cheap
