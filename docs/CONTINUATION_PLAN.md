# PsyFi Web Continuation Plan

Status: active (P0–P2 engineering slice landed; human gates remain)  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`); Azure/Render paths removed (#28).

## Baseline (on this branch / next `main`)

| Area | State |
| --- | --- |
| `/api/v1` + soft freeze | Done (`psyfi-api-v1-soft-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | Done + last-sim source plane (#25) |
| Phenomenology overlays | Expanded (13 overlay substances; MDMA / 2C-x / AL-LAD / MXE / MDA packs) |
| GPU platform G0→G1 | Present path: bloom / grade / exposure + mandatory safety; Battery probe |
| Hallmark README + design skill | Done (#24, #19) |
| CI | pytest + OpenAPI path gate + hallmark + `gpu:test` / `gpu:typecheck` / `gpu:build` |
| Docker | Multi-stage bake of `@psyfi/gpu-renderer` `dist/`; urllib healthcheck |
| Modulators | Camera / motion / MIDI / **audio** / **haptics** (ParameterField-only) |
| Human gates | Device matrix + Phase 4 usability still open |

## Human gates (block hard freeze)

1. Fill physical-device rows in `docs/BROWSER_CAPABILITY_MATRIX.md` (Safari iOS, Chrome Android, Chrome/Edge/Firefox desktop)
2. Fill evidence log in `docs/PHASE4_USABILITY.md`
3. Then promote soft freeze → **hard freeze** in `docs/contracts/frozen/`

## Engineering queue

### P0 — done

1. ~~Wire GPU safety clamp~~ — mandatory `uSafety` attenuator on WebGPU present path (`PresentPipeline`)
2. ~~Fix Compose healthcheck~~ — `docker-compose.yml` uses Python urllib (no curl)

### P1 — done

3. ~~GPU G1 present path~~ — bloom + color grading + exposure + Battery/Balanced probe
4. ~~CI `gpu:build` + Docker `dist/`~~ — workflow + multi-stage Dockerfile
5. ~~Stronger freeze drift tests~~ — living↔frozen body equality for OpenAPI + scene/field/frame + overlays

### P2 — mostly done (automation)

6. ~~More positive phenomenology packs~~ — underrepresented presets seeded + catalog rebuilt
7. Legacy WebGL 1:1 engine shaders — optional; still deferred (do not block GPU track)
8. ~~Optional audio / haptics modulators~~ — API + shell + ParameterField mapping
9. Phase 4 structured usability → hard freeze — **human**

### Explicitly out of scope now

- Native iOS (`docs/IOS_MIGRATION.md`)
- Patching legacy `experiencePlayer.js` toward the GPU stack
- Azure / Render / Fly / Railway one-click hosts

## Recommended next slice

**Human gates:** device matrix rows + Phase 4 usability evidence, then hard freeze.

Optional engineering: G2 compute density, or legacy WebGL 1:1 shaders if product still needs them.

## Commands

```bash
python3 -m pytest tests/ -q
npm test && npm run gpu:test && npm run gpu:typecheck
npm run gpu:build
docker compose up -d --build
python3 scripts/run_dev_server.py
# /        legacy shell
# /gpu/    GPU platform (after build)
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
