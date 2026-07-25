# Bug-finding memories

Tracks critical bugs reported across automation runs. Keep only open or rejected PR entries.

| Bug (location + root cause) | PR | Status | Recorded |
|---|---|---|---|
| `GET /static/sw.js` registration had max scope `/static/`, so offline `/` + `/gpu/` SW handlers never ran; job cancel TOCTOU could overwrite `cancelled` with `completed` | (pending) | open | 2026-07-25 |
