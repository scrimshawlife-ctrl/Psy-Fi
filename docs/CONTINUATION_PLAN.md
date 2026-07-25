# PsyFi Web Continuation Plan

Status: active (reaudit 2026-07-25)  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`); Azure/Render paths removed (#28).

## Baseline (on `main`)

| Area | State |
| --- | --- |
| `/api/v1` + soft freeze | Done (`psyfi-api-v1-soft-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | Done + last-sim source plane (#25) |
| Phenomenology overlays | Done for 7 substances / ~39 recipes |
| GPU platform G0 | Scaffolded (#26): R3F host, scene-snapshot API, `/gpu/` mount |
| Hallmark README + design skill | Done (#24, #19) |
| CI | pytest + OpenAPI path gate + hallmark + `gpu:test` / `gpu:typecheck` |
| Open PRs / issues | None |
| Tests | 71 passed (automated) |

## Human gates (block hard freeze)

1. Fill physical-device rows in `docs/BROWSER_CAPABILITY_MATRIX.md` (Safari iOS, Chrome Android, Chrome/Edge/Firefox desktop)
2. Fill evidence log in `docs/PHASE4_USABILITY.md`
3. Then promote soft freeze → **hard freeze** in `docs/contracts/frozen/`

## Engineering queue (prioritized)

### P0 — fix before treating `/gpu/` as shippable

1. **Wire GPU safety clamp** — `safety_clamp.wgsl` exists but `PostStack` / render-graph passes are no-ops; Neutral/safety must execute on the present path  
   (`packages/psyfi-gpu-renderer/src/PostProcessing/*`, `shaders/wgsl/post/safety_clamp.wgsl`)
2. **Fix Compose healthcheck** — `docker-compose.yml` calls `curl`; slim image has none (Dockerfile already uses urllib)

### P1 — GPU G1 + packaging

3. **GPU G1 present path** — real bloom / color grading / PBE exposure / tier probes; replace WGSL one-liners  
   (`docs/rendering/ROADMAP.md` G1)
4. **CI `gpu:build` + optional Docker copy of `dist/`** so `/gpu/` is present in containers
5. **Stronger freeze drift tests** — living↔frozen body equality for OpenAPI + `psyfi_scene_snapshot.v1` (paths-only today)

### P2 — content & polish

6. **More positive phenomenology packs** for underrepresented preset substances (overlays today: lsd, psilocybin, dmt, 5-meo-dmt, mescaline, ketamine, pcp; many presets have no recipes)
7. Legacy WebGL 1:1 engine shaders — optional; do not block GPU track
8. Optional audio / haptics modulators (camera/motion/MIDI already wired)
9. Phase 4 structured usability → hard freeze

### Explicitly out of scope now

- Native iOS (`docs/IOS_MIGRATION.md`)
- Patching legacy `experiencePlayer.js` toward the GPU stack
- Azure / Render / Fly / Railway one-click hosts

## Recommended next slice

**P0 pair:** Compose healthcheck fix + mandatory GPU safety pass on the R3F present path (still no medical claims; ParameterField remains authority via scene snapshots).

Then **G1:** bloom + grading + exposure + Battery/Balanced probe, with `npm run gpu:build` in CI.

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
