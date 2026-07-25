# Telemetry Policy

Status: stub implemented, **disabled by default**  
Related: [`PLANS.md`](../PLANS.md), `psyfi_api/telemetry.py`

## Gates

Telemetry is active only when **both** are true:

1. Server env `PSYFI_TELEMETRY_ENABLED=1`
2. Client opt-in via `POST /api/v1/telemetry/opt-in` `{ "opt_in": true }` (legacy: `/api/telemetry/opt-in`)

## Behavior

- Events are buffered in-process only (`/api/v1/telemetry/events`).
- No network sink, analytics vendor, or persistent disk log is configured.
- Obvious sensitive keys are stripped (`ip`, `authorization`, field payloads, etc.).
- Opting out clears the local buffer.

## Allowed event names (current)

- `simulate_job_created`
- `simulate_completed`
- `simulate_cancelled`

## Governance

Do not enable in production until a privacy policy and data map exist. This stub exists so Phase 1 can mark the telemetry work item without shipping surveillance by default.
