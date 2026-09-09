# Launch-readiness autonomous audit — 2026-09-09 (waves)

Owner is away; running autonomous audit + safe-fix waves toward launch. Cadence:
**go slow, save often, work in waves** to avoid hitting limits. Each wave writes
its own findings file under `docs/audit/`, then safe fixes are applied and
committed incrementally (each gated by `tsc` + `npm test`).

## Focus (owner, 2026-09-09)
1. Bugs · 2. Navigation issues · 3. **Load/ready times** — screens, images, audio
   tools, and buttons that lag before acting (the priority).
Plus: cold-start/TTI, image prefetch/cache, memory/long-session, offline/empty/
error states, accessibility, entitlement correctness, honesty/copy, crash
resilience, regression gate.

## Guardrails (hard)
- NO `eas build`/`eas submit`, NO publishing/store actions, NO destructive/schema
  DB changes, NO bucket deletes, NO secret handling, NO external sends. Backend frozen.
- Every commit: `tsc` + `npm test` green. Stay on `audio-tools-engine`.
- Auto-apply only LOW-RISK/HIGH-CONFIDENCE fixes; FILE anything risky/design/
  backend/native-build-gated for owner review.

## Wave log
- **Wave 1** (load-latency + navigation) — LAUNCHED 2026-09-09. Findings:
  `docs/audit/wave1_load-latency.md`, `docs/audit/wave1_navigation.md`.

## Fixes applied (running list)
_(appended as safe fixes land)_

## Filed for owner review (running list)
_(appended as risky/deferred items are identified)_
