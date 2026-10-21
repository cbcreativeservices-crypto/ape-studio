# Handoff: cloud session → local session (2026-10-21)

**Read this first in the new local session.** Then `docs/SESSION_HANDOFF_2026-10-20.md` (its last section) and `docs/wiring/WIRING_FINDINGS_2026_10_20.md` (its last sections).

## Where the work is
- **Branch `dj-lab`** on GitHub, fully pushed. Pushes made Vercel previews only.
- **Nothing was published:** no eas build or submit, no OTA. `audio-tools-engine` and the store branch (`next-store-build`) were not touched.
- **Not checked on a phone:** nothing from 2026-10-19/20/21 has been seen on a device yet.

## Get it on your computer
| Where | What |
|---|---|
| Your PC | `cd C:\Users\profe\dev\ape-studio` then `git fetch origin` |
| Your PC | `cd C:\Users\profe\dev\ape-studio` then `git checkout dj-lab` |
| Your PC | `cd C:\Users\profe\dev\ape-studio` then `git pull origin dj-lab` |
| Your PC | `cd C:\Users\profe\dev\ape-studio` then `npm ci` (only if package-lock changed; it did not in this session) |
| Your PC | `cd C:\Users\profe\dev\ape-studio` then `node --test --test-timeout=120000 "test/**/*.test.ts"` (expect all pass) |

Do not switch branches in the ape-build-snap worktree (AGENTS.md). Use this folder or another worktree.

## What this session did (wiring A-grade audit, owner go 2026-10-20)
- **Rule book** (DRAFT, owner answers recorded): `docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md`.
- **Findings register** with every fix, grade and owner answer: `docs/wiring/WIRING_FINDINGS_2026_10_20.md`.
- **Round 1:** 62 findings fixed across all labs.
- **Round 2:** fresh graders; 72 more findings fixed (DJ, cable labs, Sound Systems, Signal Chain, Gain, Mastering, Digital, FX, Amp, Production, Calc, Meter).
- **Comp B batch 1** (cable labs): text fixes plus the drawing fixes B-PB-01 (¼-inch patch plugs), B-CI-01 (powered wedges with mains), B-CI-02 (drum fan-out), B-CI-04, B-CI-05. Report: `docs/wiring/comp_b/`.
- **New feature:** Sound Systems BUILD cables carry which console output (main L/R/mono, aux 1–8, matrix). Plan and the owner's 8 decisions: `docs/wiring/SOUNDSYSTEMS_OUTPUTS_PLAN_2026_10_20.md`.
- **DJ:**
  - PA L at house left on screen 4.
  - MIC/LINE switch on the powered speaker.
  - Booth monitor fed from PHONES (plays the headphone cue).
  - Unbalanced run drawn as a jack lead plus XLR adapter.
- **Calculator glossary names** follow Comp A's live entries.
- **Tests:** every fix is pinned in `test/wiringRules_*`, `test/wiringFix_*`, `test/artFix_*`, `test/calcGlossaryNames_20261020`, `test/consoleOutputs_20261020`.
- **New dev tool:** `scripts/artshot/` renders lab Skia art to PNG in plain Node (`node scripts/artshot/render.mjs <entry.tsx> <out.png> [w h scale]`; README inside). Entries that import pages need dummy `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Open items for the local session
1. **Phone checks** of the changed labs (DJ screens 3/4/20, Sound Systems BUILD and strip, Patchbay cutaway and pairs, Cable Install floor and rack, Gain, Amp, Miking SPK plan).
2. **Owner choices still open:**
   - Cable Install wedge power: linked wedge-to-wedge (as drawn) or a second quad box.
   - Drum fan-out: 4 tails (as drawn) or 3.
   - DJ unbalanced lead source: MASTER OUT + adapter (as drawn) or REC OUT RCA (needs an engine change).
   - PHONES-fed monitor sound: full feed (as built) or thin L−R (more realistic).
3. **Not done:**
   - Round-3 grading (to confirm grade A), including Miking/Mixing/Mic Select round 2.
   - De-esser split-band drawing (DE-R2-01).
   - DJ: freed MASTER L hangs over deck A's leads; red RCA leads over their LINE legends on screen 4.
   - Sound Systems: stage-left wall runs over the BARRIER label.
4. **Rule book:**
   - Owner sign-off still pending.
   - Comp B proposed 9 additions (TT vs ¼-inch; never tie two outputs; cable classes in bundles; C7 bi-amp = C; AES3id; wedge case; half-normal break side; combo geometry; D70 cite).
5. **Waiting on others:**
   - Comp B: the 22-claim fact-check (`docs/wiring/COMP_B_FACTCHECK_CABLE_CLAIMS_2026_10_20.md`).
   - Comp A: push `docs/CROSS_SESSION_HANDOFF.md`, which holds the Custom List function names. The Custom List HOLD stays on (owner: later).
6. **Merge:** `dj-lab` into the store branch, then the device/OTA check (unchanged from 10-19). No production OTA while a store build is in review (D74).

## Paste this into the new local session
```
Read docs/HANDOFF_CLOUD_TO_LOCAL_2026-10-21.md first, then the last sections of docs/wiring/WIRING_FINDINGS_2026_10_20.md and docs/SESSION_HANDOFF_2026-10-20.md. We are on branch dj-lab (pull it first). Show me status, then wait for my instructions. Rules: never push audio-tools-engine; never run eas or publish; don't edit package.json scripts, app.json or eas.json; commit only to dj-lab, and push only when I say.
```
